import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    UserPlus,
    User,
    LayoutGrid,
    Building2,
    Zap,
    Mic,
    ShieldCheck,
    Check,
    ChevronDown,
} from 'lucide-react';
import { STEP_COLORS } from '@/constants/onboarding';

const steps = [
    { id: 'account', label: 'Account', path: '/register', icon: UserPlus },
    { id: 'profile', label: 'Profile', path: '/onboarding/profile', icon: User },
    { id: 'selection', label: 'Service', path: '/onboarding/select-service', icon: LayoutGrid },
    { id: 'industry', label: 'Industry & Region', path: '/onboarding/industry', icon: Building2 },
    { id: 'plan', label: 'Scaling Tier', path: '/onboarding/plan', icon: Zap },
    { id: 'voice', label: 'Voice AI', path: '/onboarding/voice-setup', icon: Mic },
    { id: 'checkout', label: 'Secure', path: '/onboarding/checkout', icon: ShieldCheck },
];

export default function OnboardingHeader() {
    const location = useLocation();
    const [mobileExpanded, setMobileExpanded] = useState(false);

    const getActiveStepIndex = () => {
        const path = location.pathname;
        if (path === '/register') return 0;
        if (path === '/onboarding/profile') return 1;
        if (path === '/onboarding/select-service') return 2;
        if (path === '/onboarding/industry') return 3;
        if (['/onboarding/plan', '/onboarding/custom-crm', '/onboarding/audit'].includes(path)) return 4;
        if (path === '/onboarding/voice-setup') return 5;
        if (path === '/onboarding/checkout') return 6;
        if (path === '/onboarding/success') return 7;
        return 0;
    };

    const activeIndex = getActiveStepIndex();
    const activeStep = steps[Math.min(activeIndex, steps.length - 1)];
    const ActiveIcon = activeStep.icon;
    const progressPercent = Math.min((activeIndex / (steps.length - 1)) * 100, 100);
    const activeStepColor = STEP_COLORS[activeStep.id] || '#FFD700';

    return (
        <header className="fixed top-0 left-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06] py-3 md:py-4 px-4 md:px-12">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo - static during onboarding, no navigation */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xl md:text-2xl font-black text-white italic tracking-tighter">
                        Cx<span className="text-[#FFD700]">Track</span>
                    </span>
                </div>

                {/* Desktop Accordion Stepper */}
                <div className="hidden md:flex items-center gap-3 relative">
                    {/* Background progress track */}
                    <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-white/[0.04] -translate-y-1/2 rounded-full" />
                    <motion.div
                        className="absolute top-1/2 left-4 h-[2px] -translate-y-1/2 rounded-full"
                        style={{
                            background: `linear-gradient(to right, ${activeStepColor}, ${activeStepColor}66)`,
                        }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    />

                    {steps.map((step, index) => {
                        const isActive = index === activeIndex;
                        const isCompleted = index < activeIndex;
                        const Icon = step.icon;
                        const stepColor = STEP_COLORS[step.id] || '#FFD700';

                        return (
                            <div key={step.id} className="relative z-10 flex items-center">
                                {/* Completed: collapsed colored check */}
                                {isCompleted && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm"
                                        style={{
                                            backgroundColor: `${stepColor}15`,
                                            border: `1px solid ${stepColor}4D`,
                                        }}
                                    >
                                        <Check size={14} style={{ color: stepColor }} />
                                    </motion.div>
                                )}

                                {/* Active: expanded colored pill */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activePill"
                                        className="flex items-center gap-2.5 px-5 py-2.5 rounded-full"
                                        style={{
                                            backgroundColor: activeStepColor,
                                            boxShadow: `0 0 25px ${activeStepColor}59`,
                                            outline: `4px solid ${activeStepColor}1A`,
                                        }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                    >
                                        <Icon size={15} className="text-black" strokeWidth={2.5} />
                                        <span className="text-black text-[11px] font-black uppercase tracking-[0.15em] whitespace-nowrap">
                                            {step.label}
                                        </span>
                                    </motion.div>
                                )}

                                {/* Future: tiny dim dot */}
                                {!isActive && !isCompleted && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="w-7 h-7 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center"
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                                    </motion.div>
                                )}

                                {/* Connector spacing */}
                                {index < steps.length - 1 && (
                                    <div className={`${isActive ? 'w-6' : 'w-4'} shrink-0`} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Accordion Stepper */}
                <div className="md:hidden relative">
                    <button
                        onClick={() => setMobileExpanded(!mobileExpanded)}
                        className="flex items-center gap-2 min-h-[44px] px-1"
                    >
                        <ActiveIcon size={14} style={{ color: activeStepColor }} strokeWidth={2.5} />
                        <span style={{ color: activeStepColor }} className="text-xs font-black uppercase tracking-widest">
                            {activeStep.label}
                        </span>
                        <ChevronDown
                            size={12}
                            className={`text-white/40 transition-transform duration-200 ${mobileExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {/* Progress bar */}
                    <div className="w-28 h-1 bg-white/[0.06] rounded-full overflow-hidden mt-1">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: activeStepColor }}
                            animate={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
                            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        />
                    </div>

                    {/* Expanded overlay */}
                    <AnimatePresence>
                        {mobileExpanded && (
                            <>
                                {/* Backdrop */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/60 z-40"
                                    onClick={() => setMobileExpanded(false)}
                                />

                                {/* Step list */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full right-0 mt-3 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 z-50"
                                >
                                    <div className="p-2">
                                        {steps.map((step, index) => {
                                            const isActive = index === activeIndex;
                                            const isCompleted = index < activeIndex;
                                            const Icon = step.icon;
                                            const stepColor = STEP_COLORS[step.id] || '#FFD700';

                                            return (
                                                <div
                                                    key={step.id}
                                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                                        isActive ? 'bg-white/5' : ''
                                                    }`}
                                                    style={isActive ? { backgroundColor: `${stepColor}15` } : {}}
                                                >
                                                    {/* Step indicator */}
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                                        style={
                                                            isCompleted
                                                                ? { backgroundColor: `${stepColor}25`, border: `1px solid ${stepColor}4D` }
                                                                : isActive
                                                                    ? { backgroundColor: stepColor, boxShadow: `0 0 12px ${stepColor}4D` }
                                                                    : { backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                                                        }
                                                    >
                                                        {isCompleted ? (
                                                            <Check size={12} style={{ color: stepColor }} />
                                                        ) : isActive ? (
                                                            <Icon size={12} className="text-black" strokeWidth={2.5} />
                                                        ) : (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                                                        )}
                                                    </div>

                                                    {/* Step label */}
                                                    <span
                                                        className={`text-xs font-bold uppercase tracking-wider ${
                                                            !isActive && !isCompleted ? 'text-white/20' : isCompleted ? 'text-white/50' : ''
                                                        }`}
                                                        style={isActive ? { color: stepColor } : {}}
                                                    >
                                                        {step.label}
                                                    </span>

                                                    {/* Completed badge */}
                                                    {isCompleted && (
                                                        <span
                                                            className="ml-auto text-[9px] font-bold uppercase tracking-wider"
                                                            style={{ color: `${stepColor}80` }}
                                                        >
                                                            Done
                                                        </span>
                                                    )}
                                                    {isActive && (
                                                        <span
                                                            className="ml-auto text-[9px] font-bold uppercase tracking-wider"
                                                            style={{ color: stepColor }}
                                                        >
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
