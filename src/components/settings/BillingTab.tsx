import { useState } from 'react';
import { CreditCard, Zap, FileText } from 'lucide-react';
import { SubTabs } from '@/components/ui/SubTabs';
import BillingPlanSection from './BillingPlanSection';
import StripeConnectSettings from './StripeConnectSettings';
import BillingInvoicesSection from './BillingInvoicesSection';

interface BillingTabProps {
  organizationId: string;
  subscriptionTier?: string;
  initialSubTab?: string;
}

export default function BillingTab({ organizationId, subscriptionTier, initialSubTab }: BillingTabProps) {
  const [subTab, setSubTab] = useState(initialSubTab || 'plan');

  return (
    <div className="max-w-4xl space-y-6">
      <SubTabs
        tabs={[
          { id: 'plan', label: 'Plan & Usage', icon: CreditCard },
          { id: 'payment', label: 'Payment Processing', icon: Zap },
          { id: 'invoices', label: 'Invoices & Receipts', icon: FileText },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />
      {subTab === 'plan' && <BillingPlanSection subscriptionTier={subscriptionTier} />}
      {subTab === 'payment' && <StripeConnectSettings organizationId={organizationId} />}
      {subTab === 'invoices' && <BillingInvoicesSection organizationId={organizationId} />}
    </div>
  );
}
