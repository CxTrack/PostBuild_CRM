export interface PaymentTermsOption {
  key: string;
  label: string;
  days: number | null;
  description: string;
}

export const PAYMENT_TERMS_OPTIONS: PaymentTermsOption[] = [
  { key: 'due_on_receipt', label: 'Due on Receipt', days: 0, description: 'Payment due immediately upon receipt' },
  { key: 'net_7', label: 'Net 7', days: 7, description: 'Payment due in 7 days' },
  { key: 'net_15', label: 'Net 15', days: 15, description: 'Payment due in 15 days' },
  { key: 'net_30', label: 'Net 30', days: 30, description: 'Payment due in 30 days' },
  { key: 'net_45', label: 'Net 45', days: 45, description: 'Payment due in 45 days' },
  { key: 'net_60', label: 'Net 60', days: 60, description: 'Payment due in 60 days' },
  { key: 'net_90', label: 'Net 90', days: 90, description: 'Payment due in 90 days' },
  { key: 'split_50_50', label: '50% Upfront / 50% on Delivery', days: null, description: 'Split payment: half upfront, half on completion' },
  { key: 'milestone', label: 'Milestone-Based', days: null, description: 'Payment upon reaching project milestones' },
  { key: 'retainer', label: 'Monthly Retainer', days: null, description: 'Recurring monthly payment' },
  { key: 'pay_as_you_go', label: 'Pay as You Go', days: null, description: 'No fixed terms — pay when purchasing' },
  { key: 'custom', label: 'Custom', days: null, description: 'Custom payment terms' },
];

export function calculateDueDate(invoiceDate: string, termsKey: string): string | null {
  const option = PAYMENT_TERMS_OPTIONS.find(o => o.key === termsKey);

  // Pay-as-you-go has no due date
  if (termsKey === 'pay_as_you_go') return null;

  if (!option || option.days === null) {
    // For custom/milestone/retainer/split, default to 30 days
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  const date = new Date(invoiceDate);
  date.setDate(date.getDate() + option.days);
  return date.toISOString().split('T')[0];
}

export function getTermsLabel(termsKey: string | null | undefined): string {
  if (!termsKey) return '';
  const option = PAYMENT_TERMS_OPTIONS.find(o => o.key === termsKey);
  return option?.label || termsKey; // Fallback to raw string for old data
}

export function getTermsDays(termsKey: string): number | null {
  const option = PAYMENT_TERMS_OPTIONS.find(o => o.key === termsKey);
  return option?.days ?? null;
}
