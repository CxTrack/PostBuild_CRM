"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

const pillars = [
    {
        title: "Voice Agents",
        description: "Never miss a call. Never lose a lead. AI that qualifies, books, and closes while you sleep.",
        color: "#1E90FF",
        borderColor: "border-[#1E90FF]/30",
        bgColor: "bg-[#1E90FF]/5",
        textColor: "text-[#1E90FF]",
        href: "/voice-agents",
    },
    {
        title: "Custom CRMs",
        description: "Your data, unified. No more toggling between tools. Built for how you actually work.",
        color: "#FFD700",
        borderColor: "border-[#FFD700]/30",
        bgColor: "bg-[#FFD700]/5",
        textColor: "text-[#FFD700]",
        href: "/custom-crms",
    },
    {
        title: "AI Audits",
        description: "We find revenue hiding in your chaos. Manual work you didn't know could vanish.",
        color: "#34d399",
        borderColor: "border-emerald-400/30",
        bgColor: "bg-emerald-400/5",
        textColor: "text-emerald-400",
        href: "/ai-audits",
    },
];

export default function ThreePillarsBridge() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const headerOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5], [0.9, 1, 1]);
    const card1Opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.6], [0.85, 1, 1]);
    const card2Opacity = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0.85, 1, 1]);
    const card3Opacity = useTransform(scrollYProgress, [0.4, 0.55, 0.7], [0.85, 1, 1]);
    const cardOpacities = [card1Opacity, card2Opacity, card3Opacity];

    return (
        <section
            ref={sectionRef}
            className="relative py-24 md:py-32 overflow-hidden z-10"
        >
            {/* Section Divider */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-[#1E90FF]/50 to-transparent" />

            <div className="relative max-w-6xl mx-auto px-6">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ opacity: headerOpacity }}
                >
                    <span className="text-[#1E90FF] text-sm font-semibold tracking-[0.2em] uppercase">
                        What We Build
                    </span>
                    <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        Three Pillars.{" "}
                        <span className="text-[#1E90FF] text-glow-cyan">One Mission.</span>
                    </h2>
                </motion.div>

                {/* Pillar Cards */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {pillars.map((pillar, i) => (
                        <Link key={i} to={pillar.href} className="block">
                            <motion.div
                                className={`group relative p-8 md:p-10 rounded-2xl border ${pillar.borderColor} ${pillar.bgColor} backdrop-blur-sm hover:border-opacity-60 transition-colors cursor-pointer`}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                                whileHover={{
                                    scale: 1.06,
                                    boxShadow: `0 0 30px ${pillar.color}30, 0 0 60px ${pillar.color}15`,
                                    transition: { type: "spring", stiffness: 400, damping: 17 }
                                }}
                                whileTap={{ scale: 0.97 }}
                                style={{ opacity: cardOpacities[i] }}
                            >
                                {/* Top accent line */}
                                <div
                                    className="absolute top-0 left-6 right-6 h-px"
                                    style={{ background: `linear-gradient(90deg, transparent, ${pillar.color}40, transparent)` }}
                                />

                                <h3 className={`text-2xl font-bold ${pillar.textColor} mb-4`}>
                                    {pillar.title}
                                </h3>
                                <p className="text-white/80 leading-relaxed">
                                    {pillar.description}
                                </p>

                                {/* Arrow indicator */}
                                <div className={`mt-6 ${pillar.textColor} opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm font-medium`}>
                                    Learn more
                                    <svg className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
