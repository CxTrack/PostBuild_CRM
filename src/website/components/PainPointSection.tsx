"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function PainPointSection() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    // Sequential highlighting for headline phrases
    const phrase1Opacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5], [0.9, 1, 1]);
    const phrase2Opacity = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0.9, 1, 1]);
    const bodyOpacity = useTransform(scrollYProgress, [0.5, 0.65, 0.8], [0.85, 1, 0.95]);

    return (
        <section
            ref={sectionRef}
            className="relative py-24 md:py-32 lg:py-40 overflow-hidden z-10"
        >
            {/* Subtle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#FF4444]/5 blur-[150px]" />

            {/* Section Divider */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

            <div className="relative max-w-4xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-[#FF4444] text-sm font-semibold tracking-[0.2em] uppercase">
                        The Problem
                    </span>
                </motion.div>

                <motion.h2
                    className="mt-8 text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <motion.span style={{ opacity: phrase1Opacity }}>You&apos;re Scaling.</motion.span>{" "}
                    <motion.span className="text-[#FF4444] text-glow-red" style={{ opacity: phrase2Opacity }}>Your Systems Aren&apos;t.</motion.span>
                </motion.h2>

                <motion.p
                    className="mt-8 text-white/90 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    style={{ opacity: bodyOpacity }}
                >
                    Every hour your team spends on manual tasks is an hour not spent growing. Every lead that slips through cracks is revenue you&apos;ll never see.{" "}
                    <span className="text-white/90 font-medium">Automation isn&apos;t optional anymore.</span>
                </motion.p>

                {/* Visual separator */}
                <motion.div
                    className="mt-16 flex justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : {}}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-white/20"
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
