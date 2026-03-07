import React, { useState, useMemo } from 'react';
import { X, UserPlus, Check, Clock, History } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Conversation } from '@/types/chat.types';
import toast from 'react-hot-toast';

interface AddMembersModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    existingMemberIds: string[];
    onMembersAdded: () => void;
}

type HistoryVisibility = 'full' | 'join' | '7days' | '30days';

const HISTORY_OPTIONS: { value: HistoryVisibility; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'full', label: 'Full history', desc: 'Can see all past messages', icon: <History size={14} /> },
    { value: 'join', label: 'From when they join', desc: 'Only new messages going forward', icon: <Clock size={14} /> },
    { value: '7days', label: 'Last 7 days', desc: 'Messages from the past week', icon: <Clock size={14} /> },
    { value: '30days', label: 'Last 30 days', desc: 'Messages from the past month', icon: <Clock size={14} /> },
];

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

function computeVisibleFrom(option: HistoryVisibility): string | null {
    switch (option) {
        case 'full': return null;
        case 'join': return new Date().toISOString();
        case '7days': {
            const d = new Date();
            d.setDate(d.getDate() - 7);
            return d.toISOString();
        }
        case '30days': {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            return d.toISOString();
        }
        default: return null;
    }
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
    isOpen, onClose, conversation, existingMemberIds, onMembersAdded
}) => {
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [historyVisibility, setHistoryVisibility] = useState<HistoryVisibility>('full');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { teamMembers } = useOrganizationStore();
    const { user } = useAuthContext();

    const availableMembers = useMemo(() => {
        return teamMembers.filter(m =>
            m.id !== user?.id &&
            !existingMemberIds.includes(m.id) &&
            (searchQuery
                ? m.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
                : true)
        );
    }, [teamMembers, user?.id, existingMemberIds, searchQuery]);

    if (!isOpen) return null;

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
        );
    };

    const handleAdd = async () => {
        if (selectedMembers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }

        const token = getAuthToken();
        if (!token || !user?.id) return;

        setLoading(true);
        try {
            const visibleFrom = computeVisibleFrom(historyVisibility);

            // Insert participants
            const participants = selectedMembers.map(memberId => ({
                conversation_id: conversation.id,
                user_id: memberId,
                role: 'member' as const,
                ...(visibleFrom ? { visible_from: visibleFrom } : {}),
            }));

            const res = await fetch(`${supabaseUrl}/rest/v1/conversation_participants`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify(participants),
            });

            if (!res.ok) {
                throw new Error(`Failed to add members: ${res.status}`);
            }

            // Post system messages
            const addedNames = selectedMembers.map(id => {
                const m = teamMembers.find(t => t.id === id);
                return m?.full_name || 'User';
            });

            await fetch(`${supabaseUrl}/rest/v1/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    conversation_id: conversation.id,
                    sender_id: user.id,
                    content: `${addedNames.join(', ')} ${addedNames.length === 1 ? 'was' : 'were'} added to the conversation`,
                    message_type: 'system',
                    topic: 'system',
                    extension: 'system',
                }),
            });

            toast.success(`${addedNames.length} member${addedNames.length > 1 ? 's' : ''} added`);
            onMembersAdded();
            onClose();
        } catch (err) {
            console.error('[AddMembers] error:', err);
            toast.error('Failed to add members');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <UserPlus size={20} className="text-blue-500" />
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Members</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Search */}
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search team members..."
                        className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />

                    {/* Member List */}
                    <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
                        {availableMembers.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                                {searchQuery ? 'No matching members found' : 'All team members are already in this conversation'}
                            </p>
                        ) : (
                            availableMembers.map(member => (
                                <button
                                    key={member.id}
                                    onClick={() => toggleMember(member.id)}
                                    className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-colors ${
                                        selectedMembers.includes(member.id)
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                                        {member.full_name?.charAt(0) || '?'}
                                    </div>
                                    <span className="flex-1 text-sm text-gray-900 dark:text-white">{member.full_name}</span>
                                    {selectedMembers.includes(member.id) && (
                                        <Check size={16} className="text-blue-500" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* History Visibility */}
                    {selectedMembers.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Message history access
                            </label>
                            <div className="space-y-1.5">
                                {HISTORY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setHistoryVisibility(opt.value)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                            historyVisibility === opt.value
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                                        }`}
                                    >
                                        <span className={`flex-shrink-0 ${historyVisibility === opt.value ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {opt.icon}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{opt.desc}</p>
                                        </div>
                                        {historyVisibility === opt.value && (
                                            <Check size={14} className="text-blue-500 flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                        {selectedMembers.length} selected
                    </span>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={loading || selectedMembers.length === 0}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                        >
                            {loading ? 'Adding...' : `Add ${selectedMembers.length || ''} Member${selectedMembers.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMembersModal;
