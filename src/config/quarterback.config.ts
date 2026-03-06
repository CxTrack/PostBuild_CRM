/**
 * AI Quarterback Configuration
 *
 * Industry-aware thresholds and priority scoring for QB insights.
 * Each industry has tuned detection windows based on typical business cycles.
 */

export interface QBIndustryThresholds {
  /** Days since last update before a pipeline item is "stale" */
  stale_deal_days: number;
  /** Days since last contact before a customer is "inactive" */
  inactive_customer_days: number;
  /** Days before quote expiry to surface the alert */
  expiring_quote_window_days: number;
}

/**
 * Industry-specific thresholds for QB insight detection.
 * These replace the hardcoded 14-day / 30-day defaults in the RPC.
 *
 * Rationale per industry:
 * - Mortgage/Gyms: Fast-moving cycles, short windows
 * - Real Estate/Legal: Longer deal cycles, wider windows
 * - Tax Accounting: Seasonal urgency during filing periods
 * - General Business: Balanced defaults
 */
export const INDUSTRY_QB_THRESHOLDS: Record<string, QBIndustryThresholds> = {
  mortgage_broker: {
    stale_deal_days: 7,
    inactive_customer_days: 14,
    expiring_quote_window_days: 7,
  },
  gyms_fitness: {
    stale_deal_days: 7,
    inactive_customer_days: 14,
    expiring_quote_window_days: 7,
  },
  tax_accounting: {
    stale_deal_days: 10,
    inactive_customer_days: 45,
    expiring_quote_window_days: 10,
  },
  healthcare: {
    stale_deal_days: 14,
    inactive_customer_days: 21,
    expiring_quote_window_days: 7,
  },
  real_estate: {
    stale_deal_days: 30,
    inactive_customer_days: 21,
    expiring_quote_window_days: 10,
  },
  legal_services: {
    stale_deal_days: 21,
    inactive_customer_days: 30,
    expiring_quote_window_days: 10,
  },
  contractors_home_services: {
    stale_deal_days: 21,
    inactive_customer_days: 30,
    expiring_quote_window_days: 7,
  },
  construction: {
    stale_deal_days: 21,
    inactive_customer_days: 30,
    expiring_quote_window_days: 10,
  },
  distribution_logistics: {
    stale_deal_days: 14,
    inactive_customer_days: 30,
    expiring_quote_window_days: 7,
  },
  agency: {
    stale_deal_days: 14,
    inactive_customer_days: 21,
    expiring_quote_window_days: 7,
  },
  general_business: {
    stale_deal_days: 14,
    inactive_customer_days: 30,
    expiring_quote_window_days: 7,
  },
};

const DEFAULT_THRESHOLDS: QBIndustryThresholds = {
  stale_deal_days: 14,
  inactive_customer_days: 30,
  expiring_quote_window_days: 7,
};

export function getQBThresholds(industry: string | null | undefined): QBIndustryThresholds {
  if (!industry) return DEFAULT_THRESHOLDS;
  return INDUSTRY_QB_THRESHOLDS[industry] || DEFAULT_THRESHOLDS;
}

/**
 * Priority scoring weights for QB insight ranking.
 * Higher score = shown first. Ensures high-value items surface above low-value ones.
 */

interface InsightTypeWeight {
  baseWeight: number;
  /** Multiplier for monetary value (0 = ignore money for this type) */
  valueMultiplier: number;
  /** Multiplier for days overdue/stale (urgency) */
  urgencyMultiplier: number;
}

export const INSIGHT_TYPE_WEIGHTS: Record<string, InsightTypeWeight> = {
  // Time-sensitive: meetings first
  upcoming_meeting: { baseWeight: 100, valueMultiplier: 0, urgencyMultiplier: 0 },
  // Revenue at risk
  overdue_invoice: { baseWeight: 80, valueMultiplier: 0.3, urgencyMultiplier: 0.5 },
  expiring_quote: { baseWeight: 75, valueMultiplier: 0.3, urgencyMultiplier: 0.8 },
  stale_deal: { baseWeight: 70, valueMultiplier: 0.4, urgencyMultiplier: 0.3 },
  // Relationship health
  new_email_received: { baseWeight: 65, valueMultiplier: 0, urgencyMultiplier: 0 },
  inactive_customer: { baseWeight: 60, valueMultiplier: 0.2, urgencyMultiplier: 0.2 },
  follow_up_reminder: { baseWeight: 55, valueMultiplier: 0, urgencyMultiplier: 0.5 },
  // Operational
  overdue_task: { baseWeight: 50, valueMultiplier: 0, urgencyMultiplier: 0.4 },
  low_stock: { baseWeight: 40, valueMultiplier: 0, urgencyMultiplier: 0 },
  // Healthcare-specific
  appointment_no_show: { baseWeight: 65, valueMultiplier: 0.2, urgencyMultiplier: 0 },
};

/**
 * Compute a priority score for a QB insight.
 * Used to sort insights so the most impactful ones appear first.
 */
export function scoreInsight(insight: {
  type: string;
  value?: number;
  total_amount?: number;
  amount_outstanding?: number;
  total_spent?: number;
  days_stale?: number;
  days_inactive?: number;
  days_overdue?: number;
  days_until_expiry?: number;
  days_past_followup?: number;
  priority?: string;
}): number {
  const weights = INSIGHT_TYPE_WEIGHTS[insight.type];
  if (!weights) return 0;

  let score = weights.baseWeight;

  // Value component: normalize to 0-30 range (cap at $100K for scoring)
  const monetaryValue = insight.amount_outstanding
    || insight.value
    || insight.total_amount
    || insight.total_spent
    || 0;
  if (weights.valueMultiplier > 0 && monetaryValue > 0) {
    const normalizedValue = Math.min(monetaryValue / 100_000, 1);
    score += normalizedValue * 30 * weights.valueMultiplier;
  }

  // Urgency component: normalize days to 0-20 range (cap at 60 days)
  const daysMetric = insight.days_overdue
    || insight.days_stale
    || insight.days_inactive
    || insight.days_past_followup
    || 0;
  // For expiring quotes, invert: fewer days = more urgent
  const urgencyDays = insight.type === 'expiring_quote'
    ? Math.max(0, 7 - (insight.days_until_expiry || 0))
    : daysMetric;
  if (weights.urgencyMultiplier > 0 && urgencyDays > 0) {
    const normalizedUrgency = Math.min(urgencyDays / 60, 1);
    score += normalizedUrgency * 20 * weights.urgencyMultiplier;
  }

  // Priority boost for tasks
  if (insight.priority === 'urgent') score += 15;
  else if (insight.priority === 'high') score += 8;

  return score;
}
