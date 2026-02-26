import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, X } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

const MAX_QUICK_ACTIONS = 5;

interface QuickActionOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

interface QuickActionsConfigPopoverProps {
  allAvailableActions: QuickActionOption[];
  selectedActionIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export const QuickActionsConfigPopover: React.FC<QuickActionsConfigPopoverProps> = ({
  allAvailableActions,
  selectedActionIds,
  onSelectionChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { theme } = useThemeStore();

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const selectedCount = selectedActionIds.length;
  const isAtMax = selectedCount >= MAX_QUICK_ACTIONS;

  const handleToggle = (actionId: string) => {
    const isCurrentlySelected = selectedActionIds.includes(actionId);
    if (isCurrentlySelected) {
      onSelectionChange(selectedActionIds.filter(id => id !== actionId));
    } else if (!isAtMax) {
      onSelectionChange([...selectedActionIds, actionId]);
    }
  };

  const isSoftModern = theme === 'soft-modern';

  return (
    <div className={`relative ${isOpen ? 'z-40' : ''}`} ref={popoverRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          isSoftModern
            ? `p-2 rounded-lg transition-all duration-200 ${isOpen ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 text-gray-500'}`
            : `p-2 rounded-lg transition-all duration-200 ${isOpen ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'}`
        }
        title="Customize Quick Actions"
      >
        <SlidersHorizontal size={18} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          className={
            isSoftModern
              ? 'absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl border border-white/50 z-50 overflow-hidden'
              : 'absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden'
          }
          style={isSoftModern ? {
            background: '#F8F6F2',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.08), -8px -8px 16px rgba(255,255,255,0.9)',
          } : undefined}
        >
          {/* Header */}
          <div
            className={
              isSoftModern
                ? 'px-4 py-3 border-b border-gray-200/50 flex items-center justify-between'
                : 'px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between'
            }
          >
            <div className="flex items-center gap-2">
              <span className={isSoftModern ? 'font-semibold text-sm' : 'font-semibold text-sm text-gray-900 dark:text-white'}>
                Customize
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isAtMax
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                  : 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-400'
              }`}>
                {selectedCount}/{MAX_QUICK_ACTIONS}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={
                isSoftModern
                  ? 'p-1 hover:bg-gray-200/50 rounded-lg transition-colors'
                  : 'p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors'
              }
            >
              <X size={14} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Action checklist */}
          <div className="p-2 max-h-80 overflow-y-auto">
            {allAvailableActions.map((action) => {
              const isSelected = selectedActionIds.includes(action.id);
              const isDisabled = !isSelected && isAtMax;
              const Icon = action.icon;

              return (
                <button
                  key={action.id}
                  onClick={() => !isDisabled && handleToggle(action.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    isDisabled
                      ? 'opacity-40 cursor-not-allowed'
                      : isSoftModern
                        ? 'hover:bg-gray-200/50 cursor-pointer'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer'
                  }`}
                >
                  {/* Checkbox indicator */}
                  <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-primary-600 border-primary-600 dark:bg-primary-500 dark:border-primary-500'
                      : isSoftModern
                        ? 'border-gray-300'
                        : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isSelected && <Check size={12} className="text-white" />}
                  </div>

                  {/* Icon */}
                  <div className={
                    isSoftModern
                      ? 'w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0'
                      : 'w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center shrink-0'
                  }>
                    <Icon size={16} className={isSoftModern ? 'text-primary-600' : 'text-primary-600 dark:text-primary-400'} />
                  </div>

                  {/* Label */}
                  <span className={`text-sm ${
                    isSelected
                      ? isSoftModern
                        ? 'font-medium text-gray-900'
                        : 'font-medium text-gray-900 dark:text-white'
                      : isSoftModern
                        ? 'text-gray-500'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer hint when at max */}
          {isAtMax && (
            <div className={
              isSoftModern
                ? 'px-4 py-2 border-t border-gray-200/50'
                : 'px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700'
            }>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Deselect one to add another.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
