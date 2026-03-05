import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ExternalLink, Loader2, Zap } from 'lucide-react';
import { pricingTiers } from '@/constants/onboarding';
import { stripeBillingService } from '@/services/stripeBilling.service';
import { useOrganizationStore } from '@/stores/organizationStore';

interface BillingPlanSectionProps {
  subscriptionTier?: string;
}

export default function BillingPlanSection({ subscriptionTier }: BillingPlanSectionProps) {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizationStore();
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  const tier = pricingTiers.find(t => t.id === subscriptionTier);
  const planName = tier?.name || 'Free Plan';
  const planAmount = tier?.priceDisplay || '$0/month';
  const isFreePlan = !subscriptionTier || subscriptionTier === 'free';
  const hasStripeCustomer = !!(currentOrganization as any)?.stripe_customer_id;

  const handleManageBilling = async () => {
    if (!currentOrganization?.id) return;
    setPortalLoading(true);
    setPortalError(null);

    try {
      const url = await stripeBillingService.getCustomerPortalUrl(currentOrganization.id);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('Portal error:', err);
      setPortalError(err.message || 'Failed to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{planName}</h3>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-full">
                Active
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isFreePlan ? 'All features included during your 30-day trial' : 'Your current subscription plan'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{planAmount}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {isFreePlan && (
              <button
                onClick={() => navigate('/upgrade')}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors flex items-center gap-2"
              >
                <Zap size={16} />
                Upgrade Plan
              </button>
            )}
            {!isFreePlan && hasStripeCustomer && (
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {portalLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ExternalLink size={16} />
                )}
                Manage Billing
              </button>
            )}
          </div>
        </div>
        {portalError && (
          <p className="mt-3 text-sm text-red-500">{portalError}</p>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-gray-400" />
        </div>
        {hasStripeCustomer ? (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Payment Method on File</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your payment methods through the{' '}
              <button onClick={handleManageBilling} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Stripe Billing Portal
              </button>.
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Payment Methods</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a payment method when you upgrade your plan.</p>
          </>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usage This Month</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Usage statistics will be available once billing is activated.</p>
      </div>
    </div>
  );
}
