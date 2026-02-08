"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import SpaceParticles from "./SpaceParticles";
import MagneticButton from "./MagneticButton";

interface UseCase {
    industry: string;
    problem: string;
    solution: string;
    result: string;
}

interface Feature {
    title: string;
    description: string;
}

interface PillarPageProps {
    label: string;
    labelColor: string;
    headline: string;
    highlightText: string;
    highlightColor: string;
    highlightGlowClass: string;
    description: string;
    stat: { value: string; label: string };
    features: Feature[];
    useCases: UseCase[];
    accentColor: string;
    ctaText: string;
}

export default function PillarPageLayout({
    label,
    labelColor,
    headline,
    highlightText,
    highlightColor,
    highlightGlowClass,
    description,
    stat,
    features,
    useCases,
    accentColor,
    ctaText,
}: PillarPageProps) {
    const heroRef = useRef<HTMLDivElement>(null);
    const featuresRef = useRef<HTMLDivElement>(null);
    const midCtaRef = useRef<HTMLDivElement>(null);
    const useCasesRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);

    const heroInView = useInView(heroRef, { once: true, margin: "-50px" });
    const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });
    const midCtaInView = useInView(midCtaRef, { once: true, margin: "-50px" });
    const useCasesInView = useInView(useCasesRef, { once: true, margin: "-100px" });
    const ctaInView = useInView(ctaRef, { once: true, margin: "-100px" });

    const { scrollYProgress: heroScroll } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });
    const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0.3]);

    return (
        <main className="bg-transparent min-h-screen relative">
            <SpaceParticles />

            {/* Back Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors group"
                    >
                        <svg
                            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                    <Link href="/" className="opacity-60 hover:opacity-100 transition-opacity">
                        <img src="/cxtrack-logo.png" alt="CxTrack" className="h-8" />
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section ref={heroRef} className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden z-10">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[200px]"
                    style={{ background: `${accentColor}10` }}
                />

                <motion.div
                    className="relative max-w-4xl mx-auto px-6 text-center"
                    style={{ opacity: heroOpacity }}
                >
                    <motion.span
                        className={`${labelColor} text-sm font-semibold tracking-[0.2em] uppercase`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        {label}
                    </motion.span>

                    <motion.div
                        className="mt-8 mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        <div className={`text-7xl md:text-8xl lg:text-9xl font-black ${highlightColor} ${highlightGlowClass}`}>
                            {stat.value}
                        </div>
                        <p className="text-white/50 text-lg font-medium mt-2">{stat.label}</p>
                    </motion.div>

                    <motion.h1
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.3 }}
                    >
                        {headline}{" "}
                        <span className={`${highlightColor} ${highlightGlowClass}`}>{highlightText}</span>
                    </motion.h1>

                    <motion.p
                        className="text-white/60 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={heroInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.45 }}
                    >
                        {description}
                    </motion.p>
                </motion.div>
            </section>

            {/* Divider */}
            <div className="flex justify-center">
                <div
                    className="w-px h-20"
                    style={{ background: `linear-gradient(to bottom, transparent, ${accentColor}60, transparent)` }}
                />
            </div>

            {/* Features Section */}
            <section ref={featuresRef} className="relative py-20 md:py-28 overflow-hidden z-10">
                <div className="relative max-w-6xl mx-auto px-6">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        <span className={`${labelColor} text-sm font-semibold tracking-[0.2em] uppercase`}>
                            Capabilities
                        </span>
                        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                            What You Get
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className="p-6 md:p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-default"
                                initial={{ opacity: 0, y: 30 }}
                                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
                                whileHover={{
                                    scale: 1.04,
                                    borderColor: `${accentColor}40`,
                                    boxShadow: `0 0 25px ${accentColor}20, 0 0 50px ${accentColor}08`,
                                    transition: { type: "spring", stiffness: 400, damping: 17 },
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <h3 className="text-white font-semibold text-xl mb-3">{feature.title}</h3>
                                <p className="text-white/40 text-sm leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mid-Page CTA — Quick conversion point */}
            <div ref={midCtaRef} className="relative py-16 md:py-20 overflow-hidden z-10">
                {/* Subtle ambient glow */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full blur-[150px]"
                    style={{ background: `${accentColor}08` }}
                />

                <motion.div
                    className="relative max-w-3xl mx-auto px-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={midCtaInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <div className="relative p-8 md:p-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm text-center">
                        {/* Top accent line */}
                        <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px"
                            style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }}
                        />

                        <motion.p
                            className="text-white/60 text-sm font-medium tracking-wide uppercase mb-3"
                            initial={{ opacity: 0 }}
                            animate={midCtaInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            Already convinced?
                        </motion.p>

                        <motion.h3
                            className="text-2xl md:text-3xl font-bold text-white mb-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={midCtaInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            Skip the scroll.{" "}
                            <span className={`${highlightColor} ${highlightGlowClass}`}>Let&apos;s talk.</span>
                        </motion.h3>

                        <motion.p
                            className="text-white/50 text-sm mb-6 max-w-md mx-auto"
                            initial={{ opacity: 0 }}
                            animate={midCtaInView ? { opacity: 1 } : {}}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            30 minutes. No pitch. Just your roadmap.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={midCtaInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <a
                                href="/get-started"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 hover:gap-3 group"
                                style={{
                                    color: accentColor,
                                    border: `1px solid ${accentColor}40`,
                                    background: `${accentColor}10`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = `${accentColor}20`;
                                    e.currentTarget.style.borderColor = `${accentColor}70`;
                                    e.currentTarget.style.boxShadow = `0 0 20px ${accentColor}20`;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = `${accentColor}10`;
                                    e.currentTarget.style.borderColor = `${accentColor}40`;
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                Get My Free Roadmap
                                <svg
                                    className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </motion.div>

                        {/* Bottom accent line */}
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-px"
                            style={{ background: `linear-gradient(to right, transparent, ${accentColor}80, transparent)` }}
                        />
                    </div>
                </motion.div>
            </div>

            {/* Industry Use Cases Section */}
            <section ref={useCasesRef} className="relative py-20 md:py-28 overflow-hidden z-10">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px]"
                    style={{ background: `${accentColor}08` }}
                />

                <div className="relative max-w-6xl mx-auto px-6">
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        animate={useCasesInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        <span className={`${labelColor} text-sm font-semibold tracking-[0.2em] uppercase`}>
                            Use Cases
                        </span>
                        <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                            Built for{" "}
                            <span className={`${highlightColor} ${highlightGlowClass}`}>Every Industry</span>
                        </h2>
                    </motion.div>

                    <div className="space-y-6 max-w-4xl mx-auto">
                        {useCases.map((uc, i) => (
                            <motion.div
                                key={i}
                                className="p-6 md:p-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm"
                                initial={{ opacity: 0, y: 40 }}
                                animate={useCasesInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                                whileHover={{
                                    borderColor: `${accentColor}30`,
                                    boxShadow: `0 0 30px ${accentColor}10`,
                                    transition: { type: "spring", stiffness: 400, damping: 17 },
                                }}
                            >
                                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-8">
                                    {/* Industry Label */}
                                    <div className="shrink-0">
                                        <span
                                            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold border"
                                            style={{
                                                color: accentColor,
                                                borderColor: `${accentColor}40`,
                                                background: `${accentColor}10`,
                                            }}
                                        >
                                            {uc.industry}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Problem</p>
                                            <p className="text-white/70 text-sm leading-relaxed">{uc.problem}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Solution</p>
                                            <p className="text-white/70 text-sm leading-relaxed">{uc.solution}</p>
                                        </div>
                                        <div>
                                            <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Result</p>
                                            <p className="text-sm font-semibold leading-relaxed" style={{ color: accentColor }}>
                                                {uc.result}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="flex justify-center">
                <div
                    className="w-px h-20"
                    style={{ background: `linear-gradient(to bottom, transparent, ${accentColor}60, transparent)` }}
                />
            </div>

            {/* CTA Section */}
            <section ref={ctaRef} className="relative py-24 md:py-32 overflow-hidden z-10">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[200px]"
                    style={{ background: `${accentColor}10` }}
                />

                <motion.div
                    className="relative max-w-3xl mx-auto px-6 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={ctaInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                        {ctaText}
                    </h2>
                    <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
                        Book a 30-minute call. We&apos;ll show you exactly how this works for your business. No pitch. No pressure.
                    </p>

                    <MagneticButton href="/get-started">
                        Book My Free Audit
                    </MagneticButton>
                </motion.div>
            </section>

            {/* Footer */}
            <div className="relative z-10 pb-12 text-center flex flex-col items-center gap-4">
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 blur-xl bg-[#FFD700]/20 rounded-full" />
                    <img
                        src="/cxtrack-logo.png"
                        alt="CxTrack"
                        className="relative w-24 md:w-32 opacity-70 hover:opacity-100 transition-opacity duration-300"
                    />
                </div>

                {/* Footer Links Row */}
                <div className="flex items-center gap-3 text-xs mb-2">
                    <Link href="/legal/privacy-policy" className="text-white/30 hover:text-white/50 transition-colors">Privacy Policy</Link>
                    <span className="text-white/15">·</span>
                    <Link href="/legal/terms-of-service" className="text-white/30 hover:text-white/50 transition-colors">Terms of Service</Link>
                    <span className="text-white/15">·</span>
                    <a href="mailto:info@cxtrack.com" className="text-white/30 hover:text-white/50 transition-colors">info@cxtrack.com</a>
                </div>

                <span className="block text-white/30 text-sm">
                    &copy; 2026 CxTrack. All rights reserved.
                </span>
            </div>
        </main>
    );
}
