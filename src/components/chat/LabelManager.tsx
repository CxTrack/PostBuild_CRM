import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Check, Tag, Trash2 } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import type { ConversationLabel } from '@/types/chat.types';
import { LABEL_COLORS } from '@/types/chat.types';
import toast from 'react-hot-toast';

interface LabelManagerProps {
    isOpen: boolean;
    onClose: () => void;
    conversationId: string;
    assignedLabelIds: string[];
    onLabelsChanged: () => void;
}

function getAuthToken(): string | null {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
                const stored = JSON.parse(localStorage.getItem(key) || '');
                if (stored?.access_token) return stored.access_token;
            } catch { /* ignore */ }
        }
    }
    return null;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
    isOpen, onClose, conversationId, assignedLabelIds, onLabelsChanged
}) => {
    const [orgLabels, setOrgLabels] = useState<ConversationLabel[]>([]);
    const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set(assignedLabelIds));
    const [showCreate, setShowCreate] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[3]); // blue default
    const [loading, setLoading] = useState(false);
    const { currentOrganization } = useOrganizationStore();
    const { user } = useAuthContext();

    // Fetch org labels
    const fetchLabels = useCallback(async () => {
        const token = getAuthToken();
        const orgId = currentOrganization?.id;
        if (!token || !orgId) return;

        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_labels?organization_id=eq.${orgId}&order=name.asc`,
                { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
            );
            if (res.ok) {
                setOrgLabels(await res.json());
            }
        } catch { /* silent */ }
    }, [currentOrganization?.id]);

    useEffect(() => {
        if (isOpen) {
            fetchLabels();
            setAssignedIds(new Set(assignedLabelIds));
        }
    }, [isOpen, fetchLabels, assignedLabelIds]);

    const toggleLabel = async (labelId: string) => {
        const token = getAuthToken();
        if (!token || !user?.id) return;

        const isAssigned = assignedIds.has(labelId);

        try {
            if (isAssigned) {
                // Remove assignment
                const res = await fetch(
                    `${supabaseUrl}/rest/v1/conversation_label_assignments?conversation_id=eq.${conversationId}&label_id=eq.${labelId}`,
                    {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Prefer': 'return=minimal' },
                    }
                );
                if (res.ok) {
                    setAssignedIds(prev => { const next = new Set(prev); next.delete(labelId); return next; });
                    onLabelsChanged();
                }
            } else {
                // Add assignment
                const res = await fetch(`${supabaseUrl}/rest/v1/conversation_label_assignments`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({
                        conversation_id: conversationId,
                        label_id: labelId,
                        assigned_by: user.id,
                    }),
                });
                if (res.ok) {
                    setAssignedIds(prev => new Set(prev).add(labelId));
                    onLabelsChanged();
                }
            }
        } catch {
            toast.error('Failed to update label');
        }
    };

    const createLabel = async () => {
        if (!newLabelName.trim()) return;
        const token = getAuthToken();
        const orgId = currentOrganization?.id;
        if (!token || !orgId || !user?.id) return;

        setLoading(true);
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/conversation_labels`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
                    organization_id: orgId,
                    name: newLabelName.trim(),
                    color: newLabelColor,
                    created_by: user.id,
                }),
            });

            if (res.ok) {
                const [label] = await res.json();
                setOrgLabels(prev => [...prev, label]);
                setNewLabelName('');
                setShowCreate(false);
                toast.success(`Label "${label.name}" created`);
            } else {
                const err = await res.text();
                if (err.includes('duplicate')) {
                    toast.error('A label with that name already exists');
                } else {
                    toast.error('Failed to create label');
                }
            }
        } catch {
            toast.error('Failed to create label');
        } finally {
            setLoading(false);
        }
    };

    const deleteLabel = async (labelId: string, labelName: string) => {
        if (!confirm(`Delete label "${labelName}"? This will remove it from all conversations.`)) return;
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_labels?id=eq.${labelId}`,
                {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Prefer': 'return=minimal' },
                }
            );
            if (res.ok) {
                setOrgLabels(prev => prev.filter(l => l.id !== labelId));
                setAssignedIds(prev => { const next = new Set(prev); next.delete(labelId); return next; });
                onLabelsChanged();
                toast.success(`Label "${labelName}" deleted`);
            }
        } catch {
            toast.error('Failed to delete label');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1.5">
                        <Tag size={14} className="text-blue-500" />
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Labels</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        <X size={14} className="text-gray-500" />
                    </button>
                </div>

                {/* Label List */}
                <div className="max-h-52 overflow-y-auto p-1.5 space-y-0.5">
                    {orgLabels.map(label => (
                        <div
                            key={label.id}
                            className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                        >
                            <button
                                onClick={() => toggleLabel(label.id)}
                                className="flex items-center gap-2 flex-1 min-w-0"
                            >
                                <span
                                    className="w-3 h-3 rounded-full flex-shrink-0 ring-1 ring-black/10"
                                    style={{ backgroundColor: label.color }}
                                />
                                <span className="text-sm text-gray-900 dark:text-white truncate">{label.name}</span>
                                {assignedIds.has(label.id) && (
                                    <Check size={14} className="text-blue-500 flex-shrink-0 ml-auto" />
                                )}
                            </button>
                            <button
                                onClick={() => deleteLabel(label.id, label.name)}
                                className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    {orgLabels.length === 0 && (
                        <p className="text-xs text-gray-500 text-center py-3">No labels yet</p>
                    )}
                </div>

                {/* Create New Label */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-2">
                    {showCreate ? (
                        <div className="space-y-2">
                            <input
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                placeholder="Label name..."
                                className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-900 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') createLabel(); }}
                            />
                            <div className="flex items-center gap-1.5">
                                {LABEL_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setNewLabelColor(color)}
                                        className={`w-5 h-5 rounded-full transition-transform ${newLabelColor === color ? 'scale-125 ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800' : 'hover:scale-110'}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setShowCreate(false); setNewLabelName(''); }}
                                    className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createLabel}
                                    disabled={loading || !newLabelName.trim()}
                                    className="px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                >
                                    {loading ? '...' : 'Create'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                            <Plus size={14} />
                            Create label
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LabelManager;
