import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Send, Trash2, Clock, Mail } from 'lucide-react';
import { Modal, Input, Select, Button } from '../theme/ThemeComponents';
import { useOrganizationStore } from '@/stores/organizationStore';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

// Read auth token directly from localStorage — bypasses Supabase JS client's AbortController.
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

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose,
}) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);

    const { inviteMember, currentOrganization } = useOrganizationStore();

    const fetchPendingInvitations = async () => {
        if (!currentOrganization) return;

        const token = getAuthToken();
        if (!token) return;

        setLoadingInvites(true);
        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/team_invitations?status=eq.pending&organization_id=eq.${currentOrganization.id}&order=created_at.desc`,
                {
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                    }
                }
            );

            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (error) {
            console.error('Failed to fetch invitations:', error);
        } finally {
            setLoadingInvites(false);
        }
    };

    useEffect(() => {
        if (isOpen && currentOrganization) {
            fetchPendingInvitations();
        }
    }, [isOpen, currentOrganization]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter an email address');
            return;
        }

        setLoading(true);
        try {
            await inviteMember(email, role);
            toast.success(`Invitation sent to ${email}`);
            setEmail('');
            setRole('user');
            fetchPendingInvitations();
        } catch (error: any) {
            toast.error(error.message || 'Failed to send invitation');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/team_invitations?id=eq.${id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: 'revoked' })
                }
            );

            if (res.ok) {
                toast.success('Invitation revoked');
                fetchPendingInvitations();
            } else {
                throw new Error('Revoke failed');
            }
        } catch (error) {
            toast.error('Failed to revoke invitation');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invite Team Member"
            maxWidth="md"
        >
            <div className="space-y-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-800/20 rounded-xl p-4 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Invitations will be sent via email. New members will be able to join your organization once they accept the invite.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            required
                            className="w-full"
                        />

                        <Select
                            label="Initial Role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            options={[
                                { value: 'user', label: 'User (View & Edit own data)' },
                                { value: 'manager', label: 'Manager (Manage records & view reports)' },
                                { value: 'admin', label: 'Admin (Full access except billing)' },
                            ]}
                            className="w-full"
                        />
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="flex items-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Send Invitation
                        </Button>
                    </div>
                </form>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Pending Invitations
                        </h4>
                        {loadingInvites && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>

                    <div className="space-y-3">
                        {invitations.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <Mail className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No pending invitations</p>
                            </div>
                        ) : (
                            invitations.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {invite.email}
                                            </p>
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800/30">
                                                {invite.role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Sent {new Date(invite.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleRevoke(invite.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                        title="Revoke Invitation"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
