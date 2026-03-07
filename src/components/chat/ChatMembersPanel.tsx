import React, { useState, useEffect, useCallback } from 'react';
import { X, Shield, User, UserMinus, LogOut, UserPlus, Crown } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import type { Conversation, PresenceStatus } from '@/types/chat.types';
import toast from 'react-hot-toast';

interface Participant {
    id: string;
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
    user: { id: string; full_name: string; avatar_url?: string };
}

interface ChatMembersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: Conversation;
    currentUserId: string;
    getPresenceStatus: (userId: string) => { status: PresenceStatus } | null;
    onMembersChanged: () => void;
    onAddMembers: () => void;
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

const statusColors: Record<PresenceStatus, string> = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    away: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-400',
};

const ChatMembersPanel: React.FC<ChatMembersPanelProps> = ({
    isOpen, onClose, conversation, currentUserId, getPresenceStatus, onMembersChanged, onAddMembers
}) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

    const currentUserIsAdmin = participants.some(p => p.user_id === currentUserId && p.role === 'admin');
    const currentUserIsCreator = conversation.created_by === currentUserId;
    const canManage = currentUserIsAdmin || currentUserIsCreator;

    const fetchParticipants = useCallback(async () => {
        const token = getAuthToken();
        if (!token || !conversation.id) return;
        setLoading(true);
        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_participants?conversation_id=eq.${conversation.id}&select=id,user_id,role,joined_at,user:user_profiles(id,full_name,avatar_url)`,
                { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
            );
            if (res.ok) {
                const data = await res.json();
                setParticipants(data);
            }
        } catch (err) {
            console.error('[ChatMembers] fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [conversation.id]);

    useEffect(() => {
        if (isOpen) fetchParticipants();
    }, [isOpen, fetchParticipants]);

    const handleRoleChange = async (participantId: string, userId: string, newRole: 'admin' | 'member') => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_participants?id=eq.${participantId}`,
                {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({ role: newRole }),
                }
            );
            if (res.ok) {
                setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, role: newRole } : p));
                toast.success(`Role updated to ${newRole}`);
                onMembersChanged();
            } else {
                toast.error('Failed to update role');
            }
        } catch { toast.error('Failed to update role'); }
    };

    const handleRemoveMember = async (participantId: string, userId: string, userName: string) => {
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_participants?id=eq.${participantId}`,
                { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Prefer': 'return=minimal' } }
            );
            if (res.ok) {
                // Post system message
                await fetch(`${supabaseUrl}/rest/v1/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({
                        conversation_id: conversation.id,
                        sender_id: currentUserId,
                        content: `${userName} was removed from the conversation`,
                        message_type: 'system',
                        topic: 'system',
                        extension: 'system',
                    }),
                });
                setParticipants(prev => prev.filter(p => p.id !== participantId));
                setConfirmRemove(null);
                toast.success(`${userName} removed`);
                onMembersChanged();
            } else {
                toast.error('Failed to remove member');
            }
        } catch { toast.error('Failed to remove member'); }
    };

    const handleLeaveConversation = async () => {
        const myParticipant = participants.find(p => p.user_id === currentUserId);
        if (!myParticipant) return;
        const token = getAuthToken();
        if (!token) return;
        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_participants?id=eq.${myParticipant.id}`,
                { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Prefer': 'return=minimal' } }
            );
            if (res.ok) {
                await fetch(`${supabaseUrl}/rest/v1/messages`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
                    body: JSON.stringify({
                        conversation_id: conversation.id,
                        sender_id: currentUserId,
                        content: 'Left the conversation',
                        message_type: 'system',
                        topic: 'system',
                        extension: 'system',
                    }),
                });
                toast.success('You left the conversation');
                onClose();
                onMembersChanged();
            }
        } catch { toast.error('Failed to leave conversation'); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-80 bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Members ({participants.length})</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>

                {/* Add Members Button */}
                {canManage && (
                    <button
                        onClick={onAddMembers}
                        className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <UserPlus size={16} />
                        Add Members
                    </button>
                )}

                {/* Participant List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {loading ? (
                        <div className="text-center text-sm text-gray-500 py-4">Loading...</div>
                    ) : (
                        participants.map(p => {
                            const presence = getPresenceStatus(p.user_id);
                            const isMe = p.user_id === currentUserId;
                            return (
                                <div key={p.id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 group">
                                    {/* Presence dot */}
                                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[presence?.status || 'offline']}`} />
                                    {/* Name */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {p.user?.full_name || 'Unknown'}{isMe ? ' (You)' : ''}
                                        </p>
                                    </div>
                                    {/* Role badge */}
                                    {p.role === 'admin' ? (
                                        <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                            <Crown size={10} /> Admin
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-gray-400 px-1.5 py-0.5">Member</span>
                                    )}
                                    {/* Actions for admins/creators */}
                                    {canManage && !isMe && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleRoleChange(p.id, p.user_id, p.role === 'admin' ? 'member' : 'admin')}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                title={p.role === 'admin' ? 'Demote to member' : 'Promote to admin'}
                                            >
                                                {p.role === 'admin' ? <User size={12} /> : <Shield size={12} />}
                                            </button>
                                            {confirmRemove === p.id ? (
                                                <button
                                                    onClick={() => handleRemoveMember(p.id, p.user_id, p.user?.full_name || 'User')}
                                                    className="px-1.5 py-0.5 text-[10px] font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100"
                                                >
                                                    Confirm
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmRemove(p.id)}
                                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500"
                                                    title="Remove member"
                                                >
                                                    <UserMinus size={12} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Leave Conversation */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleLeaveConversation}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <LogOut size={14} />
                        Leave Conversation
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatMembersPanel;
