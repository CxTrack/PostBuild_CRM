import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PricingTier {
    id: string;
    name: string;
    price: number;
    priceDisplay: string;
    badge?: string | null;
    badgeColor?: string;
    bestFor: string;
    features: string[];
    cta: string;
    highlighted?: boolean;
    skipPayment?: boolean;
    pricingNote?: string;
}

interface PricingTierCardProps {
    tier: PricingTier;
    selected: boolean;
    onClick: () => void;
    onConfirm: () => void;
}

export default function PricingTierCard({ tier, selected, onClick, onConfirm }: PricingTierCardProps) {
    return (
        <motion.div
            onClick={onClick}
            animate={selected ? { scale: 1.02, y: -4 } : { scale: 1, y: 0 }}
            whileHover={!selected ? { y: -4 } : {}}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative p-6 md:p-8 pt-8 rounded-3xl border cursor-pointer flex flex-col h-full overflow-visible ${tier.highlighted
                    ? 'bg-gradient-to-b from-[#FFD700]/10 to-transparent border-[#FFD700]/50 shadow-[0_0_40px_rgba(255,215,0,0.1)]'
                    : 'bg-white/[0.02] border-white/10'
                } ${selected ? 'ring-2 ring-[#FFD700] border-[#FFD700]' : ''}`}
        >
            {/* Floating neon badge */}
            {tier.badge && (
                <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 z-20"
                >
                    <div
                        className={`px-5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap ${
                            tier.badgeColor === 'gold'
                                ? 'bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.5),0_0_40px_rgba(255,215,0,0.2)]'
                                : 'bg-gradient-to-r from-[#C850C0] to-[#FF8C00] text-white shadow-[0_0_20px_rgba(200,80,192,0.4),0_0_40px_rgba(255,140,0,0.2)]'
                        }`}
                    >
                        {tier.badge}
                    </div>
                </motion.div>
            )}

            <div className="space-y-5 md:space-y-6 flex-grow">
                <div className="space-y-2 pt-4">
                    <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-widest">{tier.name}</h3>
                    <div className="text-2xl md:text-3xl font-black text-[#FFD700]">{tier.priceDisplay}</div>
                    {tier.pricingNote && (
                        <p className="text-white/30 text-[10px] uppercase tracking-wider">{tier.pricingNote}</p>
                    )}
                </div>

                <div className="text-white/40 text-xs uppercase tracking-widest font-bold">
                    Best for: {tier.bestFor}
                </div>

                <ul className="space-y-2.5 md:space-y-3">
                    {tier.features.map((feature, i) => {
                        const isAIQuarterback = feature.includes('AI Quarterback');
                        return (
                            <li
                                key={i}
                                className={`flex items-start gap-3 text-sm ${
                                    isAIQuarterback
                                        ? 'text-purple-300 bg-purple-500/10 -mx-2 px-2 py-1.5 rounded-lg'
                                        : 'text-white/70'
                                }`}
                            >
                                <Check
                                    size={16}
                                    className={`${isAIQuarterback ? 'text-purple-400' : 'text-[#FFD700]'} shrink-0 mt-0.5`}
                                />
                                <span className={isAIQuarterback ? 'font-bold' : ''}>{feature}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (selected) {
                        onConfirm();
                    } else {
                        onClick();
                    }
                }}
                className={`w-full mt-6 md:mt-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all min-h-[52px] ${selected
                        ? 'bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] btn-shimmer'
                        : tier.highlighted
                            ? 'bg-[#FFD700]/20 text-[#FFD700] hover:bg-[#FFD700] hover:text-black'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
            >
                {selected ? 'Continue \u2192' : tier.cta}
            </button>
        </motion.div>
    );
}
