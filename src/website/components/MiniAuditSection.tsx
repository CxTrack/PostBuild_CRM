"use client";

import { motion, useInView, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import MagneticButton from "./MagneticButton";

type Bottleneck = "lead-loss" | "data-scatter" | "unknown-leaks" | "slow-response" | "manual-reporting";
type TeamSize = "1-5" | "6-15" | "16-50" | "51-200" | "200+" | "";

const HOURLY_RATES: Record<string, number> = {
    "1-5": 50,
    "6-15": 75,
    "16-50": 100,
    "51-200": 125,
    "200+": 150,
};

const MULTIPLIERS: Record<string, number> = {
    "lead-loss": 3.5,
    "data-scatter": 2.0,
    "unknown-leaks": 4.0,
    "slow-response": 3.0,
    "manual-reporting": 2.5,
};

const BOTTLENECK_OPTIONS = [
    {
        value: "lead-loss" as Bottleneck,
        label: "Losing Leads",
        description: "We lose leads because we can't answer fast enough",
        color: "border-[#1E90FF]/30 bg-[#1E90FF]/5",
        activeColor: "border-[#1E90FF] bg-[#1E90FF]/15",
        textColor: "text-[#1E90FF]",
    },
    {
        value: "data-scatter" as Bottleneck,
        label: "Scattered Data",
        description: "Our data is scattered across 5+ tools",
        color: "border-[#FFD700]/30 bg-[#FFD700]/5",
        activeColor: "border-[#FFD700] bg-[#FFD700]/15",
        textColor: "text-[#FFD700]",
    },
    {
        value: "unknown-leaks" as Bottleneck,
        label: "Hidden Leaks",
        description: "We don't know where we're bleeding money",
        color: "border-emerald-400/30 bg-emerald-400/5",
        activeColor: "border-emerald-400 bg-emerald-400/15",
        textColor: "text-emerald-400",
    },
    {
        value: "slow-response" as Bottleneck,
        label: "Slow Response Times",
        description: "Customers wait too long for answers and follow-ups",
        color: "border-[#FF4444]/30 bg-[#FF4444]/5",
        activeColor: "border-[#FF4444] bg-[#FF4444]/15",
        textColor: "text-[#FF4444]",
    },
    {
        value: "manual-reporting" as Bottleneck,
        label: "Manual Reporting",
        description: "We spend hours building reports and crunching numbers by hand",
        color: "border-white/20 bg-white/5",
        activeColor: "border-white/50 bg-white/10",
        textColor: "text-white/80",
    },
];

const TEAM_SIZES: TeamSize[] = ["1-5", "6-15", "16-50", "51-200", "200+"];

const TOOLS = ["Salesforce", "HubSpot", "Zoho", "Custom CRM", "Spreadsheets", "Slack", "None", "Other"];

const SOLUTION_MAP: Record<string, { title: string; description: string }> = {
    "lead-loss": {
        title: "AI Voice Agents",
        description: "Instant pickup on every call. Qualify leads, book meetings, log everything — automatically.",
    },
    "data-scatter": {
        title: "Custom CRM",
        description: "One system built for your process. Automated data flow. No more toggling between tools.",
    },
    "unknown-leaks": {
        title: "Full AI Audit",
        description: "We map every process, find every leak, and deliver your automation roadmap in 4 weeks.",
    },
    "slow-response": {
        title: "AI Auto-Responders",
        description: "Instant responses on every channel. AI handles the first touch so your team focuses on closing.",
    },
    "manual-reporting": {
        title: "Automated Dashboards",
        description: "Real-time dashboards that build themselves. Scheduled reports delivered automatically — zero manual work.",
    },
};

const REPETITIVE_TASKS = [
    { id: "emails", label: "Answering & writing emails" },
    { id: "calls", label: "Answering & returning phone calls" },
    { id: "crm", label: "Updating CRM / logging activity" },
    { id: "data-entry", label: "Data entry & spreadsheet work" },
    { id: "scheduling", label: "Scheduling & calendar management" },
    { id: "reports", label: "Creating reports & dashboards" },
];

const HOUR_OPTIONS = [
    { value: 0, label: "None" },
    { value: 2, label: "~2h" },
    { value: 5, label: "~5h" },
    { value: 10, label: "~10h" },
    { value: 20, label: "~20h" },
];

function AnimatedCounter({ value }: { value: number }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true });

    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();

        const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            start = Math.round(eased * value);
            setDisplay(start);
            if (progress < 1) requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    }, [value, isInView]);

    return <span ref={ref}>${display.toLocaleString()}</span>;
}

export default function MiniAuditSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const [step, setStep] = useState(0);
    const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
    const [teamSize, setTeamSize] = useState<TeamSize>("");
    const [tools, setTools] = useState<string[]>([]);
    const [otherTool, setOtherTool] = useState("");
    const [taskHours, setTaskHours] = useState<Record<string, number>>({});
    const [customHourlyRate, setCustomHourlyRate] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [leadCaptured, setLeadCaptured] = useState(false);

    const totalHours = Object.values(taskHours).reduce((sum, h) => sum + h, 0);

    const calculateResults = () => {
        if (bottlenecks.length === 0 || !teamSize) return { annualCost: 0, savings: 0, hoursSaved: 0, hourlyRate: 0 };
        const hourlyRate = customHourlyRate || HOURLY_RATES[teamSize];
        const maxMultiplier = Math.max(...bottlenecks.map((b) => MULTIPLIERS[b]));
        const weeklyCost = totalHours * hourlyRate * maxMultiplier;
        const annualCost = weeklyCost * 52;
        const savings = Math.round(annualCost * 0.6);
        const hoursSaved = Math.round(totalHours * 0.6);
        return { annualCost: Math.round(annualCost), savings, hoursSaved, hourlyRate };
    };

    const toggleBottleneck = (value: Bottleneck) => {
        setBottlenecks((prev) =>
            prev.includes(value) ? prev.filter((b) => b !== value) : [...prev, value]
        );
    };

    const toggleTool = (tool: string) => {
        setTools((prev) =>
            prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
        );
    };

    const setTaskHour = (taskId: string, hours: number) => {
        setTaskHours((prev) => ({ ...prev, [taskId]: hours }));
    };

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const headerOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5], [0.9, 1, 1]);

    const slideVariants = {
        enter: { x: 80, opacity: 0 },
        center: { x: 0, opacity: 1 },
        exit: { x: -80, opacity: 0 },
    };

    return (
        <section
            id="audit"
            ref={sectionRef}
            className="relative py-24 md:py-32 lg:py-40 overflow-hidden z-10"
        >
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FFD700]/5 blur-[150px]" />

            {/* Divider */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-[#FFD700]/50 to-transparent" />

            <div className="relative max-w-3xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ opacity: headerOpacity }}
                >
                    <span className="text-[#FFD700] text-sm font-semibold tracking-[0.2em] uppercase">
                        Free Diagnostic
                    </span>
                    <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        Your{" "}
                        <span className="text-[#FFD700] text-glow-gold">Mini AI Audit</span>
                    </h2>
                    <p className="mt-4 text-white/80 text-lg">
                        Three questions. Your custom automation roadmap.
                    </p>
                </motion.div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mb-2">
                    {[0, 1, 2, 3, 4, 5].map((s) => (
                        <div
                            key={s}
                            className={`h-1 rounded-full transition-all duration-300 ${s < step
                                ? "w-8 bg-[#FFD700]"
                                : s === step
                                    ? "w-12 bg-[#FFD700]"
                                    : "w-8 bg-white/10"
                                }`}
                        />
                    ))}
                </div>
                <p className="text-white/30 text-xs text-right mb-6">
                    {step === 0 && "Pain Points"}
                    {step === 1 && "Team Info"}
                    {step === 2 && "Time Breakdown"}
                    {step === 3 && "Preview"}
                    {step === 4 && "Almost There"}
                    {step === 5 && "Results"}
                </p>

                {/* Question Steps */}
                <div className="relative min-h-[520px]">
                    <AnimatePresence mode="wait">
                        {/* Q1: Bottlenecks (multi-select) */}
                        {step === 0 && (
                            <motion.div
                                key="q1"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    What are your biggest bottlenecks?
                                </h3>
                                <p className="text-white/70 text-sm mb-6">Select all that apply</p>
                                <div className="space-y-3">
                                    {BOTTLENECK_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => toggleBottleneck(opt.value)}
                                            className={`w-full p-4 sm:p-5 rounded-xl border text-left transition-all duration-150 ${bottlenecks.includes(opt.value) ? opt.activeColor : opt.color
                                                } hover:scale-105 hover:shadow-[0_0_25px_rgba(255,255,255,0.08)]`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className={`font-semibold text-lg ${opt.textColor} mb-1`}>
                                                        {opt.label}
                                                    </div>
                                                    <p className="text-white/80 text-sm">{opt.description}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ml-4 transition-all ${bottlenecks.includes(opt.value)
                                                    ? "border-current bg-current/20"
                                                    : "border-white/20"
                                                    }`}>
                                                    {bottlenecks.includes(opt.value) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-6">
                                    <button
                                        onClick={() => bottlenecks.length > 0 && setStep(1)}
                                        disabled={bottlenecks.length === 0}
                                        className={`px-8 py-3 rounded-full font-semibold transition-all ${bottlenecks.length > 0
                                            ? "bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/30"
                                            : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                                            }`}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Q2: Team + Tools */}
                        {step === 1 && (
                            <motion.div
                                key="q2"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="text-2xl font-bold text-white mb-8">
                                    Tell us about your team.
                                </h3>

                                {/* Team Size */}
                                <div className="mb-8">
                                    <label className="text-white/80 text-sm font-medium mb-3 block">
                                        Team Size
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {TEAM_SIZES.map((size) => (
                                            <button
                                                key={size}
                                                onClick={() => setTeamSize(size)}
                                                className={`px-5 py-3 rounded-lg border text-sm font-medium transition-all duration-150 ${teamSize === size
                                                    ? "border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.15)]"
                                                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:scale-105 hover:shadow-[0_0_15px_rgba(255,215,0,0.08)]"
                                                    }`}
                                            >
                                                {size} people
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Current Tools */}
                                <div className="mb-8">
                                    <label className="text-white/80 text-sm font-medium mb-3 block">
                                        Current Tools (select all that apply)
                                    </label>
                                    <div className="flex flex-wrap gap-3">
                                        {TOOLS.map((tool) => (
                                            <button
                                                key={tool}
                                                onClick={() => toggleTool(tool)}
                                                className={`px-4 py-2 rounded-full border text-sm transition-all duration-150 ${tools.includes(tool)
                                                    ? "border-[#1E90FF] bg-[#1E90FF]/15 text-[#1E90FF] shadow-[0_0_20px_rgba(30,144,255,0.15)]"
                                                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:scale-105 hover:shadow-[0_0_15px_rgba(30,144,255,0.08)]"
                                                    }`}
                                            >
                                                {tool}
                                            </button>
                                        ))}
                                    </div>
                                    {tools.includes("Other") && (
                                        <input
                                            type="text"
                                            value={otherTool}
                                            onChange={(e) => setOtherTool(e.target.value)}
                                            placeholder="Type your tool name..."
                                            className="mt-3 w-full px-4 py-3 rounded-lg border border-white/10 bg-white/5 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-[#1E90FF]/50 transition-colors"
                                        />
                                    )}
                                </div>

                                {/* Custom Hourly Rate */}
                                <div className="mt-10 pt-8 border-t border-white/[0.06] mb-8">
                                    <p className="text-white/70 text-sm font-medium mb-1">
                                        Know your exact cost per hour?
                                    </p>
                                    <p className="text-white/40 text-xs mb-4">
                                        Include salary, benefits, overhead — the real number.
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-white/50 text-2xl font-light">$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max="500"
                                            placeholder={HOURLY_RATES[teamSize] ? String(HOURLY_RATES[teamSize]) : "75"}
                                            value={customHourlyRate || ""}
                                            onChange={(e) => setCustomHourlyRate(e.target.value ? Number(e.target.value) : null)}
                                            className="w-28 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-white text-center text-xl font-bold placeholder-white/20 focus:outline-none focus:border-[#FFD700]/40 focus:bg-white/[0.05] transition-all"
                                        />
                                        <span className="text-white/40 text-sm">/hr</span>
                                    </div>
                                    <p className="text-white/25 text-xs mt-3 text-center">
                                        {teamSize
                                            ? `Leave blank to use $${HOURLY_RATES[teamSize]}/hr (typical for ${teamSize} person teams)`
                                            : "Select team size first"
                                        }
                                    </p>
                                </div>

                                <div className="flex justify-center items-center gap-4">
                                    <button
                                        onClick={() => setStep(0)}
                                        className="px-6 py-3 rounded-full font-semibold text-white/40 hover:text-white/70 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => teamSize && setStep(2)}
                                        disabled={!teamSize}
                                        className={`px-8 py-3 rounded-full font-semibold transition-all ${teamSize
                                            ? "bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/30"
                                            : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                                            }`}
                                    >
                                        Continue
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Q3: Task-based time breakdown */}
                        {step === 2 && (
                            <motion.div
                                key="q3"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    Where does your team&apos;s time go?
                                </h3>
                                <p className="text-white/70 text-sm mb-6">
                                    Estimate hours per week for each task
                                </p>

                                <div className="space-y-3">
                                    {REPETITIVE_TASKS.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-3 sm:p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4"
                                        >
                                            <span className="text-white/70 text-sm font-medium shrink-0 min-w-0 sm:min-w-[220px]">
                                                {task.label}
                                            </span>
                                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                                {HOUR_OPTIONS.map((opt) => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => setTaskHour(task.id, opt.value)}
                                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${(taskHours[task.id] || 0) === opt.value
                                                            ? "bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.1)]"
                                                            : "border border-white/10 text-white/40 hover:border-white/20 hover:text-white/60 hover:scale-105"
                                                            }`}
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Live total */}
                                <div className="mt-6 text-center">
                                    <span className="text-4xl font-black text-[#FFD700] text-glow-gold">
                                        {totalHours}
                                    </span>
                                    <span className="text-lg text-white/40 ml-2">hrs/week total</span>
                                </div>

                                <div className="flex justify-center items-center gap-4 mt-6">
                                    <button
                                        onClick={() => setStep(1)}
                                        className="px-6 py-3 rounded-full font-semibold text-white/40 hover:text-white/70 transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={() => totalHours > 0 && setStep(3)}
                                        disabled={totalHours === 0}
                                        className={`px-8 py-3 rounded-full font-semibold transition-all ${totalHours > 0
                                            ? "bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/30"
                                            : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                                            }`}
                                    >
                                        See My Results
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* TEASER — The Hook */}
                        {step === 3 && (
                            <motion.div
                                key="teaser"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
                                {(() => {
                                    const results = calculateResults();
                                    return (
                                        <>
                                            <motion.p
                                                className="text-white/50 text-sm mb-2"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                Based on your answers...
                                            </motion.p>

                                            <motion.p
                                                className="text-[#FF4444]/80 text-xs uppercase tracking-[0.25em] mb-4"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.6 }}
                                            >
                                                You&apos;re bleeding
                                            </motion.p>

                                            <div className="text-5xl md:text-6xl lg:text-7xl font-black text-[#FF4444] text-glow-red mb-3">
                                                <AnimatedCounter value={results.annualCost} />
                                            </div>

                                            <motion.p
                                                className="text-white/40 text-lg mb-8"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 1.5 }}
                                            >
                                                every single year.
                                            </motion.p>

                                            {/* Blurred Value Preview */}
                                            <motion.div
                                                className="relative mb-10"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 2 }}
                                            >
                                                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto blur-[6px] opacity-40 pointer-events-none select-none">
                                                    <div className="p-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10">
                                                        <div className="text-2xl font-black text-emerald-400">??</div>
                                                        <p className="text-white/50 text-xs">hrs reclaimed</p>
                                                    </div>
                                                    <div className="p-5 rounded-xl border border-[#FFD700]/30 bg-[#FFD700]/10">
                                                        <div className="text-2xl font-black text-[#FFD700]">$???K</div>
                                                        <p className="text-white/50 text-xs">you could save</p>
                                                    </div>
                                                </div>

                                                {/* Overlay CTA */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="bg-black/90 backdrop-blur-sm px-5 py-3 rounded-full border border-white/10">
                                                        <span className="text-white/80 text-sm font-medium">
                                                            See how much you could save →
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* Urgency + CTA */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 2.3 }}
                                            >
                                                <p className="text-white/30 text-xs mb-4">
                                                    The fix takes 4 weeks. The bleed lasts forever.
                                                </p>

                                                <button
                                                    onClick={() => setStep(4)}
                                                    className="px-10 py-4 rounded-full font-bold bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 border border-[#FFD700]/50 text-[#FFD700] hover:from-[#FFD700]/30 hover:to-[#FFD700]/20 transition-all text-lg shadow-[0_0_30px_rgba(255,215,0,0.15)]"
                                                >
                                                    Unlock My Full Results
                                                </button>
                                            </motion.div>

                                            <button
                                                onClick={() => setStep(2)}
                                                className="block mx-auto mt-6 text-white/25 text-sm hover:text-white/40 transition-colors"
                                            >
                                                ← Adjust my answers
                                            </button>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}

                        {/* LEAD CAPTURE — The Exchange */}
                        {step === 4 && (
                            <motion.div
                                key="lead-capture"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
                                {/* Reminder of the pain */}
                                <div className="text-3xl md:text-4xl font-black text-[#FF4444] mb-1">
                                    ${calculateResults().annualCost.toLocaleString()}
                                </div>
                                <p className="text-white/40 text-sm mb-10">
                                    is walking out the door every year
                                </p>

                                {/* Value proposition */}
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                                    Want the full breakdown?
                                </h3>
                                <p className="text-white/50 text-sm mb-8 max-w-sm mx-auto">
                                    See exactly where the money goes, what you could automate,
                                    and how fast you&apos;d get it back.
                                </p>

                                {/* Form */}
                                <div className="max-w-xs mx-auto space-y-4">
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="First name"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            className="w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]/40 focus:bg-white/[0.05] transition-all text-center"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="email"
                                            placeholder="Work email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-5 py-4 rounded-xl border border-white/10 bg-white/[0.03] text-white placeholder-white/30 focus:outline-none focus:border-[#FFD700]/40 focus:bg-white/[0.05] transition-all text-center"
                                        />
                                    </div>

                                    <button
                                        onClick={async () => {
                                            if (email && firstName) {
                                                try {
                                                    await fetch("/api/audit-lead", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            email,
                                                            firstName,
                                                            bottlenecks,
                                                            teamSize,
                                                            totalHours,
                                                            customHourlyRate,
                                                            results: calculateResults(),
                                                        }),
                                                    });
                                                } catch (e) {
                                                    console.error("Lead submission failed:", e);
                                                }
                                                setLeadCaptured(true);
                                                setStep(5);
                                            }
                                        }}
                                        disabled={!email || !firstName}
                                        className={`w-full px-8 py-4 rounded-xl font-bold transition-all text-lg ${email && firstName
                                            ? "bg-gradient-to-r from-[#FFD700]/20 to-[#FFD700]/10 border border-[#FFD700]/50 text-[#FFD700] hover:from-[#FFD700]/30 hover:to-[#FFD700]/20 shadow-[0_0_30px_rgba(255,215,0,0.15)]"
                                            : "bg-white/[0.02] border border-white/10 text-white/30 cursor-not-allowed"
                                            }`}
                                    >
                                        Show Me Everything →
                                    </button>
                                </div>

                                {/* Trust signals */}
                                <div className="mt-8 space-y-2">
                                    <p className="text-white/20 text-xs">
                                        ✓ No credit card &nbsp;&nbsp; ✓ No sales call required &nbsp;&nbsp; ✓ Instant results
                                    </p>
                                    <p className="text-white/15 text-xs">
                                        We&apos;ll send a copy to your inbox too.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setStep(3)}
                                    className="block mx-auto mt-6 text-white/25 text-sm hover:text-white/40 transition-colors"
                                >
                                    ← Go back
                                </button>
                            </motion.div>
                        )}

                        {/* FULL RESULTS — The Payoff */}
                        {step === 5 && (
                            <motion.div
                                key="results"
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3 }}
                            >
                                {(() => {
                                    const results = calculateResults();
                                    const usedRate = customHourlyRate || HOURLY_RATES[teamSize];
                                    const maxMultiplier = Math.max(...bottlenecks.map((b) => MULTIPLIERS[b]));
                                    const weeklyWaste = totalHours * usedRate * maxMultiplier;

                                    return (
                                        <>
                                            {/* Personalized header */}
                                            <div className="text-center mb-10">
                                                {firstName && (
                                                    <p className="text-[#FFD700] text-sm font-medium mb-2">
                                                        {firstName}&apos;s Automation Opportunity
                                                    </p>
                                                )}
                                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                                    Here&apos;s what&apos;s really happening
                                                </h3>
                                                <p className="text-white/40 text-sm">
                                                    The numbers don&apos;t lie. Neither do we.
                                                </p>
                                            </div>

                                            {/* The Big Number */}
                                            <div className="text-center mb-8">
                                                <p className="text-[#FF4444]/60 text-xs uppercase tracking-[0.2em] mb-2">
                                                    Total annual cost of chaos
                                                </p>
                                                <div className="text-5xl md:text-6xl font-black text-[#FF4444] text-glow-red">
                                                    ${results.annualCost.toLocaleString()}
                                                </div>
                                                <p className="text-white/30 text-sm mt-3">
                                                    That&apos;s <span className="text-[#FF4444] font-bold">${Math.round(results.annualCost / 365).toLocaleString()}/day</span> walking out the door —
                                                    <span className="text-white/50"> ${Math.round(results.annualCost / 365 / 8).toLocaleString()} every working hour.</span>
                                                </p>
                                                <p className="text-white/20 text-xs mt-1">
                                                    {results.annualCost > 200000
                                                        ? `That's the salary of ${Math.round(results.annualCost / 65000)} full-time employees — doing nothing productive.`
                                                        : results.annualCost > 100000
                                                            ? `That's more than a full-time senior hire — burned on busywork.`
                                                            : `That's real money being wasted on tasks a machine could handle.`
                                                    }
                                                </p>
                                            </div>

                                            {/* Math Breakdown */}
                                            <div className="mb-10 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] max-w-md mx-auto">
                                                <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-4 text-center">
                                                    How we got here
                                                </p>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-white/50">Hours spent on manual work</span>
                                                        <span className="text-white font-bold">{totalHours} hrs/week</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-white/50">Your cost per hour</span>
                                                        <span className="text-white font-bold">${usedRate}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-white/50">Impact severity</span>
                                                            <p className="text-white/25 text-xs mt-0.5">Bottlenecks don&apos;t just waste time — they compound through lost leads, rework, and errors</p>
                                                        </div>
                                                        <span className="text-white/70 font-medium shrink-0 ml-4">{maxMultiplier.toFixed(1)}x</span>
                                                    </div>
                                                    <div className="h-px bg-white/10 my-2" />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-white/60">Weekly bleed</span>
                                                        <span className="text-[#FF4444] font-bold">${weeklyWaste.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-base">
                                                        <span className="text-white/70 font-medium">Annual total</span>
                                                        <span className="text-[#FF4444] font-black">${results.annualCost.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* What this means — Urgency block */}
                                            <div className="mb-10 p-5 rounded-2xl border border-[#FF4444]/10 bg-[#FF4444]/[0.03] max-w-md mx-auto text-center">
                                                <p className="text-[#FF4444]/70 text-xs uppercase tracking-[0.15em] mb-3">
                                                    What this actually means
                                                </p>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <div className="text-xl font-black text-[#FF4444]">
                                                            ${Math.round(weeklyWaste).toLocaleString()}
                                                        </div>
                                                        <p className="text-white/30 text-xs mt-1">gone this week</p>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-black text-[#FF4444]">
                                                            ${Math.round(weeklyWaste * 4).toLocaleString()}
                                                        </div>
                                                        <p className="text-white/30 text-xs mt-1">gone this month</p>
                                                    </div>
                                                    <div>
                                                        <div className="text-xl font-black text-[#FF4444]">
                                                            ${Math.round(weeklyWaste * 13).toLocaleString()}
                                                        </div>
                                                        <p className="text-white/30 text-xs mt-1">gone in 90 days</p>
                                                    </div>
                                                </div>
                                                <p className="text-white/20 text-xs mt-4">
                                                    Every week you wait, the meter keeps running.
                                                </p>
                                            </div>

                                            {/* The Good News */}
                                            <div className="text-center mb-6">
                                                <p className="text-emerald-400/60 text-xs uppercase tracking-[0.2em] mb-4">
                                                    But here&apos;s the good news
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                                                <div className="p-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 text-center">
                                                    <div className="text-4xl font-black text-emerald-400 mb-1">
                                                        {results.hoursSaved}
                                                    </div>
                                                    <p className="text-white/50 text-sm font-medium">hrs/week reclaimed</p>
                                                    <p className="text-white/25 text-xs mt-1">
                                                        That&apos;s {Math.round(results.hoursSaved * 52 / 40)} work weeks/year your team gets back
                                                    </p>
                                                </div>
                                                <div className="p-6 rounded-2xl border border-[#FFD700]/20 bg-[#FFD700]/5 text-center">
                                                    <div className="text-4xl font-black text-[#FFD700] mb-1">
                                                        ${(results.savings / 1000).toFixed(0)}K
                                                    </div>
                                                    <p className="text-white/50 text-sm font-medium">back in your pocket</p>
                                                    <p className="text-white/25 text-xs mt-1">
                                                        Conservative estimate — 60% automation rate
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ROI Payback */}
                                            <div className="text-center mb-10 max-w-md mx-auto">
                                                <p className="text-white/30 text-sm">
                                                    Most clients see full ROI in <span className="text-emerald-400 font-semibold">60–90 days</span>.
                                                    After that, it&apos;s pure profit.
                                                </p>
                                            </div>

                                            {/* Your Situation */}
                                            <div className="mb-10 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] max-w-md mx-auto text-left">
                                                <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-4">
                                                    Your situation at a glance
                                                </p>
                                                <div className="space-y-2 text-sm">
                                                    <p className="text-white/60">
                                                        <span className="text-white/40">Pain points: </span>
                                                        {bottlenecks.map(b => BOTTLENECK_OPTIONS.find(o => o.value === b)?.label).join(", ")}
                                                    </p>
                                                    <p className="text-white/60">
                                                        <span className="text-white/40">Team: </span>
                                                        {teamSize} people
                                                    </p>
                                                    <p className="text-white/60">
                                                        <span className="text-white/40">Manual time sink: </span>
                                                        {totalHours} hours every week
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Recommendations */}
                                            <div className="mb-10 max-w-md mx-auto">
                                                <p className="text-white/40 text-xs uppercase tracking-[0.15em] mb-4 text-left">
                                                    What we&apos;d fix first
                                                </p>
                                                <div className="space-y-3">
                                                    {bottlenecks.map((bn, i) => {
                                                        const sol = SOLUTION_MAP[bn];
                                                        return (
                                                            <div
                                                                key={bn}
                                                                className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-left hover:border-white/[0.12] transition-colors"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <span className="text-[#FFD700] text-xs font-bold mt-0.5">
                                                                        {i + 1}
                                                                    </span>
                                                                    <div>
                                                                        <h4 className="text-white font-bold mb-1">
                                                                            {sol.title}
                                                                        </h4>
                                                                        <p className="text-white/40 text-sm leading-relaxed">
                                                                            {sol.description}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Takeaway Summary Card */}
                                            <div className="mb-10 p-6 rounded-2xl border border-[#FFD700]/15 bg-[#FFD700]/[0.03] max-w-md mx-auto">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <svg className="w-5 h-5 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <p className="text-[#FFD700] text-sm font-semibold">
                                                        {firstName ? `${firstName}'s` : "Your"} Quick Audit Summary
                                                    </p>
                                                </div>
                                                <div className="space-y-2 text-sm text-left">
                                                    <p className="text-white/50">
                                                        <span className="text-[#FF4444] font-bold">${results.annualCost.toLocaleString()}</span> annual cost of manual chaos
                                                    </p>
                                                    <p className="text-white/50">
                                                        <span className="text-emerald-400 font-bold">${results.savings.toLocaleString()}</span> potential annual savings
                                                    </p>
                                                    <p className="text-white/50">
                                                        <span className="text-emerald-400 font-bold">{results.hoursSaved} hrs/week</span> freed up for revenue-generating work
                                                    </p>
                                                    <p className="text-white/50">
                                                        <span className="text-white/70 font-bold">Top priority:</span> {SOLUTION_MAP[bottlenecks[0]]?.title}
                                                    </p>
                                                </div>
                                                <p className="text-white/20 text-xs mt-3">
                                                    {email ? "A copy has been sent to your inbox." : ""}
                                                </p>
                                            </div>

                                            {/* Final CTA */}
                                            <div className="text-center">
                                                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                                                    This was the mini version.
                                                </h3>
                                                <p className="text-white/40 text-sm mb-2 max-w-sm mx-auto">
                                                    The full audit goes 10x deeper — we map every workflow, find every leak, and hand you a prioritized automation roadmap.
                                                </p>
                                                <p className="text-white/30 text-sm mb-6 max-w-sm mx-auto">
                                                    Takes us 4 weeks. Costs you nothing.
                                                </p>

                                                <MagneticButton href="/get-started">
                                                    Book Your Free Full Audit
                                                </MagneticButton>

                                                <p className="text-white/15 text-xs mt-4">
                                                    We only take on 5 new audits per month to ensure quality.
                                                </p>

                                                <button
                                                    onClick={() => {
                                                        setStep(0);
                                                        setBottlenecks([]);
                                                        setTeamSize("");
                                                        setTools([]);
                                                        setOtherTool("");
                                                        setTaskHours({});
                                                        setCustomHourlyRate(null);
                                                        setEmail("");
                                                        setFirstName("");
                                                        setLeadCaptured(false);
                                                    }}
                                                    className="block mx-auto mt-6 text-white/20 text-sm hover:text-white/40 transition-colors"
                                                >
                                                    Start over
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
