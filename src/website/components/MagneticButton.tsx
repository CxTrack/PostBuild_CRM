"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
    children: React.ReactNode;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export default function MagneticButton({
    children,
    href,
    onClick,
    className = ""
}: MagneticButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        // Magnetic pull strength
        const strength = 0.3;

        setPosition({
            x: distanceX * strength,
            y: distanceY * strength
        });
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const buttonContent = (
        <motion.div
            ref={buttonRef}
            className={`
        relative px-10 py-5 rounded-full cursor-pointer
        glass-button
        text-lg md:text-xl font-semibold text-white
        flex items-center justify-center gap-3
        ${className}
      `}
            animate={{
                x: position.x,
                y: position.y
            }}
            transition={{
                type: "spring",
                stiffness: 150,
                damping: 15
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
        >
            {/* Glow effect */}
            <motion.div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: "radial-gradient(circle at center, rgba(212, 175, 55, 0.3) 0%, transparent 70%)",
                    filter: "blur(20px)"
                }}
            />

            {/* Arrow icon */}
            <span className="relative z-10">{children}</span>
            <motion.svg
                className="w-5 h-5 relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
            </motion.svg>
        </motion.div>
    );

    if (href) {
        return (
            <a href={href} className="group inline-block">
                {buttonContent}
            </a>
        );
    }

    return <div className="group inline-block">{buttonContent}</div>;
}
