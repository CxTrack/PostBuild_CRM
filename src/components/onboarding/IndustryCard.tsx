import { Check } from 'lucide-react';

interface IndustryCardProps {
    id: string;
    label: string;
    icon: string;
    description: string;
    selected: boolean;
    onClick: () => void;
}

export default function IndustryCard({ id, label, icon, description, selected, onClick }: IndustryCardProps) {
    return (
        <div
            onClick={onClick}
            className={`relative p-6 rounded-2xl border cursor-pointer transition-all hover:-translate-y-1 ${selected
                    ? 'bg-[#FFD700]/10 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.15)]'
                    : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                }`}
        >
            {selected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center">
                    <Check size={14} className="text-black" />
                </div>
            )}
            <div className="space-y-3">
                <span className="material-icons text-3xl text-white/60">{icon}</span>
                <h3 className={`font-bold text-lg ${selected ? 'text-[#FFD700]' : 'text-white'}`}>
                    {label}
                </h3>
                <p className="text-white/40 text-xs leading-relaxed">{description}</p>
            </div>
        </div>
    );
}
