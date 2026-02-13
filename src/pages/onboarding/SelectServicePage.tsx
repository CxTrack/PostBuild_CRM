import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import ServiceCard from '@/components/onboarding/ServiceCard';

type ServiceType = 'crm' | 'custom' | 'audit';

export default function SelectServicePage() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceType>('crm');

  useEffect(() => {
    // Check if user has onboarding data from signup
    const leadData = sessionStorage.getItem('onboarding_lead');
    if (!leadData) {
      navigate('/register');
    }
  }, [navigate]);

  const handleContinue = () => {
    const leadData = JSON.parse(sessionStorage.getItem('onboarding_lead') || '{}');
    const updatedLead = { ...leadData, serviceType: selectedService };
    sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

    switch (selectedService) {
      case 'crm':
        navigate('/onboarding/plan');
        break;
      case 'custom':
        navigate('/onboarding/custom-crm');
        break;
      case 'audit':
        navigate('/onboarding/audit');
        break;
    }
  };

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-4xl mx-auto space-y-12">
        <div className="flex flex-col items-center text-center space-y-6">
          <button
            onClick={() => navigate('/register')}
            className="flex items-center gap-2 text-white/40 hover:text-[#FFD700] transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-4 group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Return to
            Account
          </button>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter italic">
            Choose Your <span className="text-[#FFD700]">Service</span>
          </h1>
          <p className="text-white/60 text-xl max-w-2xl font-medium">
            Select the CxTrack vertical tailored to your current business objectives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFD700]/5 to-transparent blur-[120px] -z-10" />

          <ServiceCard
            title="Out-of-the-Box CRM"
            accent="blue"
            features={[
              'Free tier available',
              'Voice AI included',
              'Industry-specific templates',
              'Built on CxTrack Core',
            ]}
            note="4 tiers available: Free, Business, Elite Premium, & Enterprise"
            selected={selectedService === 'crm'}
            onClick={() => setSelectedService('crm')}
          />

          <ServiceCard
            title="Custom CRM Build"
            accent="purple"
            features={[
              'Built for YOUR workflow',
              'Dedicated Support',
              'Unlimited Integrations',
              'Legacy migration',
            ]}
            note="Pricing provided after discovery call based on technical scope"
            selected={selectedService === 'custom'}
            onClick={() => setSelectedService('custom')}
          />

          <ServiceCard
            title="AI Audit"
            accent="emerald"
            features={[
              'Find bottlenecks',
              'Create roadmap',
              'ROI Projections',
              'Implementation guide',
            ]}
            note="Pricing based on company size and operational complexity"
            selected={selectedService === 'audit'}
            onClick={() => setSelectedService('audit')}
          />
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={handleContinue}
            className="group relative px-12 py-5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-lg rounded-2xl transition-all shadow-[0_20px_50px_rgba(255,215,0,0.2)] hover:shadow-[0_20px_50px_rgba(255,215,0,0.35)] active:scale-95"
          >
            CONTINUE TO NEXT STEP
            <span className="ml-3 group-hover:translate-x-1 transition-transform inline-block">
              &rarr;
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}
