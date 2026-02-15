import React, { useState } from 'react';
import { X, Hash, Users, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface CreateGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'group' | 'channel';
    onCreated: (conversation: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, type, onCreated }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const { teamMembers, currentOrganization } = useOrganizationStore();
    const { user } = useAuthContext();

    if (!isOpen) return null;

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
        );
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error(`Please enter a ${type} name`);
            return;
        }
        if (type === 'group' && selectedMembers.length === 0) {
            toast.error('Please select at least one member');
            return;
        }

        setLoading(true);
        try {
            // Create the conversation
            const { data: conv, error } = await supabase
                .from('conversations')
                .insert({
                    organization_id: currentOrganization?.id,
                    name: name.trim(),
                    description: description.trim() || null,
                    channel_type: type,
                    is_group: true,
                    created_by: user?.id,
                })
                .select()
                .single();

            if (error || !conv) throw error || new Error('Failed to create');

            // Add participants
            const participants = [
                { conversation_id: conv.id, user_id: user?.id, role: 'admin' as const },
                ...selectedMembers.map(memberId => ({
                    conversation_id: conv.id,
                    user_id: memberId,
                    role: 'member' as const,
                })),
            ];

            // For channels, add ALL org members
            if (type === 'channel') {
                const allMemberIds = teamMembers
                    .filter(m => m.id !== user?.id)
                    .map(m => m.id);

                participants.push(
                    ...allMemberIds
                        .filter(id => !selectedMembers.includes(id))
                        .map(id => ({
                            conversation_id: conv.id,
                            user_id: id,
                            role: 'member' as const,
                        }))
                );
            }

            await supabase.from('conversation_participants').insert(participants);

            toast.success(`${type === 'channel' ? 'Channel' : 'Group'} created!`);
            // Return combined object
            onCreated({
                ...conv,
                participants: participants.map(p => {
                    const m = teamMembers.find(member => member.id === p.user_id);
                    return {
                        user: { full_name: m?.full_name || 'User' }
                    };
                })
            });
        } catch (err) {
            console.error(err);
            toast.error(`Failed to create ${type}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="absolute inset-0 z-50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {type === 'channel' ? <Hash size={20} className="text-blue-500" /> : <Users size={20} className="text-purple-500" />}
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                            New {type === 'channel' ? 'Channel' : 'Group'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'channel' ? 'e.g. general, announcements' : 'e.g. Sales Team'}
                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this about?"
                            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                    </div>

                    {type === 'group' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Members</label>
                            <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-hide">
                                {teamMembers.filter(m => m.id !== user?.id).map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => toggleMember(member.id)}
                                        className={`w-full p-2.5 rounded-xl flex items-center gap-3 text-left transition-colors ${selectedMembers.includes(member.id)
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
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'channel' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl">
                            All team members will automatically be added to this channel.
                        </p>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={loading || !name.trim()}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                    >
                        {loading ? 'Creating...' : `Create ${type === 'channel' ? 'Channel' : 'Group'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
