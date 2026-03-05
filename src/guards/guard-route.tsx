import { Outlet, useNavigate } from "react-router-dom";
import { useVisibleModules } from "../hooks/useVisibleModules";
import { Lock, Zap, ArrowRight, Sparkles } from "lucide-react";

interface ProtectedRouteProps {
  user?: any;
  moduleId?: string;
}

export default function ProtectedRoute({ moduleId }: ProtectedRouteProps) {
  const { visibleModules, planTier } = useVisibleModules();
  const navigate = useNavigate();

  if (!moduleId) {
    return <Outlet />;
  }

  const module = visibleModules.find(m => m.id === moduleId);
  const isLocked = module?.isLocked;

  if (module && isLocked) {
    return (
      <div className="relative w-full h-full min-h-[calc(100vh-4rem)]">
        {/* Render actual page content behind the overlay */}
        <div className="pointer-events-none select-none" aria-hidden="true">
          <div className="blur-[3px] opacity-40 saturate-50">
            <Outlet />
          </div>
        </div>

        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-start justify-center z-40 pt-24">
          {/* Gradient fade at top to blend with blurred content */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/40 to-transparent dark:from-gray-900/80 dark:via-gray-900/40 dark:to-transparent pointer-events-none" />

          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 max-w-lg w-full mx-4 text-center">
            {/* Lock icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 flex items-center justify-center mb-5">
              <Lock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unlock {module.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {module.description || 'This premium feature is available on higher-tier plans.'}
              {' '}Upgrade to get full access and take your business to the next level.
            </p>

            {/* Quick feature highlights */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  What you'll get
                </span>
              </div>
              <ul className="space-y-2">
                {getUpgradeFeatures(moduleId).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/dashboard/upgrade', { state: { moduleId } })}
                className="w-full px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
              >
                <Zap className="w-5 h-5" />
                View Upgrade Plans
                <ArrowRight className="w-4 h-4" />
              </button>

              {planTier === 'free' && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Starting at $50/mo. Cancel anytime.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/** Module-specific feature highlights for the paywall */
function getUpgradeFeatures(moduleId: string): string[] {
  const features: Record<string, string[]> = {
    financials: [
      'Track revenue, expenses, and profit margins',
      'Commission tracking and payout management',
      'Financial reports and analytics dashboards',
      'Export financial data for accounting',
    ],
    inventory: [
      'Real-time stock level tracking',
      'Low stock alerts and reorder points',
      'Inventory valuation and cost tracking',
      'Barcode and SKU management',
    ],
    suppliers: [
      'Supplier directory and contact management',
      'Purchase order tracking',
      'Supplier performance analytics',
      'Cost comparison and negotiation history',
    ],
    email: [
      'Send and receive emails within CRM',
      'Email templates and automation',
      'Email tracking and open rates',
      'Integrated with customer records',
    ],
  };

  return features[moduleId] || [
    'Full access to premium features',
    'Advanced analytics and reporting',
    'Priority customer support',
    'Regular feature updates',
  ];
}
