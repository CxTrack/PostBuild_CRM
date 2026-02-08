"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const stats = [
    { value: "3.2x", label: "Average ROI in First Year", color: "text-[#FFD700]" },
    { value: "18 hrs", label: "Reclaimed Per Employee Weekly", color: "text-[#1E90FF]" },
    { value: "90 days", label: "Average Time to Full ROI", color: "text-emerald-400" },
];

export default function SocialProofSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const headerOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5], [0.9, 1, 1]);
    const stat1Opacity = useTransform(scrollYProgress, [0.3, 0.45, 0.6], [0.9, 1, 1]);
    const stat2Opacity = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0.9, 1, 1]);
    const stat3Opacity = useTransform(scrollYProgress, [0.4, 0.55, 0.7], [0.9, 1, 1]);

    return (
        <section
            ref={sectionRef}
            className="relative py-24 md:py-32 overflow-hidden z-10"
        >
            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FFD700]/5 blur-[150px]" />

            {/* Section Divider */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-[#FFD700]/50 to-transparent" />

            <div className="relative max-w-6xl mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    style={{ opacity: headerOpacity }}
                >
                    <span className="text-[#FFD700] text-sm font-semibold tracking-[0.2em] uppercase">
                        Results
                    </span>
                    <h2 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                        The ROI of{" "}
                        <span className="text-[#FFD700] text-glow-gold">Not Doing Manual Work.</span>
                    </h2>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                    {[stat1Opacity, stat2Opacity, stat3Opacity].map((statOpacity, i) => (
                        <motion.div
                            key={i}
                            className="relative p-8 md:p-10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm text-center cursor-default"
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                            whileHover={{
                                scale: 1.05,
                                borderColor: "rgba(255,255,255,0.2)",
                                boxShadow: `0 0 30px ${stats[i].color === "text-[#FFD700]" ? "rgba(255,215,0,0.15)" : stats[i].color === "text-[#1E90FF]" ? "rgba(30,144,255,0.15)" : "rgba(52,211,153,0.15)"}`,
                                transition: { type: "spring", stiffness: 400, damping: 17 }
                            }}
                            whileTap={{ scale: 0.97 }}
                            style={{ opacity: statOpacity }}
                        >
                            <div className={`text-5xl md:text-6xl font-black ${stats[i].color} mb-3`}>
                                {stats[i].value}
                            </div>
                            <p className="text-white/70 font-medium">{stats[i].label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
