"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function StickyLogo() {
    const [isVisible, setIsVisible] = useState(false);
    const { scrollY } = useScroll();

    // Smaller logo: 160px (60% smaller than 400px)
    const logoSize = 160;

    // Visibility: only show in hero section (0px to ~2800px)
    useEffect(() => {
        const updateVisibility = () => {
            const scrollPosition = window.scrollY;
            const heroSectionEnd = 2800; // End of 300vh hero section

            setIsVisible(scrollPosition < heroSectionEnd);
        };

        updateVisibility();
        window.addEventListener("scroll", updateVisibility);
        return () => window.removeEventListener("scroll", updateVisibility);
    }, []);

    return (
        <motion.div
            className="fixed top-8 right-8 pointer-events-auto z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.8
            }}
            transition={{ duration: 0.5 }}
        >
            {/* Animated pulsing glow */}
            <motion.div
                className="absolute inset-0 blur-xl bg-[#FFD700]/20 rounded-full"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            <motion.img
                src="/cxtrack-logo.png"
                alt="CxTrack"
                className="relative opacity-85 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                style={{ width: logoSize, height: 'auto' }}
                // Gentle bounce animation
                animate={{
                    y: [0, -8, 0]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                // Hover effect: grow slightly
                whileHover={{
                    scale: 1.1,
                    filter: "drop-shadow(0 0 20px rgba(255,215,0,0.6))"
                }}
            />
        </motion.div>
    );
}
