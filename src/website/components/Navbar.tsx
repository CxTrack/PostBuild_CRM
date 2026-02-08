"use client";

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const pathname = usePathname();

    const navLinks = [
        { name: "About", href: "/about" },
        { name: "Blog", href: "/blog" },
        { name: "Access", href: "/access" },
    ];

    return (
        <nav className="absolute top-0 left-0 right-0 z-50 px-6 py-5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo — Left Side */}
                <div className="flex-1 flex justify-start">
                    <Link to="/" className="flex items-center gap-2 group">
                        <motion.img
                            src="/cxtrack-logo.png"
                            alt="CxTrack"
                            className="h-10 md:h-12 opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                            whileHover={{
                                filter: "drop-shadow(0 0 12px rgba(255,215,0,0.4))",
                            }}
                        />
                    </Link>
                </div>

                {/* Central Links — Properly Centered */}
                <div className="hidden md:flex items-center gap-12 flex-shrink-0">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                to={link.href}
                                className="relative group py-2"
                            >
                                <span className={`text-sm font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${isActive ? 'text-[#FFD700]' : 'text-white/40 group-hover:text-white/80'}`}>
                                    {link.name}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="navUnderline"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[#FFD700]"
                                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Admin Button — Right Side */}
                <div className="flex-1 flex justify-end">
                    <Link to="/studio" title="Admin Access">
                        <motion.button
                            className="px-2 py-1 rounded-full text-[10px] font-bold text-white/15 border border-white/5 bg-transparent hover:text-white/30 hover:border-white/10 transition-all duration-300 cursor-pointer"
                            whileHover={{
                                scale: 1.08,
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                            admin
                        </motion.button>
                    </Link>
                </div>
            </div>
        </nav>
    );
}
