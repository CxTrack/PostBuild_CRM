import React from 'react';
import type { ChoiceOption } from '@/types/copilot-actions.types';
import { Mail, MessageSquare, Phone, Pencil, Lock, ArrowUpRight } from 'lucide-react';

interface ChoiceCardProps {
  choices: ChoiceOption[];
  selectedChoice?: string;
  onSelect: (choiceId: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail,
  MessageSquare,
  Phone,
  Pencil,
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  draft_email: {
    bg: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    border: 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500/60',
    text: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  draft_sms: {
    bg: 'hover:bg-teal-50 dark:hover:bg-teal-900/20',
    border: 'border-gray-200 dark:border-gray-600 hover:border-teal-400 dark:hover:border-teal-500/60',
    text: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-50 dark:bg-teal-900/30',
  },
  draft_call_script: {
    bg: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    border: 'border-gray-200 dark:border-gray-600 hover:border-amber-400 dark:hover:border-amber-500/60',
    text: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  other: {
    bg: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    border: 'border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500/60',
    text: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
  },
};

const ChoiceCard: React.FC<ChoiceCardProps> = ({ choices, selectedChoice, onSelect }) => {
  if (selectedChoice) {
    const selected = choices.find(c => c.id === selectedChoice);
    return (
      <div className="mt-2 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20 p-3">
        <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
          Selected: {selected?.label || selectedChoice}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {choices.map((choice, index) => {
        const IconComponent = ICON_MAP[choice.icon] || Pencil;
        const colors = COLOR_MAP[choice.id] || COLOR_MAP.other;
        const letter = String.fromCharCode(65 + index); // A, B, C, D

        return (
          <button
            key={choice.id}
            onClick={() => !choice.disabled && onSelect(choice.id)}
            disabled={choice.disabled}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
              text-left group
              ${choice.disabled
                ? 'opacity-70 cursor-not-allowed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50'
                : `cursor-pointer ${colors.bg} ${colors.border} bg-white dark:bg-gray-800 hover:shadow-sm`
              }
            `}
          >
            {/* Letter badge */}
            <div className={`
              w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
              ${choice.disabled
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                : `${colors.iconBg} ${colors.text}`
              }
            `}>
              {choice.disabled ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                letter
              )}
            </div>

            {/* Icon */}
            <div className={`p-1.5 rounded-lg shrink-0 ${choice.disabled ? 'bg-gray-100 dark:bg-gray-700' : colors.iconBg}`}>
              <IconComponent className={`w-4 h-4 ${choice.disabled ? 'text-gray-400 dark:text-gray-500' : colors.text}`} />
            </div>

            {/* Label + Description */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${choice.disabled ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                {choice.label}
              </p>
              <p className={`text-xs mt-0.5 leading-tight ${choice.disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {choice.disabled && choice.disabledReason ? choice.disabledReason : choice.description}
              </p>
            </div>

            {/* Upgrade arrow for disabled / hover arrow for enabled */}
            {choice.disabled ? (
              <ArrowUpRight className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                &rsaquo;
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ChoiceCard;
