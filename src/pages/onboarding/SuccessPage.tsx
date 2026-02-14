import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, MailSearch, ShieldCheck, Zap, CalendarDays, Loader2 } from 'lucide-react';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    const leadData = sessionStorage.getItem('onboarding_lead');
    if (leadData) {
      setLead(JSON.parse(leadData));
    }

    // Trigger confetti effect
    triggerConfetti();
  }, []);

  const triggerConfetti = () => {
    // Dynamic import of canvas-confetti (if available) or use CSS animation fallback
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
        // Fallback: confetti library not installed, use CSS animation
        console.log('Confetti animation triggered (library not installed)');
      });
  };

  const type = searchParams.get('type');
  const plan = searchParams.get('plan');

  const isRequest = type === 'custom_crm' || type === 'audit' || type === 'config' || type === 'enterprise';

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
