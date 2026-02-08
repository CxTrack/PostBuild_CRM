"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
//import { urlFor } from "@sanit";

interface TestimonialsSectionProps {
    testimonials?: any[];
}

export default function TestimonialsSection({ testimonials = [] }: TestimonialsSectionProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    // Fallback if no testimonials provided from Sanity yet
    const displayTestimonials = testimonials.length > 0 ? testimonials : [
        {
            clientName: "Jonathan S.",
            company: "Apex Logistics",
            role: "Founder",
            quote: "CxTrack didn't just automate our calls; they redesigned how we think about scale. Our capture rate went from 60% to 100% overnight.",
            rating: 5,
        },
        {
            clientName: "Sarah M.",
            company: "BlueChip Real Estate",
            role: "Operations Manager",
            quote: "The custom CRM they built for us is a work of art. It's the first time our team actually enjoys clicking through a system.",
            rating: 5,
        },
        {
            clientName: "Marcus Thorne",
            company: "Velocity Partners",
            role: "CEO",
            quote: "Their AI audit was eye-opening. We found $200k in leaked revenue through process gaps we didn't even know existed.",
            rating: 5,
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((current) => (current + 1) % displayTestimonials.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [displayTestimonials.length]);

    return (
        <section className="relative py-32 px-6 overflow-hidden bg-black/50">
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-[#FFD700]/[0.05] blur-[150px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10 text-center">

                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20"
                >
                    <span className="text-[#FFD700] text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-6 block">
                        What Clients Say
                    </span>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                        Real Results. <br />
                        <span className="text-glow-gold text-[#FFD700]">Real Words.</span>
                    </h2>
                </motion.div>

                {/* Testimonial Display Area */}
                <div className="relative min-h-[400px] flex items-center justify-center">
                    {displayTestimonials.map((testimonial: any, index: number) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95, x: index > activeIndex ? 50 : -50 }}
                            animate={{
                                opacity: index === activeIndex ? 1 : 0,
                                scale: index === activeIndex ? 1 : 0.95,
                                x: index === activeIndex ? 0 : (index > activeIndex ? 100 : -100),
                                pointerEvents: index === activeIndex ? 'auto' : 'none'
                            }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-10">
                                {[...Array(testimonial.rating || 5)].map((_, i) => (
                                    <svg key={i} className="w-5 h-5 text-[#FFD700] fill-current" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>

                            {/* Quote */}
                            <blockquote className="text-2xl md:text-3xl lg:text-4xl text-white font-medium italic leading-tight mb-12 max-w-3xl">
                                "{testimonial.quote}"
                            </blockquote>

                            {/* Attribution */}
                            <div className="flex items-center gap-4">
                                {testimonial.clientPhoto && (
                                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[#FFD700]/20 shadow-xl shadow-black/50">
                                    <img
                                    src={testimonial.clientPhoto.width(56).height(56).url()}
                                    alt={testimonial.clientName}
                                    className="w-full h-full object-cover"
                                    />
                                    </div>
                                )}
                                <div className="text-left">
                                    <div className="text-white font-bold text-lg">{testimonial.clientName}</div>
                                    <div className="text-[#FFD700]/60 text-sm font-medium">{testimonial.role} @ {testimonial.company}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-3 mt-12">
                    {displayTestimonials.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`h-1.5 transition-all duration-500 rounded-full ${index === activeIndex ? 'w-12 bg-[#FFD700]' : 'w-4 bg-white/10 hover:bg-white/20'}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
