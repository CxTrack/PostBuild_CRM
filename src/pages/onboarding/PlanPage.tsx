import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import IndustryCard from '@/components/onboarding/IndustryCard';
import PricingTierCard from '@/components/onboarding/PricingTierCard';
import { supabase } from '@/lib/supabase';

const industries = [
    { id: 'tax_accounting', label: 'Tax & Accounting', icon: 'calculate', description: 'Client intake, document collection, deadline tracking' },
    { id: 'distribution_logistics', label: 'Distribution & Logistics', icon: 'local_shipping', description: 'Inventory, supplier tracking, order processing' },
    { id: 'gyms_fitness', label: 'Gyms & Fitness', icon: 'fitness_center', description: 'Member management, class scheduling, payments' },
    { id: 'contractors_home_services', label: 'Contractors & Home Services', icon: 'construction', description: 'Job estimation, scheduling, invoicing' },
    { id: 'healthcare', label: 'Healthcare', icon: 'medical_services', description: 'Patient intake, appointments, HIPAA workflows' },
    { id: 'real_estate', label: 'Real Estate', icon: 'home_work', description: 'Lead nurturing, listings, transaction tracking' },
    { id: 'legal_services', label: 'Legal Services', icon: 'gavel', description: 'Client intake, case management, billing' },
    { id: 'software_development', label: 'Software Development', icon: 'code', description: 'Sprint management, bug tracking, releases' },
    { id: 'mortgage_broker', label: 'Mortgage Broker', icon: 'account_balance', description: 'Loan pipeline, lender management, rate tracking' },
    { id: 'general_business', label: 'General Business', icon: 'business', description: 'Standard CRM pipelines, lead management' },
];

const pricingTiers = [
    {
        id: 'free',
        name: 'FREE',
        price: 0,
        priceDisplay: '$0/month',
        badge: 'TRY IT',
        bestFor: 'Wanting to try CxTrack',
        features: [
            '1 CRM User (single seat only)',
            'Basic invoices & quotes',
            '10 invoices/quotes per month',
            'Voice AI Agent (60 min) - FIRST MONTH ONLY',
        ],
        cta: 'Start Free',
        skipPayment: true,
    },
    {
        id: 'business',
        name: 'BUSINESS',
        price: 50,
        priceDisplay: '$50/mo → $150/mo',
        badge: null,
        bestFor: 'Growing SMEs + Basic AI',
        features: [
            'Up to 5 CRM Users',
            '100 customer records',
            '50 invoices & quotes/month',
            'Voice AI Agent (100 min/month)',
            'Inventory & pipeline access',
        ],
        pricingNote: '$50/mo for first 3 months, then $150/mo',
        cta: 'Select Business',
    },
    {
        id: 'elite_premium',
        name: 'ELITE PREMIUM',
        price: 350,
        priceDisplay: '$350/mo',
        badge: 'MOST POPULAR',
        badgeColor: 'gold',
        bestFor: 'Scaling businesses',
        features: [
            '10 CRM Users',
            'Unlimited customers',
            'Unlimited invoices & quotes',
            'Voice AI Agent (500 min/month)',
            'Full suite of automations',
        ],
        cta: 'Select Elite Premium',
        highlighted: true,
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        price: 1299,
        priceDisplay: '$1,299/mo+',
        badge: 'FULL AGENCY SUITE',
        bestFor: 'Agencies & Multi-location',
        features: [
            'Unlimited users & customers',
            'Multiple Voice Agents',
            'Advanced automations',
            'Dedicated account manager',
            'Skool community access',
        ],
        cta: 'Select Enterprise',
    },
];

export default function PlanPage() {
    const navigate = useNavigate();
    const [selectedIndustry, setSelectedIndustry] = useState<string>('general_business');
    const [selectedPlan, setSelectedPlan] = useState<string>('elite_premium');
    const [isProcessing, setIsProcessing] = useState(false);
    const [lead, setLead] = useState<any>(null);

    useEffect(() => {
        const leadData = sessionStorage.getItem('onboarding_lead');
        if (!leadData) {
            navigate('/register');
            return;
        }
        const parsed = JSON.parse(leadData);
        setLead(parsed);
        if (parsed.industry) {
            setSelectedIndustry(parsed.industry);
        }
    }, [navigate]);

    // Just visually select a plan (no navigation)
    const handleSelectPlan = (planId: string) => {
        if (isProcessing) return;
        setSelectedPlan(planId);
    };

    // Helper: Create organization with retry logic for AbortErrors
    const createOrganizationWithRetry = async (retries = 3): Promise<{ id: string } | null> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .insert({
                        name: lead.company || `${lead.firstName}'s Business`,
                        slug: lead.company?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `org-${lead.userId.slice(0, 8)}`,
                        industry_template: selectedIndustry,
                        subscription_tier: selectedPlan === 'free' ? 'free' : selectedPlan === 'business' ? 'business' : selectedPlan === 'elite_premium' ? 'elite_premium' : 'enterprise',
                        primary_color: '#FFD700',
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                        business_hours: { start: '09:00', end: '17:00' },
                        enabled_modules: ['dashboard', 'crm', 'calendar', 'quotes', 'invoices', 'tasks', 'pipeline', 'calls'],
                        max_users: selectedPlan === 'free' ? 1 : selectedPlan === 'business' ? 5 : selectedPlan === 'elite_premium' ? 10 : 999,
                        metadata: {
                            trial_started_at: new Date().toISOString(),
                            signup_source: 'crm_onboarding',
                        },
                    })
                    .select()
                    .single();

                if (orgError) {
                    // Check if it's an AbortError - retry
                    const isAbortError = orgError.message?.includes('abort') ||
                                        (orgError as Error).name === 'AbortError';
                    if (isAbortError && attempt < retries) {
                        console.warn(`[Onboarding] Org creation attempt ${attempt} aborted, retrying...`);
                        await new Promise(r => setTimeout(r, 500 * attempt)); // Exponential backoff
                        continue;
                    }
                    throw orgError;
                }

                return orgData;
            } catch (err) {
                // Check for AbortError and retry
                const isAbortError = err instanceof Error &&
                    (err.name === 'AbortError' || err.message?.includes('abort'));
                if (isAbortError && attempt < retries) {
                    console.warn(`[Onboarding] Org creation attempt ${attempt} aborted, retrying...`);
                    await new Promise(r => setTimeout(r, 500 * attempt));
                    continue;
                }
                throw err;
            }
        }
        return null;
    };

    // Confirm selection and proceed to next step
    const handleConfirmPlan = async () => {
        if (isProcessing || !selectedPlan) return;
        setIsProcessing(true);

        try {
            // Update session storage
            const updatedLead = { ...lead, industry: selectedIndustry, planId: selectedPlan };
            sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

            // Create organization in database
            if (lead?.userId) {
                // First check if user already has an organization (from previous attempt)
                const { data: existingMember } = await supabase
                    .from('organization_members')
                    .select('organization_id')
                    .eq('user_id', lead.userId)
                    .maybeSingle();

                if (existingMember?.organization_id) {
                    // User already has an org - just update it and continue
                    await supabase
                        .from('organizations')
                        .update({
                            industry_template: selectedIndustry,
                            subscription_tier: selectedPlan === 'free' ? 'free' : selectedPlan === 'business' ? 'business' : selectedPlan === 'elite_premium' ? 'elite_premium' : 'enterprise',
                        })
                        .eq('id', existingMember.organization_id);

                    updatedLead.organizationId = existingMember.organization_id;
                    sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));
                } else {
                    // Step 1: Create public.users record first (FK constraint requirement)
                    await supabase.from('users').upsert({
                        id: lead.userId,
                        email: lead.email,
                    }, { onConflict: 'id' });

                    // Step 2: Create new organization with retry logic
                    const orgData = await createOrganizationWithRetry(3);

                    if (!orgData) {
                        throw new Error('Failed to create organization after multiple attempts');
                    }

                    // Step 3: Create user_profiles (FK to public.users)
                    const { error: profileError } = await supabase.from('user_profiles').upsert({
                        id: lead.userId,
                        email: lead.email,
                        full_name: `${lead.firstName} ${lead.lastName}`,
                        business_name: lead.company || null,
                        organization_id: orgData.id,
                    }, { onConflict: 'id' });

                    if (profileError) {
                        console.error('[Onboarding] user_profiles error:', profileError);
                    }

                    // Step 4: Create organization_members (FK to user_profiles)
                    const { error: memberError } = await supabase.from('organization_members').upsert({
                        organization_id: orgData.id,
                        user_id: lead.userId,
                        role: 'owner',
                        permissions: {},
                        calendar_delegation: [],
                        can_view_team_calendars: true,
                    }, { onConflict: 'organization_id,user_id' });

                    if (memberError) {
                        console.error('[Onboarding] organization_members error:', memberError);
                    }

                    // Store org ID in session
                    updatedLead.organizationId = orgData.id;
                    sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));
                }
            }

            // Navigate to next step
            if (selectedPlan === 'enterprise') {
                // Enterprise goes to contact sales
                navigate('/onboarding/enterprise');
            } else {
                navigate(`/onboarding/voice-setup?plan=${selectedPlan}`);
            }
        } catch (error) {
            console.error('[Onboarding] Error selecting plan:', error);
            toast.error('Setup failed. Please try again.');
            setIsProcessing(false);
            return; // Don't navigate on error
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-black pt-32 pb-20 px-6">
            <OnboardingHeader />

            {/* Add Material Icons */}
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

            <div className="max-w-7xl mx-auto space-y-16">
                {/* Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <button
                        onClick={() => navigate('/onboarding/select-service')}
                        className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-4"
                    >
                        <span>&larr;</span> Back
                    </button>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight italic">
                        Choose Your <span className="text-[#FFD700]">Operations Kit</span>
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Select an industry and a plan that fits your current team size and growth goals.
                    </p>
                </div>

                {/* Industry Selection */}
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 italic tracking-tight">
                            What <span className="text-[#FFD700]">Industry</span> are we building for?
                        </h2>
                        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
                            We'll tailor your CRM templates and AI logic based on your choice.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {industries.map((ind) => (
                            <IndustryCard
                                key={ind.id}
                                {...ind}
                                selected={selectedIndustry === ind.id}
                                onClick={() => setSelectedIndustry(ind.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* Plan Selection */}
                <section>
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 italic tracking-tight">
                            Choose your <span className="text-[#FFD700]">Scaling Tier</span>
                        </h2>
                        <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
                            Pricing in CAD. Upgrade or downgrade anytime.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingTiers.map((tier) => (
                            <PricingTierCard
                                key={tier.id}
                                tier={tier}
                                selected={selectedPlan === tier.id}
                                onClick={() => handleSelectPlan(tier.id)}
                                onConfirm={handleConfirmPlan}
                            />
                        ))}
                    </div>
                </section>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-white/20 text-[10px] uppercase font-black tracking-widest">
                        {isProcessing ? 'PROCESSING...' : 'SELECT A PLAN ABOVE TO CONTINUE'}
                    </p>
                </div>
            </div>
        </main>
    );
}
