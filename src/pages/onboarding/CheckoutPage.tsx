import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OrderSummary from '@/components/onboarding/OrderSummary';
import CheckoutForm from '@/components/onboarding/CheckoutForm';
import { updateOnboardingStep } from '@/utils/onboarding';

const pricingMap: Record<string, number> = {
  free: 0,
  business: 50,
  elite_premium: 350,
  enterprise: 1299,
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [lead, setLead] = useState<any>(null);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const leadData = sessionStorage.getItem('onboarding_lead');
    if (!leadData) {
      navigate('/register');
      return;
    }
    updateOnboardingStep('checkout');
    const parsedLead = JSON.parse(leadData);
    setLead(parsedLead);

    const priceParam = searchParams.get('price');
    const plan = searchParams.get('plan') || parsedLead.planId;

    const basePrice = priceParam ? parseInt(priceParam) : pricingMap[plan || ''] || 0;
    setAmount(basePrice);

    // If free plan, skip checkout and go directly to success
    if (plan === 'free') {
      navigate('/onboarding/success?plan=free&type=free');
    }
  }, [searchParams, navigate]);

  if (!lead) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center py-20 uppercase font-black tracking-widest animate-pulse">
          Initializing Secure Checkout...
        </div>
      </main>
    );
  }

  const planId = searchParams.get('plan') || lead.planId;

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-7xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
        >
          <span>&larr;</span> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: Summary */}
          <div>
            <OrderSummary />
          </div>

          {/* Right: Checkout */}
          <div className="space-y-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight italic">
                Final <span className="text-[#FFD700]">Step.</span>
              </h1>
              <p className="text-white/40 text-sm uppercase tracking-widest font-bold">
                Secure your infrastructure and start scaling with AI.
              </p>
            </div>

            <CheckoutForm
              amount={amount}
              planId={planId}
              metadata={{
                organizationId: lead.organizationId,
                email: lead.email,
                industry: lead.industry,
                voiceConfig: lead.voiceConfig ? JSON.stringify(lead.voiceConfig) : undefined,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
