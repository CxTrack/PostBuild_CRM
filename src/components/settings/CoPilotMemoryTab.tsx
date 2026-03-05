/**
 * CoPilot Memory Tab
 * Displays persistent AI memories extracted from CoPilot conversations.
 * Users can view, delete individual memories, or clear all.
 * Reads from copilot_memory table via direct fetch() (bypasses Supabase AbortController issue).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Trash2, Loader2, AlertTriangle, Lightbulb,
  Target, Settings2, Zap, ClipboardCheck, RefreshCw,
} from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';

interface Memory {
  id: string;
  memory_type: 'decision' | 'preference' | 'context' | 'insight' | 'action_taken';
  content: string;
  importance_score: number;
  source_summary: string | null;
  created_at: string;
}

const MEMORY_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  decision: { label: 'Decision', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Target },
  preference: { label: 'Preference', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', icon: Settings2 },
  context: { label: 'Context', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: Lightbulb },
  insight: { label: 'Insight', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Zap },
  action_taken: { label: 'Action', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: ClipboardCheck },
};

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

export default function CoPilotMemoryTab() {
  const { user } = useAuthContext();
  const { currentOrganization } = useOrganizationStore();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);

  const orgId = currentOrganization?.id;

  const loadMemories = useCallback(async () => {
    if (!user?.id || !orgId) return;
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/copilot_memory?user_id=eq.${user.id}&organization_id=eq.${orgId}&select=id,memory_type,content,importance_score,source_summary,created_at&order=created_at.desc&limit=100`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Failed to fetch memories (${res.status})`);
      const data = await res.json();
      setMemories(data);
    } catch (err) {
      console.error('[CoPilotMemoryTab] Load error:', err);
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  }, [user?.id, orgId]);

  useEffect(() => { loadMemories(); }, [loadMemories]);

  const deleteMemory = async (memoryId: string) => {
    const token = getAuthToken();
    if (!token) return;
    setDeleting(memoryId);
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/copilot_memory?id=eq.${memoryId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      toast.success('Memory deleted');
    } catch (err) {
      console.error('[CoPilotMemoryTab] Delete error:', err);
      toast.error('Failed to delete memory');
    } finally {
      setDeleting(null);
    }
  };

  const clearAllMemories = async () => {
    if (!user?.id || !orgId) return;
    const token = getAuthToken();
    if (!token) return;
    setClearing(true);
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/copilot_memory?user_id=eq.${user.id}&organization_id=eq.${orgId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`Clear failed (${res.status})`);
      setMemories([]);
      setShowClearConfirm(false);
      toast.success('All memories cleared');
    } catch (err) {
      console.error('[CoPilotMemoryTab] Clear error:', err);
      toast.error('Failed to clear memories');
    } finally {
      setClearing(false);
    }
  };

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const importanceDots = (score: number) => {
    const filled = Math.round(score * 5);
    return (
      <div className="flex gap-0.5" title={`Importance: ${Math.round(score * 100)}%`}>
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${
              i <= filled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  // Group memories by type
  const grouped = memories.reduce<Record<string, Memory[]>>((acc, m) => {
    (acc[m.memory_type] = acc[m.memory_type] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                CoPilot Memory
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {memories.length === 0
                  ? 'No memories yet'
                  : `${memories.length} memory${memories.length === 1 ? '' : 'ies'} stored`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setLoading(true); loadMemories(); }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {memories.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1.5" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Clear confirmation dialog */}
        {showClearConfirm && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Clear all memories?
                </p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  This will permanently delete all {memories.length} memories. Your CoPilot will no longer remember past conversations and preferences.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={clearAllMemories}
                    disabled={clearing}
                    className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {clearing ? (
                      <><Loader2 className="w-3.5 h-3.5 inline mr-1.5 animate-spin" /> Clearing...</>
                    ) : (
                      'Yes, clear all'
                    )}
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {memories.length === 0 && (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
              No memories yet
            </h4>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
              As you chat with your CoPilot, it will automatically remember important decisions, preferences, and context from your conversations. These memories help it provide more personalized assistance over time.
            </p>
          </div>
        )}

        {/* Memory list grouped by type */}
        {Object.entries(grouped).map(([type, items]) => {
          const config = MEMORY_TYPE_CONFIG[type] || MEMORY_TYPE_CONFIG.context;
          const TypeIcon = config.icon;
          return (
            <div key={type} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {config.label}s ({items.length})
                </h4>
              </div>
              <div className="space-y-2">
                {items.map(memory => (
                  <div
                    key={memory.id}
                    className="group flex items-start gap-3 p-3 bg-white dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    {/* Type badge */}
                    <span className={`mt-0.5 px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${config.color}`}>
                      {config.label}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {memory.content}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(memory.created_at)}
                        </span>
                        {importanceDots(memory.importance_score)}
                        {memory.source_summary && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]" title={memory.source_summary}>
                            from: {memory.source_summary}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => deleteMemory(memory.id)}
                      disabled={deleting === memory.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                      title="Delete memory"
                    >
                      {deleting === memory.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Info note */}
        {memories.length > 0 && (
          <div className="mt-6 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <Brain className="w-4 h-4 inline mr-2 text-indigo-600" />
              Memories are automatically extracted from your CoPilot conversations. They help your AI assistant provide personalized advice based on past decisions and preferences. Delete any memory you'd prefer your CoPilot to forget.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
