import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, X, Check, PenLine, Loader2 } from 'lucide-react';

interface Suggestion {
  id: string;
  label: string;
  text: string;
}

interface SmsAgentSuggestionsProps {
  organizationId: string;
  inboundMessage: string;
  customerName?: string;
  customerPhone?: string;
  conversationHistory?: { role: 'customer' | 'agent'; content: string; timestamp?: string }[];
  onSelectSuggestion: (text: string) => void;
  onDismiss: () => void;
  visible: boolean;
}

const LETTER_BADGES = ['A', 'B', 'C'];
const BADGE_COLORS = [
  'bg-green-500', // A - green to match SMS theme
  'bg-emerald-500', // B
  'bg-teal-500', // C
];

export default function SmsAgentSuggestions({
  organizationId,
  inboundMessage,
  customerName,
  customerPhone,
  conversationHistory,
  onSelectSuggestion,
  onDismiss,
  visible,
}: SmsAgentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!organizationId || !inboundMessage) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);
    setSelectedId(null);

    try {
      // Read auth token from localStorage (AbortController workaround)
      let token: string | null = null;
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          try {
            const stored = JSON.parse(localStorage.getItem(key) || '');
            if (stored?.access_token) { token = stored.access_token; break; }
          } catch { /* skip */ }
        }
      }

      if (!token) {
        setError('Not authenticated');
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/sms-agent-suggest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          inboundMessage,
          customerName,
          customerPhone,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else if (data.reason === 'agent_not_active') {
        // Silently dismiss - agent not configured
        onDismiss();
      } else if (data.reason === 'token_limit_reached') {
        setError('Out of AI tokens for this month.');
      } else {
        setError('Could not generate suggestions.');
      }
    } catch (err) {
      console.error('SMS suggestion fetch error:', err);
      setError('Failed to get suggestions.');
    } finally {
      setLoading(false);
    }
  }, [organizationId, inboundMessage, customerName, customerPhone, conversationHistory, onDismiss]);

  useEffect(() => {
    if (visible && inboundMessage) {
      fetchSuggestions();
    }
  }, [visible, inboundMessage]);

  const handleSelect = (suggestion: Suggestion) => {
    setSelectedId(suggestion.id);
    onSelectSuggestion(suggestion.text);
  };

  const handleWriteOwn = () => {
    onDismiss();
  };

  if (!visible) return null;

  return (
    <div className="px-4 py-3 border-t border-green-200/50 dark:border-green-800/30 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/10 dark:to-emerald-900/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-green-600 dark:text-green-400" />
          <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">
            {loading ? 'Generating response suggestions...' : selectedId ? 'Suggestion applied to input' : 'AI Suggested Responses'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!loading && suggestions.length > 0 && !selectedId && (
            <button
              onClick={fetchSuggestions}
              className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition-colors"
              title="Regenerate suggestions"
            >
              <RefreshCw size={13} />
            </button>
          )}
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded text-green-600 dark:text-green-400 transition-colors"
            title="Dismiss suggestions"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 py-3 justify-center">
          <Loader2 size={16} className="animate-spin text-green-500" />
          <span className="text-sm text-green-600 dark:text-green-400">Analyzing conversation...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-sm text-red-500 dark:text-red-400 py-2 text-center">
          {error}
        </div>
      )}

      {/* Selected confirmation */}
      {selectedId && !loading && (
        <div className="flex items-center gap-2 py-2 justify-center">
          <Check size={14} className="text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-700 dark:text-green-300">Message applied to input. Edit and send when ready.</span>
        </div>
      )}

      {/* Suggestions */}
      {!loading && !selectedId && suggestions.length > 0 && (
        <div className="space-y-1.5">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelect(suggestion)}
              className="w-full flex items-start gap-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-gray-800/50 border border-green-200/50 dark:border-green-800/30 hover:border-green-400 dark:hover:border-green-600 hover:bg-white dark:hover:bg-gray-800 transition-all text-left group"
            >
              {/* Letter Badge */}
              <div className={`flex-shrink-0 w-6 h-6 ${BADGE_COLORS[index] || BADGE_COLORS[0]} rounded-md flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
                {LETTER_BADGES[index]}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider mb-0.5">
                  {suggestion.label}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-snug line-clamp-2">
                  {suggestion.text}
                </p>
              </div>
            </button>
          ))}

          {/* Write My Own option */}
          <button
            onClick={handleWriteOwn}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-white/40 dark:bg-gray-800/30 border border-dashed border-green-300/50 dark:border-green-700/30 hover:border-green-400 dark:hover:border-green-600 hover:bg-white/60 dark:hover:bg-gray-800/50 transition-all text-left"
          >
            <div className="flex-shrink-0 w-6 h-6 bg-gray-400 dark:bg-gray-600 rounded-md flex items-center justify-center text-white text-xs font-bold">
              D
            </div>
            <div className="flex items-center gap-1.5">
              <PenLine size={12} className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Write my own response</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
