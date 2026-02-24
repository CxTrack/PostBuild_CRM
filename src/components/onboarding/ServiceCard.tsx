import { Check } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  badge?: string;
  features: string[];
  note: string;
  selected: boolean;
  onClick: () => void;
  accent?: 'blue' | 'purple' | 'emerald' | 'teal';
}

const themes = {
  blue: {
    border: 'border-t-blue-500/50',
    bg: 'hover:bg-blue-500/[0.03]',
    shadow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.1)]',
    selectedBorder: 'border-blue-400 bg-blue-500/[0.06] shadow-[0_0_60px_rgba(59,130,246,0.15)] ring-1 ring-blue-400/30',
    checkBg: 'bg-blue-500/10 border-blue-400/30',
    checkColor: 'text-blue-400',
    ringColor: 'border-blue-400',
    glow: 'bg-blue-500/10',
  },
  purple: {
    border: 'border-t-[#FFD700]/50',
    bg: 'hover:bg-[#FFD700]/[0.03]',
    shadow: 'hover:shadow-[0_0_40px_rgba(255,215,0,0.1)]',
    selectedBorder: 'border-[#FFD700] bg-white/[0.04] shadow-[0_0_60px_rgba(255,215,0,0.15)] ring-1 ring-[#FFD700]/30',
    checkBg: 'bg-[#FFD700]/10 border-[#FFD700]/30',
    checkColor: 'text-[#FFD700]',
    ringColor: 'border-[#FFD700]',
    glow: 'bg-[#FFD700]/10',
  },
  emerald: {
    border: 'border-t-emerald-500/50',
    bg: 'hover:bg-emerald-500/[0.03]',
    shadow: 'hover:shadow-[0_0_40px_rgba(16,185,129,0.1)]',
    selectedBorder: 'border-emerald-400 bg-emerald-500/[0.06] shadow-[0_0_60px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30',
    checkBg: 'bg-emerald-500/10 border-emerald-400/30',
    checkColor: 'text-emerald-400',
    ringColor: 'border-emerald-400',
    glow: 'bg-emerald-500/10',
  },
  teal: {
    border: 'border-t-teal-400/50',
    bg: 'hover:bg-teal-500/[0.03]',
    shadow: 'hover:shadow-[0_0_40px_rgba(45,212,191,0.1)]',
    selectedBorder: 'border-teal-400 bg-teal-500/[0.06] shadow-[0_0_60px_rgba(45,212,191,0.15)] ring-1 ring-teal-400/30',
    checkBg: 'bg-teal-500/10 border-teal-400/30',
    checkColor: 'text-teal-400',
    ringColor: 'border-teal-400',
    glow: 'bg-teal-500/10',
  },
};

export default function ServiceCard({
  title,
  badge,
  features,
  note,
  selected,
  onClick,
  accent = 'blue',
}: ServiceCardProps) {
  const theme = themes[accent];

  return (
    <div
      onClick={onClick}
      className={`relative p-5 md:p-6 rounded-[2rem] border border-white/5 transition-all cursor-pointer flex flex-col h-full bg-white/[0.01] backdrop-blur-xl group overflow-hidden hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.99] ${theme.border} ${theme.bg} ${theme.shadow} ${
        selected ? theme.selectedBorder : 'hover:border-white/10'
      }`}
    >
      {/* Background Glow */}
      <div
        className={`absolute -top-24 -right-24 w-48 h-48 blur-[100px] transition-opacity opacity-0 group-hover:opacity-100 ${theme.glow}`}
      />

      {badge && (
        <div className="absolute top-6 right-8 px-4 py-1.5 rounded-full bg-[#FFD700] text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-lg z-10">
          {badge}
        </div>
      )}

      <div className="relative z-10 space-y-4 flex-grow">
        <div className="space-y-3">
          <h3 className="text-xl md:text-2xl font-black text-white italic tracking-tight">{title}</h3>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-white/5 via-white/10 to-transparent" />

        <ul className="space-y-2.5">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-white/80 group/item">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-white/10 group-hover/item:border-white/30 transition-colors ${
                  selected ? theme.checkBg : ''
                }`}
              >
                <Check
                  size={12}
                  className={`transition-colors ${
                    selected ? theme.checkColor : 'text-white/20 group-hover/item:text-white'
                  }`}
                />
              </div>
              <span className="text-sm font-bold tracking-wide uppercase">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-10 mt-6 pt-4 border-t border-white/5">
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-black leading-relaxed">
          {note}
        </p>
      </div>

      {selected && (
        <div className={`absolute inset-0 border-2 ${theme.ringColor} rounded-[2rem] pointer-events-none`} />
      )}
    </div>
  );
}
