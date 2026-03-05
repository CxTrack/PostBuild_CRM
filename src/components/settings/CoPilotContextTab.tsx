/**
 * CoPilot Context Tab
 * AI CoPilot personalization settings - work style, communication preferences, goals, expertise
 * Reads/writes to user_profiles.profile_metadata JSONB
 * Uses direct fetch() to bypass Supabase AbortController issue
 */

import { useState, useEffect, useCallback } from 'react';
import {
    Brain, Sparkles, Coffee, Lightbulb, Target,
    Award, Heart, Save, Check, Loader2,
} from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface CoPilotContextData {
    work_style: string[];
    communication_preference: string[];
    goals: string[];
    interests: string[];
    expertise: string[];
    learning_topics: string[];
}

const DEFAULT_CONTEXT: CoPilotContextData = {
    work_style: [],
    communication_preference: [],
    goals: [],
    interests: [],
    expertise: [],
    learning_topics: [],
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

export default function CoPilotContextTab() {
    const { user } = useAuthContext();
    const [context, setContext] = useState<CoPilotContextData>(DEFAULT_CONTEXT);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load profile metadata from DB
    const loadContext = useCallback(async () => {
        if (!user?.id) return;
        try {
            const token = getAuthToken();
            if (!token) return;

            const res = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=profile_metadata`,
                {
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            if (!res.ok) throw new Error('Failed to fetch profile');
            const rows = await res.json();
            if (rows.length > 0) {
                const meta = rows[0].profile_metadata || {};
                setContext({
                    work_style: meta.work_style || [],
                    communication_preference: meta.communication_preference || [],
                    goals: meta.goals || [],
                    interests: meta.interests || [],
                    expertise: meta.expertise || [],
                    learning_topics: meta.learning_topics || [],
                });
            }
        } catch (err) {
            console.error('[CoPilotContextTab] Load error:', err);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { loadContext(); }, [loadContext]);

    const toggleArrayItem = (field: keyof CoPilotContextData, item: string) => {
        const current = context[field] as string[];
        const updated = current.includes(item)
            ? current.filter(i => i !== item)
            : [...current, item];
        setContext({ ...context, [field]: updated });
    };

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);
        try {
            const token = getAuthToken();
            if (!token) throw new Error('No auth token');

            // First fetch existing profile_metadata so we don't overwrite other fields
            const getRes = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}&select=profile_metadata`,
                {
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            const rows = await getRes.json();
            const existingMeta = rows?.[0]?.profile_metadata || {};

            // Merge AI context fields into existing metadata
            const updatedMeta = {
                ...existingMeta,
                work_style: context.work_style,
                communication_preference: context.communication_preference,
                goals: context.goals,
                interests: context.interests,
                expertise: context.expertise,
                learning_topics: context.learning_topics,
            };

            const res = await fetch(
                `${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({ profile_metadata: updatedMeta }),
                }
            );

            if (!res.ok) throw new Error(`Save failed (${res.status})`);
            toast.success('CoPilot context saved');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            console.error('[CoPilotContextTab] Save error:', err);
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            AI CoPilot Context
                            <Sparkles className="w-5 h-5 text-purple-600" />
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Help your AI assistant understand you better
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Work Style */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Coffee className="w-4 h-4 inline mr-2" />
                            Work Style
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Early Bird', 'Night Owl', 'Flexible', 'Remote', 'In-Office', 'Hybrid'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleArrayItem('work_style', style)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        context.work_style.includes(style)
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Communication Preference */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Lightbulb className="w-4 h-4 inline mr-2" />
                            Communication Style
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Direct', 'Detailed', 'Visual', 'Data-Driven', 'Collaborative', 'Async'].map(style => (
                                <button
                                    key={style}
                                    onClick={() => toggleArrayItem('communication_preference', style)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        context.communication_preference.includes(style)
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goals */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Target className="w-4 h-4 inline mr-2" />
                            Current Goals
                        </label>
                        <textarea
                            value={context.goals.join('\n')}
                            onChange={(e) => setContext({ ...context, goals: e.target.value.split('\n').filter(g => g.trim()) })}
                            placeholder="- Increase sales by 20%&#10;- Learn React&#10;- Improve customer satisfaction"
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>

                    {/* Expertise */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Award className="w-4 h-4 inline mr-2" />
                            Areas of Expertise
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['Sales', 'Marketing', 'Product', 'Engineering', 'Design', 'Operations', 'Finance', 'HR', 'Customer Success'].map(area => (
                                <button
                                    key={area}
                                    onClick={() => toggleArrayItem('expertise', area)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                        context.expertise.includes(area)
                                            ? 'bg-green-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-green-400'
                                    }`}
                                >
                                    {area}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interests */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            <Heart className="w-4 h-4 inline mr-2" />
                            Interests & Hobbies
                        </label>
                        <input
                            type="text"
                            value={context.interests.join(', ')}
                            onChange={(e) => setContext({ ...context, interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean) })}
                            placeholder="Travel, Photography, Cooking, Tech"
                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                        />
                    </div>
                </div>

                {/* Info note */}
                <div className="mt-6 p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                        <Sparkles className="w-4 h-4 inline mr-2 text-purple-600" />
                        This information helps your AI CoPilot provide more personalized assistance, suggest relevant content, and understand your work style better.
                    </p>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    {saved ? (
                        <><Check className="w-4 h-4" /> Saved</>
                    ) : saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Context</>
                    )}
                </button>
            </div>
        </div>
    );
}
