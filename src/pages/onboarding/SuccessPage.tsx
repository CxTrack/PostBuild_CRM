import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, MailSearch, ShieldCheck, Zap, CalendarDays, Loader2, Phone, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import PhoneNumberReveal from '@/components/voice/PhoneNumberReveal';
import CallForwardingInstructions from '@/components/voice/CallForwardingInstructions';
import { retellService } from '@/services/retell.service';

type ProvisioningStep = 'idle' | 'reserving_number' | 'creating_agent' | 'configuring' | 'done' | 'error';

const PROVISIONING_MESSAGES: Record<ProvisioningStep, string> = {
  idle: '',
  reserving_number: 'Reserving your phone number...',
  creating_agent: 'Creating your AI agent...',
  configuring: 'Configuring call handling...',
  done: 'Your AI phone agent is ready!',
  error: 'Something went wrong.',
};

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [lead, setLead] = useState<any>(null);

  // Voice agent provisioning state
  const [provisioningStep, setProvisioningStep] = useState<ProvisioningStep>('idle');
  const [provisionedNumber, setProvisionedNumber] = useState<string | null>(null);
  const [provisionedNumberPretty, setProvisionedNumberPretty] = useState<string | null>(null);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  useEffect(() => {
    const leadData = sessionStorage.getItem('onboarding_lead');
    if (leadData) {
      setLead(JSON.parse(leadData));
    }

    // Trigger confetti effect
    triggerConfetti();
  }, []);

  const triggerConfetti = () => {
    import('canvas-confetti')
      .then((confetti) => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#ffffff', '#000000'],
        });
      })
      .catch(() => {
        console.log('Confetti animation triggered (library not installed)');
      });
  };

  const type = searchParams.get('type');
  const plan = searchParams.get('plan');
  const skipped = searchParams.get('skipped');

  const isRequest = type === 'custom_crm' || type === 'audit' || type === 'config' || type === 'enterprise';
  const hasVoiceConfig = lead?.voiceConfig && skipped !== 'voice';
  // Show voice provisioning for ANY industry that completed voice setup during onboarding
  const showVoiceProvisioning = hasVoiceConfig && !!lead?.voiceConfig?.agentName;

  const handleProvisionAgent = async () => {
    if (!lead?.organizationId || !lead?.voiceConfig) {
      toast.error('Missing configuration data. Please try again.');
      return;
    }

    setProvisionError(null);
    setProvisioningStep('reserving_number');

    // Simulate step progression while the actual API call runs
    const stepTimer1 = setTimeout(() => setProvisioningStep('creating_agent'), 2000);
    const stepTimer2 = setTimeout(() => setProvisioningStep('configuring'), 5000);

    try {
      const result = await retellService.provisionVoiceAgent({
        organizationId: lead.organizationId,
        agentName: lead.voiceConfig.agentName || 'AI Assistant',
        businessName: lead.company || lead.businessName || 'My Business',
        industry: lead.industry || 'general_business',
        ownerPhone: lead.phone || '',
        ownerName: lead.name || lead.firstName || '',
        agentInstructions: lead.voiceConfig.agentInstructions || '',
        countryCode: lead.country === 'CA' ? 'CA' : 'US',
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (result.success && result.phoneNumber) {
        setProvisionedNumber(result.phoneNumber);
        setProvisionedNumberPretty(result.phoneNumberPretty || result.phoneNumber);
        setProvisioningStep('done');

        // Extra confetti for the reveal
        triggerConfetti();
        toast.success('Your AI phone agent is live!');
      } else {
        setProvisioningStep('error');
        setProvisionError(result.error || 'Failed to provision agent. Please try again or contact support.');
        toast.error('Provisioning failed. You can try again or set this up later in Settings.');
      }
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setProvisioningStep('error');
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setProvisionError(message);
      toast.error('Provisioning failed.');
    }
  };

  const getHeadline = () => {
    if (type === 'custom_crm') return "Custom CRM Request Received.";
    if (type === 'config') return "Configuration Request Received.";
    if (type === 'audit') return "AI Audit Request Received.";
    if (type === 'enterprise') return "Enterprise Request Received.";
    return "You're all set. Welcome to CxTrack.";
  };

  const getSubheadline = () => {
    if (type === 'custom_crm') {
      return `Our architecture team is reviewing your requirements. We'll contact you at ${lead?.email} within 24 hours.`;
    }
    if (type === 'config') {
      return `Our integration specialists are reviewing your requirements. We'll reach out to ${lead?.email} within 1-2 business days to schedule a discovery call.`;
    }
    if (type === 'audit') {
      return "We're analyzing your team's operational bottlenecks. Expect your preliminary roadmap in our first session.";
    }
    if (type === 'enterprise') {
      return `Our enterprise team will reach out to ${lead?.email} within 24 hours to discuss your custom deployment.`;
    }
    return `Your ${plan?.toUpperCase() || 'CRM'} environment is being provisioned. Welcome to the future of high-performance business operations.`;
  };

  const roadmap = isRequest
    ? [
        { icon: MailSearch, label: 'Technical Review', status: 'In Progress', desc: 'Analyzing brief' },
        { icon: CalendarDays, label: 'Discovery Call', status: 'Upcoming', desc: 'Strategy session' },
        { icon: Zap, label: 'Full Proposal', status: 'Awaiting', desc: 'Final roadmap' },
      ]
    : [
        { icon: ShieldCheck, label: 'Environment Setup', status: 'Active', desc: 'Provisioning instance' },
        { icon: Zap, label: 'Agent Training', status: 'Awaiting', desc: 'Training AI models' },
        ...(plan === 'elite_premium' || plan === 'enterprise'
          ? [{ icon: CalendarDays, label: 'Kickoff Call', status: 'Awaiting', desc: 'Launch strategy' }]
          : []),
      ];

  return (
    <main className="min-h-screen bg-black pt-40 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-3xl mx-auto text-center space-y-12">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(255,215,0,0.3)] animate-bounce">
          {isRequest ? (
            <MailSearch size={40} className="text-black" />
          ) : (
            <CheckCircle2 size={40} className="text-black" />
          )}
        </div>

        {/* Headline */}
        <div className="space-y-6">
          <h1 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter">
            {getHeadline().split(' ').map((word, i) => (
              <span
                key={i}
                className={
                  word.includes('CxTrack') || word.includes('Received')
                    ? 'text-[#FFD700]'
                    : ''
                }
              >
                {word}{' '}
              </span>
            ))}
          </h1>
          <p className="text-white/60 text-xl leading-relaxed max-w-2xl mx-auto font-medium">
            {getSubheadline()}
          </p>
        </div>

        {/* Roadmap */}
        <div className="pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roadmap.map((step, i) => (
              <div
                key={i}
                className="relative p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 overflow-hidden group text-left"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    step.status === 'In Progress' || step.status === 'Active'
                      ? 'bg-[#FFD700]'
                      : 'bg-white/5'
                  }`}
                />

                <step.icon
                  size={28}
                  className={`mb-6 ${
                    step.status === 'In Progress' || step.status === 'Active'
                      ? 'text-[#FFD700]'
                      : 'text-white/20'
                  }`}
                />

                <div className="space-y-1">
                  <div className="text-white font-black text-xs uppercase tracking-[0.2em]">
                    {step.label}
                  </div>
                  <div className="text-white/30 text-[10px] uppercase font-bold tracking-widest">
                    {step.desc}
                  </div>
                </div>

                <div
                  className={`mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                    step.status === 'Active' || step.status === 'In Progress'
                      ? 'bg-[#FFD700]/10 text-[#FFD700]'
                      : 'bg-white/5 text-white/20'
                  }`}
                >
                  {step.status === 'In Progress' && (
                    <Loader2 size={8} className="animate-spin" />
                  )}
                  {step.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice Agent Provisioning Section */}
        {showVoiceProvisioning && !isRequest && (
          <div className="pt-8 space-y-8">
            <div className="h-px bg-gradient-to-r from-transparent via-[#FFD700]/20 to-transparent" />

            {provisioningStep === 'idle' && (
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-3">
                  <Bot className="text-[#FFD700]" size={24} />
                  <h2 className="text-2xl font-black text-white italic">
                    One More Thing...
                  </h2>
                </div>
                <p className="text-white/50 max-w-lg mx-auto">
                  Your AI phone agent <span className="text-[#FFD700] font-bold">{lead?.voiceConfig?.agentName}</span> is ready to go live.
                  Click below to get your dedicated phone number.
                </p>
                <button
                  onClick={handleProvisionAgent}
                  className="group relative px-12 py-6 bg-gradient-to-r from-[#FFD700] to-yellow-500 text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(255,215,0,0.3)]"
                >
                  <div className="flex items-center gap-3">
                    <Phone size={20} />
                    <span>Activate AI Phone Agent</span>
                  </div>
                </button>
              </div>
            )}

            {(provisioningStep === 'reserving_number' || provisioningStep === 'creating_agent' || provisioningStep === 'configuring') && (
              <div className="space-y-8">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="text-[#FFD700] animate-spin" size={24} />
                  <h2 className="text-2xl font-black text-white italic">
                    Setting Up Your Agent...
                  </h2>
                </div>

                <div className="max-w-md mx-auto space-y-4">
                  {(['reserving_number', 'creating_agent', 'configuring'] as ProvisioningStep[]).map((step) => {
                    const isActive = provisioningStep === step;
                    const isPast = ['reserving_number', 'creating_agent', 'configuring'].indexOf(provisioningStep) >
                      ['reserving_number', 'creating_agent', 'configuring'].indexOf(step);

                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                          isActive ? 'bg-[#FFD700]/10 border border-[#FFD700]/20' :
                          isPast ? 'bg-white/[0.02] border border-white/5' :
                          'bg-white/[0.01] border border-white/5 opacity-40'
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                        ) : isActive ? (
                          <Loader2 size={20} className="text-[#FFD700] animate-spin shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-white/20 shrink-0" />
                        )}
                        <span className={`text-sm font-bold ${isActive ? 'text-[#FFD700]' : isPast ? 'text-white/60' : 'text-white/30'}`}>
                          {PROVISIONING_MESSAGES[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {provisioningStep === 'done' && provisionedNumber && (
              <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-center gap-3">
                  <CheckCircle2 className="text-green-400" size={24} />
                  <h2 className="text-2xl font-black text-white italic">
                    Your Agent is <span className="text-green-400">Live!</span>
                  </h2>
                </div>

                <PhoneNumberReveal
                  phoneNumber={provisionedNumber}
                  phoneNumberPretty={provisionedNumberPretty || undefined}
                />

                <CallForwardingInstructions phoneNumber={provisionedNumber} />
              </div>
            )}

            {provisioningStep === 'error' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <p className="text-red-400 font-bold text-sm mb-2">Provisioning Failed</p>
                  <p className="text-white/50 text-sm">{provisionError}</p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleProvisionAgent}
                    className="px-8 py-3 bg-[#FFD700] text-black font-black rounded-xl text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all"
                  >
                    Try Again
                  </button>
                  <Link
                    to="/dashboard"
                    className="px-8 py-3 bg-white/5 text-white font-bold rounded-xl text-sm hover:bg-white/10 transition-all"
                  >
                    Skip &mdash; Set Up Later
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-12">
          {!isRequest && (
            <Link
              to="/dashboard"
              className="w-full md:w-auto px-12 py-6 bg-white text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(255,255,255,0.1)] text-center"
            >
              Go to Dashboard
            </Link>
          )}
          {(isRequest || plan === 'elite_premium' || plan === 'enterprise') && (
            <a
              href="https://cal.com/admincxtrack/30min"
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full md:w-auto px-12 py-6 rounded-2xl transition-all hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-sm font-black border text-center ${
                isRequest
                  ? 'bg-[#FFD700] text-black border-[#FFD700] shadow-[0_20px_40px_rgba(255,215,0,0.2)]'
                  : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
              }`}
            >
              Book Kickoff Call
            </a>
          )}
        </div>

        {/* Return Link */}
        <div className="pt-8">
          <Link
            to="/"
            className="text-white/20 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.4em]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
