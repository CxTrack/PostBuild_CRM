import React, { useState } from 'react';
import type { ActionProposal, ActionStatus, ActionResult } from '@/types/copilot-actions.types';
import { previewVoiceAgentPrompt } from '@/utils/executeAction';
import { Check, X, Loader2, AlertCircle, Zap, Mail, MessageSquare, Phone, Calendar, Eye, ArrowLeft, Info } from 'lucide-react';

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

  // Preview mode state (only used for update_voice_agent)
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<{ prompt: string; greeting: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isVoiceAgentAction = action.actionType === 'update_voice_agent';

  const updateField = (key: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    onConfirm(editedFields);
  };

  const handleReviewPrompt = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const result = await previewVoiceAgentPrompt(editedFields);
      if ('error' in result) {
        setPreviewError(result.error);
      } else {
        setPreviewData(result);
        setPreviewMode(true);
      }
    } catch (err: any) {
      setPreviewError(err?.message || 'Failed to generate preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleBackToEdit = () => {
    setPreviewMode(false);
    setPreviewError(null);
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
            Applying to your AI agent...
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
      case 'update_task':
        return { Icon: Calendar, gradient: 'from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20', iconColor: 'text-green-600 dark:text-green-400' };
      default:
        return { Icon: Zap, gradient: 'from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20', iconColor: 'text-purple-600 dark:text-purple-400' };
    }
  })();

  const { Icon: HeaderIcon, gradient: headerGradient, iconColor: headerIconColor } = headerConfig;

  // ─── PREVIEW MODE ─── Show the interpolated prompt for review
  if (previewMode && previewData) {
    return (
      <div className="mt-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {/* Preview Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-600/10 dark:from-indigo-500/20 dark:to-purple-600/20 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Review Your Agent's Prompt
            </span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Greeting Message */}
          {previewData.greeting && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Greeting Message
              </label>
              <div className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                {previewData.greeting}
              </div>
            </div>
          )}

          {/* System Prompt */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              System Prompt
            </label>
            <textarea
              readOnly
              value={previewData.prompt}
              rows={15}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono leading-relaxed resize-y cursor-default focus:outline-none"
            />
          </div>

          {/* Info text */}
          <div className="flex items-start gap-2 px-1">
            <Info className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">
              This is the exact prompt your AI phone agent will use when answering calls.
              Review it carefully before applying.
            </p>
          </div>
        </div>

        {/* Preview Actions */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
          <button
            onClick={handleBackToEdit}
            className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Edit
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-all bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              Apply to Agent
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ─── FIELDS MODE ─── The main interactive card (proposed state)
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
        {action.fields.filter(f => f.type !== 'hidden').map(field => (
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

      {/* Preview error (inline, below fields) */}
      {previewError && (
        <div className="px-4 pb-2">
          <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span className="text-sm text-red-700 dark:text-red-300">{previewError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReviewPrompt}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                Try Again
              </button>
              <span className="text-xs text-red-400 dark:text-red-500">|</span>
              <button
                onClick={handleConfirm}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                Apply Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        {isVoiceAgentAction ? (
          <button
            onClick={handleReviewPrompt}
            disabled={previewLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-all bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-70"
          >
            <span className="flex items-center gap-1.5">
              {previewLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating Preview...</>
              ) : (
                <><Eye className="w-4 h-4" /> Review Prompt</>
              )}
            </span>
          </button>
        ) : (
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-all ${
              action.actionType === 'send_email'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : action.actionType === 'send_sms'
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
                  : action.actionType === 'draft_call_script'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700'
                    : action.actionType === 'update_task'
                      ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
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
              ) : action.actionType === 'update_task' ? (
                <><Calendar className="w-4 h-4" /> Update Task</>
              ) : (
                <><Check className="w-4 h-4" /> Confirm</>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ActionCard;
