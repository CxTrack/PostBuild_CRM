import React, { useState } from 'react';
import type { ChoiceOption, ChoicesConfig } from '@/types/copilot-actions.types';
import {
  Mail, MessageSquare, Phone, Pencil, Lock, ArrowUpRight, User,
  Building2, Calculator, BookOpen, DollarSign, TrendingUp,
  Clock, Globe, Shield, Briefcase, Heart, Wrench, Scale,
  CheckSquare, Square, ArrowRight, Reply,
} from 'lucide-react';

interface ChoiceCardProps {
  // Legacy single-select (quarterback, disambiguation)
  choices?: ChoiceOption[];
  selectedChoice?: string;
  onSelect?: (choiceId: string) => void;
  // Multi-select (personalization interview)
  choicesConfig?: ChoicesConfig;
  choicesSelected?: string[];
  otherText?: string;
  onMultiSelect?: (selectedIds: string[], otherText?: string) => void;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Mail,
  MessageSquare,
  Phone,
  Pencil,
  User,
  Building2,
  Calculator,
  BookOpen,
  DollarSign,
  TrendingUp,
  Clock,
  Globe,
  Shield,
  Briefcase,
  Heart,
  Wrench,
  Scale,
  Reply,
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

// --- Multi-select mode (personalization interview) ---

const MultiSelectChoices: React.FC<{
  config: ChoicesConfig;
  choicesSelected?: string[];
  savedOtherText?: string;
  onMultiSelect: (selectedIds: string[], otherText?: string) => void;
}> = ({ config, choicesSelected, savedOtherText, onMultiSelect }) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [otherActive, setOtherActive] = useState(false);
  const [otherInput, setOtherInput] = useState('');

  // Already submitted -- show locked state (trigger on selections OR freeform text)
  if ((choicesSelected && choicesSelected.length > 0) || savedOtherText) {
    const labels = choicesSelected
      .map(id => config.options.find(o => o.id === id)?.label)
      .filter(Boolean);
    const parts = [...labels];
    if (savedOtherText) parts.push(savedOtherText);

    return (
      <div className="mt-2 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20 p-3">
        <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
          {parts.join(', ')}
        </span>
      </div>
    );
  }

  const toggleOption = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (config.maxSelections && next.size >= config.maxSelections) return prev;
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const ids = Array.from(selected);
    const text = otherActive && otherInput.trim() ? otherInput.trim() : undefined;
    if (ids.length === 0 && !text) return;
    onMultiSelect(ids, text);
  };

  // For single-select config mode, clicking an option immediately submits
  const handleSingleSelect = (id: string) => {
    onMultiSelect([id]);
  };

  const hasSelection = selected.size > 0 || (otherActive && otherInput.trim());

  return (
    <div className="mt-3 space-y-2">
      {/* Progress pill */}
      {config.progressLabel && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300">
            {config.progressLabel}
          </span>
        </div>
      )}

      {/* Options */}
      {config.options.map((option) => {
        const IconComponent = ICON_MAP[option.icon] || Pencil;
        const isSelected = selected.has(option.id);

        if (!config.multiSelect) {
          // Single-select config mode: instant submit on click
          return (
            <button
              key={option.id}
              onClick={() => handleSingleSelect(option.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
                text-left group cursor-pointer
                hover:bg-purple-50 dark:hover:bg-purple-900/20
                border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500/60
                bg-white dark:bg-gray-800 hover:shadow-sm
              `}
            >
              <div className="p-1.5 rounded-lg shrink-0 bg-purple-50 dark:bg-purple-900/30">
                <IconComponent className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight text-gray-900 dark:text-white">
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-xs mt-0.5 leading-tight text-gray-500 dark:text-gray-400">
                    {option.description}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                &rsaquo;
              </span>
            </button>
          );
        }

        // Multi-select mode: toggleable cards with checkboxes
        return (
          <button
            key={option.id}
            onClick={() => toggleOption(option.id)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
              text-left group cursor-pointer
              ${isSelected
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-500/60 shadow-sm'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
              }
            `}
          >
            {/* Checkbox */}
            <div className="shrink-0">
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-purple-400 dark:group-hover:text-purple-500 transition-colors" />
              )}
            </div>

            {/* Icon */}
            <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-purple-100 dark:bg-purple-800/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
            </div>

            {/* Label + Description */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>
                {option.label}
              </p>
              {option.description && (
                <p className="text-xs mt-0.5 leading-tight text-gray-500 dark:text-gray-400">
                  {option.description}
                </p>
              )}
            </div>
          </button>
        );
      })}

      {/* "Other" option with text input */}
      {config.allowOther && (
        <div>
          <button
            onClick={() => setOtherActive(!otherActive)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200
              text-left group cursor-pointer
              ${otherActive
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-400 dark:border-purple-500/60 shadow-sm rounded-b-none'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
              }
            `}
          >
            {config.multiSelect && (
              <div className="shrink-0">
                {otherActive ? (
                  <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-purple-400 dark:group-hover:text-purple-500 transition-colors" />
                )}
              </div>
            )}
            <div className={`p-1.5 rounded-lg shrink-0 ${otherActive ? 'bg-purple-100 dark:bg-purple-800/40' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <Pencil className={`w-4 h-4 ${otherActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${otherActive ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'}`}>
                Other
              </p>
              <p className="text-xs mt-0.5 leading-tight text-gray-500 dark:text-gray-400">
                Type your own answer
              </p>
            </div>
          </button>
          {otherActive && (
            <div className="border border-t-0 border-purple-400 dark:border-purple-500/60 rounded-b-xl bg-purple-50/50 dark:bg-purple-900/10 p-3">
              <input
                type="text"
                value={otherInput}
                onChange={(e) => setOtherInput(e.target.value)}
                placeholder={config.otherPlaceholder || 'Type your answer...'}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !config.multiSelect && otherInput.trim()) {
                    e.preventDefault();
                    onMultiSelect([], otherInput.trim());
                  }
                }}
                className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Confirm button (multi-select mode only) */}
      {config.multiSelect && (
        <button
          onClick={handleConfirm}
          disabled={!hasSelection}
          className={`
            w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-200
            ${hasSelection
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

// --- Legacy single-select mode (quarterback, disambiguation) ---

const LegacySingleSelect: React.FC<{
  choices: ChoiceOption[];
  selectedChoice?: string;
  onSelect: (choiceId: string) => void;
}> = ({ choices, selectedChoice, onSelect }) => {
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
        const letter = String.fromCharCode(65 + index);

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

// --- Main component: delegates to correct mode ---

const ChoiceCard: React.FC<ChoiceCardProps> = ({
  choices,
  selectedChoice,
  onSelect,
  choicesConfig,
  choicesSelected,
  otherText: savedOtherText,
  onMultiSelect,
}) => {
  // New structured choices mode (personalization interview)
  if (choicesConfig && onMultiSelect) {
    return (
      <MultiSelectChoices
        config={choicesConfig}
        choicesSelected={choicesSelected}
        savedOtherText={savedOtherText}
        onMultiSelect={onMultiSelect}
      />
    );
  }

  // Legacy single-select mode (quarterback, disambiguation)
  if (choices && onSelect) {
    return (
      <LegacySingleSelect
        choices={choices}
        selectedChoice={selectedChoice}
        onSelect={onSelect}
      />
    );
  }

  return null;
};

export default ChoiceCard;
