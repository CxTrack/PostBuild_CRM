import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Zap, Check, ArrowLeft, Loader2, AlertCircle, Mail } from 'lucide-react';
import { stripeBillingService } from '@/services/stripeBilling.service';
import { useOrganizationStore } from '@/stores/organizationStore';

export const UpgradePage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { from, moduleId } = (location.state as any) || {};
    const { currentOrganization } = useOrganizationStore();
    const [loadingTier, setLoadingTier] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const plans = [
        {
            name: 'Business',
            price: '$50',
            description: 'Perfect for growing small businesses',
            features: ['Up to 5 users', 'Full Pipeline access', 'Call logging & recording', 'Product catalog'],
            tier: 'business',
            color: 'indigo'
        },
        {
            name: 'Elite Premium',
            price: '$350',
            description: 'Scale your operations with advanced tools',
            features: ['Up to 10 users', 'Inventory management', 'Supplier tracking', 'Full financial analytics'],
            tier: 'elite_premium',
            color: 'purple',
            popular: true
        },
        {
            name: 'Enterprise',
            price: '$1,299',
            description: 'Total control for large organizations',
            features: ['Unlimited users', 'Multiple voice agents', 'Dedicated account manager', 'Custom AI models'],
            tier: 'enterprise',
            color: 'slate',
            contactSales: true
        }
    ];

    const handleUpgrade = async (tier: string) => {
        if (!currentOrganization?.id) {
            setError('No organization found. Please complete your profile first.');
            return;
        }
        setLoadingTier(tier);
        setError(null);

        try {
            const successUrl = `${window.location.origin}/dashboard/settings?tab=billing&upgraded=true`;
            const cancelUrl = `${window.location.origin}/upgrade`;

            const data = await stripeBillingService.createCheckoutSession(
                tier,
                successUrl,
                cancelUrl,
                currentOrganization.id
            );

            if (data.url) {
                window.location.href = data.url;
            } else {
                setError('Failed to create checkout session. Please try again.');
            }
        } catch (err: any) {
            console.error('Upgrade checkout error:', err);
            setError(err.message || 'Unable to start checkout. Please try again.');
        } finally {
            setLoadingTier(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-6xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-8 transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back
                </button>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {moduleId ? `Access ${moduleId.charAt(0).toUpperCase() + moduleId.slice(1)}` : 'Upgrade Your Plan'}
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        This module is reserved for our premium tiers. Choose the plan that best fits your business needs to unlock full access.
                        {from && <span className="block mt-2 text-sm opacity-50 font-mono">Origin: {from}</span>}
                    </p>
                    {error && (
                        <div className="mt-6 max-w-lg mx-auto p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm font-medium flex items-center gap-3">
                            <AlertCircle size={20} className="flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.tier}
                            className={`relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border-2 transition-all hover:scale-[1.02] ${plan.popular
                                ? 'border-indigo-500 ring-4 ring-indigo-500/10'
                                : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                                <div className="flex items-baseline mb-4">
                                    <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                                    <span className="text-gray-500 dark:text-gray-400 ml-2">/month</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start text-gray-700 dark:text-gray-300">
                                        <div className="mt-1 mr-3 text-green-500">
                                            <Check size={18} strokeWidth={3} />
                                        </div>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {(plan as any).contactSales ? (
                                <a
                                    href="mailto:sales@cxtrack.com?subject=Enterprise%20Plan%20Inquiry"
                                    className="w-full py-4 rounded-2xl font-bold flex items-center justify-center transition-all bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                                >
                                    <Mail size={18} className="mr-2" />
                                    Contact Sales
                                </a>
                            ) : (
                                <button
                                    onClick={() => handleUpgrade(plan.tier)}
                                    disabled={loadingTier !== null}
                                    className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center transition-all disabled:opacity-50 ${plan.popular
                                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                                        }`}
                                >
                                    {loadingTier === plan.tier ? (
                                        <>
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                            Redirecting...
                                        </>
                                    ) : (
                                        <>
                                            <Zap size={18} className="mr-2" />
                                            Upgrade to {plan.name}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        Need a custom solution for your agency? <button className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Contact Sales</button>
                    </p>
                </div>
            </div>
        </div>
    );
};
