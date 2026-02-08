"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { urlFor } from "@/lib/sanity/image";

interface TeamCardProps {
    member: any;
    index: number;
}

export default function TeamCard({ member, index }: TeamCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="group relative"
        >
            <div className="relative p-10 rounded-[2.5rem] border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden flex flex-col items-center text-center transition-all duration-300 group-hover:border-[#FFD700]/40 group-hover:bg-[#FFD700]/[0.02] group-hover:shadow-[0_0_50px_rgba(255,215,0,0.1)]">

                {/* Background Sparkle Effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#FFD700]/[0.03] blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Circular Photo */}
                <div className="relative w-40 h-40 mb-8 z-10">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFD700] to-[#1E90FF] blur-md opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/10 shadow-2xl">
                        {member.image ? (
                            <Image
                                src={urlFor(member.image).width(200).height(200).url()}
                                alt={member.name}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-900" />
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-[#FFD700] transition-colors">
                        {member.name}
                    </h3>
                    <p className="text-[#FFD700] text-xs font-bold uppercase tracking-[0.2em] mb-4">
                        {member.role}
                    </p>
                    <p className="text-white/50 text-sm leading-relaxed mb-6 italic px-2">
                        "{member.bio}"
                    </p>

                    {/* Simple Social Icons */}
                    <div className="flex justify-center gap-4 opacity-30 group-hover:opacity-100 transition-opacity">
                        {member.socials?.linkedin && (
                            <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#FFD700] transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-1.337-.025-3.064-1.867-3.064-1.868 0-2.154 1.459-2.154 2.968v5.7h-3v-11h2.88v1.503h.041c.4-.759 1.378-1.56 2.839-1.56 3.038 0 3.6 2.001 3.6 4.602v6.961h-.001z" /></svg>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
