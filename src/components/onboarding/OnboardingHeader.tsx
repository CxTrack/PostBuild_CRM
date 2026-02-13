import { Link, useLocation } from 'react-router-dom';

const steps = [
  { id: 'account', label: 'Account', path: '/register' },
  { id: 'selection', label: 'Selection', path: '/onboarding/select-service' },
  { id: 'setup', label: 'Setup', path: '/onboarding/plan' },
  { id: 'voice', label: 'Voice AI', path: '/onboarding/voice-setup' },
  { id: 'checkout', label: 'Secure', path: '/onboarding/checkout' },
];

export default function OnboardingHeader() {
  const location = useLocation();

  const getActiveStepIndex = () => {
    const path = location.pathname;
    if (path === '/register') return 0;
    if (path === '/onboarding/select-service') return 1;
    if (['/onboarding/plan', '/onboarding/custom-crm', '/onboarding/audit'].includes(path)) return 2;
    if (path === '/onboarding/voice-setup') return 3;
    if (path === '/onboarding/checkout') return 4;
    if (path === '/onboarding/success') return 5;
    return 0;
  };

  const activeIndex = getActiveStepIndex();

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 py-4 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="group flex items-center gap-2">
          <span className="text-2xl font-black text-white italic tracking-tighter">
            Cx<span className="text-[#FFD700]">Track</span>
          </span>
        </Link>

        {/* Desktop Stepper */}
        <div className="hidden md:flex items-center gap-12">
          {steps.map((step, index) => {
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    isActive
                      ? 'bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] ring-4 ring-[#FFD700]/20'
                      : isCompleted
                      ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30'
                      : 'bg-white/5 text-white/20 border border-white/10'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-[10px] uppercase font-black tracking-[0.2em] ${
                      isActive ? 'text-[#FFD700]' : 'text-white/20'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-[1px] ml-4 transition-all ${
                      isCompleted ? 'bg-[#FFD700]/30' : 'bg-white/5'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Progress Indicator */}
        <div className="md:hidden flex flex-col items-end">
          <div className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest mb-1">
            Step {Math.min(activeIndex + 1, 5)} / 5
          </div>
          <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFD700] transition-all duration-500"
              style={{ width: `${Math.min((activeIndex + 1) * 20, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
