import React, { useState } from 'react';
import type { ActionProposal, ActionStatus, ActionResult } from '@/types/copilot-actions.types';
import { Check, X, Loader2, AlertCircle, Zap, Mail, MessageSquare, Phone } from 'lucide-react';

interface ActionCardProps {
  action: ActionProposal;
  status: ActionStatus;
  result?: ActionResult;
  onConfirm: (editedFields: Record<string, any>) => void;
  onCancel: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ action, status, result, onConfirm, onCancel }) => {
  const [editedFields, setEditedFields] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    action.fields.forEach(f => {
      initial[f.key] = f.value;
    });
    return initial;
  });

  const updateField = (key: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    onConfirm(editedFields);
  };

  // Completed state
  if (status === 'completed' && result) {
    return (
      <div className="mt-2 rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 p-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-green-100 dark:bg-green-800/40">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {result.message}
          </span>
        </div>
      </div>
    );
  }

  // Failed state
  if (status === 'failed' && result) {
    return (
      <div className="mt-2 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-full bg-red-100 dark:bg-red-800/40">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            {result.message}
          </span>
        </div>
      </div>
    );
  }

  // Cancelled state
  if (status === 'cancelled') {
    return (
      <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
        <span className="text-sm text-gray-500 dark:text-gray-400 italic">
          Action cancelled
        </span>
      </div>
    );
  }

  // Executing state
  if (status === 'executing') {
    return (
      <div className="mt-2 rounded-xl border border-purple-200 dark:border-purple-800/50 bg-purple-50 dark:bg-purple-900/20 p-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-purple-600 dark:text-purple-400 animate-spin" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Executing...
          </span>
        </div>
      </div>
    );
  }

  // Action-type-aware header config
  const headerConfig = (() => {
    switch (action.actionType) {
      case 'send_email':
        return { Icon: Mail, gradient: 'from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20', iconColor: 'text-blue-600 dark:text-blue-400' };
      case 'send_sms':
        return { Icon: MessageSquare, gradient: 'from-teal-500/10 to-teal-600/10 dark:from-teal-500/20 dark:to-teal-600/20', iconColor: 'text-teal-600 dark:text-teal-400' };
      case 'draft_call_script':
        return { Icon: Phone, gradient: 'from-amber-500/10 to-amber-600/10 dark:from-amber-500/20 dark:to-amber-600/20', iconColor: 'text-amber-600 dark:text-amber-400' };
      default:
        return { Icon: Zap, gradient: 'from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20', iconColor: 'text-purple-600 dark:text-purple-400' };
    }
  })();

  const { Icon: HeaderIcon, gradient: headerGradient, iconColor: headerIconColor } = headerConfig;

  // Proposed state — the main interactive card
  return (
    <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 bg-gradient-to-r ${headerGradient} border-b border-gray-200 dark:border-gray-600`}>
        <div className="flex items-center gap-2">
          <HeaderIcon className={`w-4 h-4 ${headerIconColor}`} />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            {action.label}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-3">
        {action.fields.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {field.label}
              {field.required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {field.type === 'select' && field.options ? (
              <select
                value={editedFields[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                disabled={!field.editable}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none disabled:opacity-60 transition-colors"
              >
                {field.options.map(opt => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            ) : field.type === 'number' ? (
              <input
                type="number"
                value={editedFields[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                disabled={!field.editable}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none disabled:opacity-60 transition-colors"
              />
            ) : field.type === 'date' ? (
              <input
                type="date"
                value={editedFields[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                disabled={!field.editable}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none disabled:opacity-60 transition-colors"
              />
            ) : field.type === 'textarea' ? (
              <textarea
                value={editedFields[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                disabled={!field.editable}
                rows={5}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none disabled:opacity-60 transition-colors resize-y min-h-[80px]"
              />
            ) : (
              <input
                type="text"
                value={editedFields[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                disabled={!field.editable}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none disabled:opacity-60 transition-colors"
              />
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className={`px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-all ${
            action.actionType === 'send_email'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
              : action.actionType === 'send_sms'
                ? 'bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                : action.actionType === 'draft_call_script'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {action.actionType === 'send_email' ? (
              <><Mail className="w-4 h-4" /> Send Email</>
            ) : action.actionType === 'send_sms' ? (
              <><MessageSquare className="w-4 h-4" /> Send SMS</>
            ) : action.actionType === 'draft_call_script' ? (
              <><Phone className="w-4 h-4" /> Save Script</>
            ) : (
              <><Check className="w-4 h-4" /> Confirm</>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ActionCard;
