"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import MagneticButton from "./MagneticButton";

export default function HeroSection() {
    const sectionRef = useRef<HTMLDivElement>(null);

    return (
        <section
            ref={sectionRef}
            className="relative h-screen w-full flex items-center justify-center overflow-hidden z-10 bg-transparent"
        >
            {/* Subtle radial vignette overlay for text readability */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 100%)"
                }}
            />

            {/* Hero Content */}
            <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">


                {/* Main Headline */}
                <motion.h1
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-white max-w-5xl leading-[0.95] tracking-tight drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                >
                    Your Chaos is Costing You{" "}
                    <span className="text-[#FFD700] drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]">Six Figures.</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    className="mt-6 text-lg md:text-xl lg:text-2xl text-white max-w-2xl font-medium drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                >
                    Voice agents that never miss calls. CRMs that actually work. Audits that find hidden revenue.
                    <span className="text-white font-semibold"> Built for scale.</span>
                </motion.p>

                {/* CTA Button */}
                <motion.div
                    className="mt-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                >
                    <MagneticButton href="#audit">
                        Diagnose My Business
                    </MagneticButton>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
            >
                <div className="w-5 h-8 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5">
                    <motion.div
                        className="w-1 h-2 bg-white/60 rounded-full"
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                </div>
                <span className="text-xs text-white/50 uppercase tracking-widest font-medium">Scroll</span>
            </motion.div>
        </section>
    );
}
