import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingPageWrapper, { staggerContainer, staggerItem } from '@/components/onboarding/OnboardingPageWrapper';
import PricingTierCard from '@/components/onboarding/PricingTierCard';
import { pricingTiers, COUNTRY_OPTIONS } from '@/constants/onboarding';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

export default function PlanPage() {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<string>('elite_premium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lead, setLead] = useState<any>(null);

    const countryInfo = COUNTRY_OPTIONS.find(c => c.code === lead?.country) || COUNTRY_OPTIONS[0];

    useEffect(() => {
        const leadData = sessionStorage.getItem('onboarding_lead');
        if (!leadData) {
            navigate('/register');
            return;
        }
        const parsed = JSON.parse(leadData);
        setLead(parsed);

        // Guard: if industry/country not set, send back
        if (!parsed.industry || !parsed.country) {
            navigate('/onboarding/industry');
            return;
        }

        if (parsed.planId) setSelectedPlan(parsed.planId);
    }, [navigate]);

    const handleSelectPlan = (planId: string) => {
        if (isProcessing) return;
        setSelectedPlan(planId);
    };

    // Get auth token — reads directly from localStorage to bypass Supabase JS client's AbortController.
    const getAuthToken = async (): Promise<string | null> => {
        for (let i = 0; i < 8; i++) {
            for (const key of Object.keys(localStorage)) {
                if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                    try {
                        const stored = JSON.parse(localStorage.getItem(key) || '');
                        if (stored?.access_token) return stored.access_token;
                    } catch { /* malformed JSON, skip */ }
                }
            }
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) return session.access_token;
            } catch { /* AbortError — ignore */ }
            await new Promise(r => setTimeout(r, 500));
        }
        // Last resort: try refreshing session
        try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session?.access_token) return refreshData.session.access_token;
        } catch { /* ignore */ }
        return null;
    };

    const handleConfirmPlan = async () => {
        if (isProcessing || !selectedPlan || !lead) return;
        setIsProcessing(true);

        const selectedIndustry = lead.industry || 'general_business';
        const selectedCountry = lead.country || 'CA';
        const currencyInfo = COUNTRY_OPTIONS.find(c => c.code === selectedCountry) || COUNTRY_OPTIONS[0];

        try {
            const updatedLead = { ...lead, planId: selectedPlan };
            sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

            const token = await getAuthToken();
            if (!token) {
                toast.error('Session expired. Please log in again.');
                navigate('/login?redirect=/onboarding/plan');
                return;
            }

            if (lead?.userId) {
                // Generate slug with timestamp suffix to avoid collisions
                const baseSlug = lead.company
                    ?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    || `org-${lead.userId.slice(0, 8)}`;
                const slug = `${baseSlug}-${Date.now().toString(36)}`;

                // Check if org already exists (from a previous attempt)
                const checkRes = await fetch(
                    `${supabaseUrl}/rest/v1/organization_members?user_id=eq.${lead.userId}&select=organization_id&limit=1`,
                    {
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );
                const existingMembers = await checkRes.json();

                if (existingMembers?.length > 0 && existingMembers[0].organization_id) {
                    // User already has an org — update it
                    await fetch(
                        `${supabaseUrl}/rest/v1/organizations?id=eq.${existingMembers[0].organization_id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseAnonKey,
                                'Authorization': `Bearer ${token}`,
                                'Prefer': 'return=minimal',
                            },
                            body: JSON.stringify({
                                industry_template: selectedIndustry,
                                subscription_tier: selectedPlan,
                                business_country: selectedCountry,
                                business_currency: currencyInfo.currency,
                            }),
                        }
                    );
                    updatedLead.organizationId = existingMembers[0].organization_id;
                    sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));
                } else {
                    // Create org + owner via RPC
                    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/create_organization_with_owner`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            p_user_id: lead.userId,
                            p_user_email: lead.email,
                            p_user_full_name: `${lead.firstName} ${lead.lastName}`,
                            p_org_name: lead.company || `${lead.firstName}'s Business`,
                            p_org_slug: slug,
                            p_industry_template: selectedIndustry,
                            p_subscription_tier: selectedPlan,
                            p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            p_enabled_modules: ['dashboard', 'crm', 'calendar', 'quotes', 'invoices', 'tasks', 'pipeline', 'calls'],
                            p_max_users: selectedPlan === 'free' ? 1 : selectedPlan === 'business' ? 5 : selectedPlan === 'elite_premium' ? 10 : 999,
                            p_metadata: { trial_started_at: new Date().toISOString(), signup_source: 'crm_onboarding' },
                            p_business_name: lead.company || null,
                        }),
                    });

                    if (!rpcRes.ok) {
                        const errBody = await rpcRes.text();
                        console.error('[Onboarding] RPC error:', rpcRes.status, errBody);
                        if (errBody.includes('unique') || errBody.includes('duplicate') || errBody.includes('slug')) {
                            throw new Error('slug_collision');
                        }
                        throw new Error(`Organization creation failed (${rpcRes.status})`);
                    }

                    const orgId = await rpcRes.json();
                    updatedLead.organizationId = orgId;
                    sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

                    // Update org with country/currency
                    await fetch(
                        `${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': supabaseAnonKey,
                                'Authorization': `Bearer ${token}`,
                                'Prefer': 'return=minimal',
                            },
                            body: JSON.stringify({
                                business_country: selectedCountry,
                                business_currency: currencyInfo.currency,
                            }),
                        }
                    );
                }
            }

            // Navigate to next step
            if (selectedPlan === 'enterprise') {
                navigate('/onboarding/success?type=enterprise&plan=enterprise');
            } else {
                navigate(`/onboarding/voice-setup?plan=${selectedPlan}`);
            }
        } catch (error) {
            console.error('[Onboarding] Error selecting plan:', error);
            const message = error instanceof Error ? error.message : String(error);

            if (message === 'slug_collision') {
                toast.error('Name conflict detected. Retrying...');
                setIsProcessing(false);
                // Auto-retry once — the timestamp slug will be different
                setTimeout(() => handleConfirmPlan(), 500);
                return;
            } else if (message.includes('403') || message.includes('forbidden')) {
                toast.error('Permission error. Please try signing out and back in.');
            } else if (message.includes('network') || message.includes('fetch') || message.includes('Failed to fetch')) {
                toast.error('Network error. Check your connection and try again.');
            } else {
                toast.error(`Setup failed: ${message}`);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    // Reorder pricing tiers for mobile: elite_premium first
    const mobileTiers = [...pricingTiers].sort((a, b) => {
        if (a.highlighted) return -1;
        if (b.highlighted) return 1;
        return 0;
    });

    return (
        <main className="min-h-screen bg-black pt-28 md:pt-32 pb-20 px-4 md:px-6">
            <OnboardingHeader />

            <OnboardingPageWrapper>
                <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <button
                            onClick={() => navigate('/onboarding/industry')}
                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-2 md:mb-4 min-h-[48px]"
                        >
                            <span>&larr;</span> Back
                        </button>
                        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight italic">
                            Choose your <span className="text-[#FFD700]">Scaling Tier</span>
                        </h1>
                        <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
                            Select a plan that fits your current team size and growth goals.
                        </p>
                        <p className="text-white/40 text-xs md:text-sm uppercase tracking-widest font-bold">
                            Pricing in {countryInfo.currency}. Upgrade or downgrade anytime.
                        </p>
                    </div>

                    {/* Desktop: Plan Selection Grid */}
                    <motion.div
                        className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        {pricingTiers.map((tier) => (
                            <motion.div key={tier.id} variants={staggerItem}>
                                <PricingTierCard
                                    tier={tier}
                                    selected={selectedPlan === tier.id}
                                    onClick={() => handleSelectPlan(tier.id)}
                                    onConfirm={handleConfirmPlan}
                                />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Mobile: Stacked full-width, Elite Premium first */}
                    <motion.div
                        className="md:hidden space-y-4"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        {mobileTiers.map((tier) => (
                            <motion.div key={tier.id} variants={staggerItem}>
                                <PricingTierCard
                                    tier={tier}
                                    selected={selectedPlan === tier.id}
                                    onClick={() => handleSelectPlan(tier.id)}
                                    onConfirm={handleConfirmPlan}
                                />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Footer */}
                    <div className="text-center">
                        <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">
                            {isProcessing ? 'PROCESSING...' : 'SELECT A PLAN ABOVE TO CONTINUE'}
                        </p>
                    </div>
                </div>
            </OnboardingPageWrapper>
        </main>
    );
}
