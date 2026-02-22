/**
 * Quarterback Choice Configuration
 *
 * Builds the deterministic choice options and intro messages
 * shown in CoPilot when a user clicks a Quarterback insight.
 * No AI tokens are consumed for this step.
 */
import type { ChoiceOption } from '@/types/copilot-actions.types';
import type { QuarterbackInsight } from '@/hooks/useQuarterbackInsights';

/**
 * Build the choice options for a Quarterback insight.
 * Phone/call option is plan-gated (elite_premium+ for full access).
 */
export function buildQuarterbackChoices(
  insight: QuarterbackInsight,
  planTier: string
): ChoiceOption[] {
  const hasEmail = !!insight.email;
  const hasPhone = !!insight.phone;
  const isCallTierEligible = planTier === 'elite_premium' || planTier === 'enterprise';

  return [
    {
      id: 'draft_email',
      label: 'Draft a follow-up email',
      description: hasEmail
        ? `Send to ${insight.email}`
        : 'No email on file -- you can add one after drafting',
      icon: 'Mail',
    },
    {
      id: 'draft_sms',
      label: 'Draft a quick text',
      description: hasPhone
        ? `Text ${insight.phone}`
        : 'No phone on file -- you can add one after drafting',
      icon: 'MessageSquare',
    },
    {
      id: 'draft_call_script',
      label: 'Script an outgoing call',
      description: isCallTierEligible
        ? (hasPhone ? `Call ${insight.phone}` : 'No phone on file')
        : 'Upgrade to Elite Premium for outbound calling',
      icon: 'Phone',
      disabled: !isCallTierEligible,
      disabledReason: !isCallTierEligible
        ? 'Available on Elite Premium and Enterprise plans'
        : undefined,
    },
    {
      id: 'other',
      label: 'Something else',
      description: 'Tell me what you need',
      icon: 'Pencil',
    },
  ];
}

/**
 * Build the contextual intro message for each insight type.
 * Shown above the choices in the CoPilot panel.
 */
export function buildQuarterbackIntro(insight: QuarterbackInsight): string {
  switch (insight.type) {
    case 'inactive_customer':
      return `**${insight.customer_name}** hasn't been contacted in **${insight.days_inactive} days** and has a lifetime value of **$${insight.total_spent?.toLocaleString() || '0'}**. This is a re-engagement opportunity you don't want to miss.\n\nHow would you like to reach out?`;

    case 'stale_deal':
      return `The deal **"${insight.title}"** for **${insight.customer_name}** ($${insight.value?.toLocaleString() || '0'}) has been sitting in "${insight.stage}" for **${insight.days_stale} days** without movement. Time to push it forward.\n\nHow would you like to re-engage?`;

    case 'overdue_task':
      return `Task **"${insight.title}"** for **${insight.customer_name || 'unassigned'}** is **${insight.days_overdue} days overdue** (${insight.priority} priority). Let's get this handled.\n\nHow would you like to follow up?`;

    case 'expiring_quote':
      return `Quote **"${insight.title}"** for **${insight.customer_name}** ($${insight.total_amount?.toLocaleString() || '0'}) expires in **${insight.days_until_expiry} days**. Act now before it lapses.\n\nHow would you like to follow up?`;

    case 'overdue_invoice':
      return `Invoice **"${insight.title}"** for **${insight.customer_name}** has **$${insight.amount_outstanding?.toLocaleString() || '0'}** outstanding and is **${insight.days_overdue} days overdue**. Time to collect.\n\nHow would you like to reach out?`;

    case 'follow_up_reminder':
      return `Follow-up with **${insight.customer_name}** was ${insight.days_past_followup === 0 ? 'due today' : `due **${insight.days_past_followup} days ago**`}. Don't let this slip.\n\nHow would you like to follow up?`;

    default:
      return `${insight.message}\n\nHow would you like to take action?`;
  }
}
