"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

interface PillarSectionProps {
    id: string;
    label: string;
    labelColor: string;
    headline: string;
    highlightText: string;
    highlightColor: string;
    highlightGlowClass: string;
    description: string;
    stat: { value: string; label: string };
    features: { title: string; description: string }[];
    accentColor: string;
}

export default function PillarSection({
    id,
    label,
    labelColor,
    headline,
    highlightText,
    highlightColor,
    highlightGlowClass,
    description,
    stat,
    features,
    accentColor,
}: PillarSectionProps) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    // Sequential highlighting
    const statOpacity = useTransform(scrollYProgress, [0.2, 0.35, 0.5], [0.9, 1, 1]);
    const headlineOpacity = useTransform(scrollYProgress, [0.3, 0.45, 0.6], [0.9, 1, 1]);
    const descOpacity = useTransform(scrollYProgress, [0.4, 0.55, 0.7], [0.85, 1, 0.95]);

    return (
        <section
            id={id}
            ref={sectionRef}
            className="relative py-24 md:py-32 lg:py-40 overflow-hidden z-10"
        >
            {/* Subtle glow */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[150px]"
                style={{ background: `${accentColor}08` }}
            />

            {/* Section Divider */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20"
                style={{
                    background: `linear-gradient(to bottom, transparent, ${accentColor}80, transparent)`,
                }}
            />

            <div className="relative max-w-6xl mx-auto px-6">
                {/* Label */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                >
                    <span className={`${labelColor} text-sm font-semibold tracking-[0.2em] uppercase`}>
                        {label}
                    </span>
                </motion.div>

                {/* Hero Stat */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    style={{ opacity: statOpacity }}
                >
                    <div className={`text-6xl md:text-7xl lg:text-8xl font-black ${highlightColor} ${highlightGlowClass} mb-3`}>
                        {stat.value}
                    </div>
                    <p className="text-white/70 text-lg font-medium">{stat.label}</p>
                </motion.div>

                {/* Headline + Description */}
                <motion.div
                    className="text-center max-w-4xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h2
                        className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                        style={{ opacity: headlineOpacity }}
                    >
                        {headline}{" "}
                        <span className={`${highlightColor} ${highlightGlowClass}`}>{highlightText}</span>
                    </motion.h2>
                    <motion.p
                        className="text-white/60 text-lg md:text-xl leading-relaxed"
                        style={{ opacity: descOpacity }}
                    >
                        {description}
                    </motion.p>
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] transition-colors cursor-default"
                            whileHover={{
                                scale: 1.04,
                                borderColor: `${accentColor}40`,
                                boxShadow: `0 0 25px ${accentColor}20, 0 0 50px ${accentColor}08`,
                                transition: { type: "spring", stiffness: 400, damping: 17 }
                            }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <h3 className="text-white font-medium text-lg mb-2">{feature.title}</h3>
                            <p className="text-white/80 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Link to full page */}
                <motion.div
                    className="text-center mt-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.7 }}
                >
                    <Link
                        to={`/${id}`}
                        className={`inline-flex items-center gap-2 ${labelColor} text-sm font-medium hover:opacity-80 transition-opacity group`}
                    >
                        See use cases & full details
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
