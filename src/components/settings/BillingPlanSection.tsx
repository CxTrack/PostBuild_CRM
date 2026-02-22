import { CreditCard, FileText } from 'lucide-react';

interface BillingPlanSectionProps {
  subscriptionTier?: string;
}

export default function BillingPlanSection({ subscriptionTier }: BillingPlanSectionProps) {
  const planName = subscriptionTier === 'professional' ? 'Professional' :
    subscriptionTier === 'enterprise' ? 'Enterprise' :
    subscriptionTier === 'business' ? 'Business' :
    subscriptionTier === 'elite_premium' ? 'Elite Premium' :
    subscriptionTier === 'pilot' ? 'Pilot' :
    'Free Plan';

  const planAmount = subscriptionTier === 'professional' ? '$49' :
    subscriptionTier === 'enterprise' ? '$199' :
    subscriptionTier === 'business' ? '$99' :
    subscriptionTier === 'elite_premium' ? '$199' :
    subscriptionTier === 'pilot' ? '$50' :
    '$0';

  const isFreePlan = !subscriptionTier || subscriptionTier === 'free';

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
              <span className="text-gray-600 dark:text-gray-400">/ month</span>
            </div>
          </div>
          {isFreePlan && (
            <button className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors">
              Upgrade Plan
            </button>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Payment Methods</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Add a payment method when you upgrade your plan.</p>
      </div>

      {/* Usage Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Usage This Month</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Usage statistics will be available once billing is activated.</p>
      </div>
    </div>
  );
}
