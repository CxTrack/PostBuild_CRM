"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import MagneticButton from "./MagneticButton";

export default function FinalCTASection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const headlineOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.6], [0.9, 1, 1]);
    const subOpacity = useTransform(scrollYProgress, [0.3, 0.45, 0.7], [0.85, 1, 0.95]);

    return (
        <section
            id="cta"
            ref={sectionRef}
            className="relative py-32 md:py-40 lg:py-48 overflow-hidden z-10"
        >
            {/* Large ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#FFD700]/10 blur-[200px]" />

            {/* Section Divider */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-[#FFD700]/50 to-transparent" />

            <div className="relative max-w-4xl mx-auto px-6 text-center">

                {/* Eyebrow */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 text-[#FFD700] text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#FFD700] animate-pulse" />
                        Free Automation Roadmap Included
                    </span>
                </motion.div>

                {/* Main Headline */}
                <motion.h2
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white max-w-3xl mx-auto leading-[0.95] tracking-tight mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    style={{ opacity: headlineOpacity }}
                >
                    Stop Guessing.{" "}
                    <span className="text-[#FFD700] text-glow-gold">Start Automating.</span>
                </motion.h2>

                {/* Subheadline */}
                <motion.p
                    className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    style={{ opacity: subOpacity }}
                >
                    Book a 30-minute audit. We&apos;ll map your biggest leaks and show you the exact automation roadmap. No pitch. No pressure.
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    className="relative inline-block"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    {/* Heartbeat glow behind button */}
                    <motion.div
                        className="absolute inset-0 rounded-full bg-[#FFD700]/30 blur-2xl"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />

                    <MagneticButton href="/get-started">
                        Book My Free Audit
                    </MagneticButton>
                </motion.div>

                {/* Trust Elements */}
                <motion.div
                    className="mt-16 flex flex-wrap justify-center gap-8 text-white/70 text-sm"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.8 }}
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        No credit card required
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                        Roadmap in 4 weeks
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cancel anytime
                    </div>
                </motion.div>

            </div>

            {/* Footer with Logo */}
            <motion.div
                className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 1 }}
            >
                {/* Logo with glow */}
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-[#FFD700]/20 rounded-full" />
                    <img
                        src="/cxtrack-logo.png"
                        alt="CxTrack"
                        className="relative w-24 md:w-32 opacity-70 hover:opacity-100 transition-opacity duration-300"
                    />
                </div>

                {/* Footer Links Row */}
                <div className="flex items-center gap-3 text-xs">
                    <Link to="/legal/privacy-policy" className="text-white/30 hover:text-white/50 transition-colors">Privacy Policy</Link>
                    <span className="text-white/15">·</span>
                    <Link to="/legal/terms-of-service" className="text-white/30 hover:text-white/50 transition-colors">Terms of Service</Link>
                    <span className="text-white/15">·</span>
                    <a href="mailto:info@cxtrack.com" className="text-white/30 hover:text-white/50 transition-colors">info@cxtrack.com</a>
                </div>

                <span className="text-white/30 text-sm">
                    © 2026 CxTrack. All rights reserved.
                </span>
            </motion.div>
        </section>
    );
}

