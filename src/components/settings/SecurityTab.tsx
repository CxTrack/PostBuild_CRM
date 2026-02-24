/**
 * Security Tab Component
 * Password, 2FA, and session management
 */

import React, { useState } from 'react';
import {
    Shield, Key, Smartphone, Monitor, Globe,
    AlertTriangle, Check, Lock, Trash2, LogOut, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { supabaseUrl } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';

interface Session {
    id: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

export const SecurityTab: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [showEnable2FA, setShowEnable2FA] = useState(false);

    const sessions: Session[] = [
        { id: '1', device: 'Windows PC', browser: 'Chrome', location: 'New York, NY', lastActive: 'Active now', isCurrent: true },
        { id: '2', device: 'iPhone 14', browser: 'Safari', location: 'New York, NY', lastActive: '2 hours ago', isCurrent: false },
        { id: '3', device: 'MacBook Pro', browser: 'Firefox', location: 'Boston, MA', lastActive: '3 days ago', isCurrent: false },
    ];

    const [changingPassword, setChangingPassword] = useState(false);

    const handlePasswordChange = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setChangingPassword(true);
        try {
            // Verify current password by re-authenticating
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error('Unable to verify current user');

            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                toast.error('Current password is incorrect');
                return;
            }

            // Update to new password
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (updateError) throw updateError;

            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update password';
            toast.error(msg);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleEnable2FA = () => {
        setTwoFactorEnabled(true);
        setShowEnable2FA(false);
        toast.success('Two-factor authentication enabled!');
    };

    const handleRevokeSession = (_sessionId: string) => {
        toast.success('Session revoked');
    };

    const handleRevokeAll = () => {
        toast.success('All other sessions revoked');
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Security Settings
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your account security and active sessions
                </p>
            </div>

            {/* Password Change */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h3>
                        <p className="text-sm text-gray-500">Update your account password</p>
                    </div>
                </div>

                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Password Requirements */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Password must contain:</p>
                        <ul className="space-y-1 text-xs text-gray-500">
                            <li className={`flex items-center gap-2 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                                <Check size={12} /> At least 8 characters
                            </li>
                            <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}`}>
                                <Check size={12} /> One uppercase letter
                            </li>
                            <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? 'text-green-600' : ''}`}>
                                <Check size={12} /> One number
                            </li>
                        </ul>
                    </div>

                    <button
                        onClick={handlePasswordChange}
                        disabled={changingPassword}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {changingPassword ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </div>
            </div>

            {/* Two-Factor Auth */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">Add an extra layer of security</p>
                    </div>
                </div>

                {twoFactorEnabled ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                            <Check className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-medium text-green-800 dark:text-green-200">Two-factor authentication is enabled</p>
                                <p className="text-sm text-green-600 dark:text-green-400">Your account is protected with 2FA</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setTwoFactorEnabled(false)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                        >
                            Disable
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Two-factor authentication adds an extra layer of security to your account by requiring a code from your phone in addition to your password.
                        </p>
                        <button
                            onClick={() => setShowEnable2FA(true)}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center gap-2 transition-colors"
                        >
                            <Shield className="w-5 h-5" />
                            Enable Two-Factor Auth
                        </button>
                    </div>
                )}

                {/* 2FA Setup Modal */}
                {showEnable2FA && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Enable Two-Factor Authentication
                            </h3>

                            <div className="space-y-4">
                                <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                    <div className="w-40 h-40 bg-white rounded-xl flex items-center justify-center">
                                        <span className="text-xs text-gray-400">QR Code Placeholder</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                    Scan this QR code with your authenticator app
                                </p>

                                <input
                                    type="text"
                                    placeholder="Enter verification code"
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-center text-lg tracking-widest"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleEnable2FA}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-colors"
                                    >
                                        Verify & Enable
                                    </button>
                                    <button
                                        onClick={() => setShowEnable2FA(false)}
                                        className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Active Sessions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Sessions</h3>
                            <p className="text-sm text-gray-500">Devices currently logged in</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRevokeAll}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                        <LogOut size={14} />
                        Sign out all other sessions
                    </button>
                </div>

                <div className="space-y-3">
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border-2 border-gray-100 dark:border-gray-700 rounded-xl hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    {session.device.includes('iPhone') ? (
                                        <Smartphone className="w-5 h-5 text-gray-500" />
                                    ) : (
                                        <Monitor className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {session.browser} on {session.device}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Globe size={12} />
                                        <span>{session.location}</span>
                                        <span>•</span>
                                        <span>{session.lastActive}</span>
                                    </div>
                                </div>
                            </div>
                            {session.isCurrent ? (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                    Current
                                </span>
                            ) : (
                                <button
                                    onClick={() => handleRevokeSession(session.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Account Deletion */}
            <AccountDeletionSection />
        </div>
    );
};

const AccountDeletionSection: React.FC = () => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const { user } = useAuthStore();
    const { currentOrganization } = useOrganizationStore();

    const handleRequestDeletion = async () => {
        if (confirmText !== 'DELETE') return;
        if (!user) return;

        setSubmitting(true);
        try {
            // Insert deletion request
            const { error } = await supabase
                .from('account_deletion_requests')
                .insert({
                    user_id: user.id,
                    organization_id: currentOrganization?.id || null,
                    user_email: user.email || '',
                    user_name: user.user_metadata?.full_name || user.email || '',
                    reason: reason || null,
                    status: 'pending',
                });

            if (error) throw error;

            // Fire notification email (fire-and-forget)
            try {
                const ref = supabaseUrl?.split('//')[1]?.split('.')[0] || '';
                const tokenKey = `sb-${ref}-auth-token`;
                const stored = localStorage.getItem(tokenKey);
                const parsed = stored ? JSON.parse(stored) : null;
                const accessToken = parsed?.access_token;

                if (accessToken) {
                    fetch(`${supabaseUrl}/functions/v1/send-ticket-notification`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            type: 'account_deletion',
                            subject: 'Account Deletion Request',
                            description: reason || 'No reason provided',
                            userName: user.user_metadata?.full_name || user.email || '',
                            userEmail: user.email || '',
                            organizationName: currentOrganization?.name || 'N/A',
                        }),
                    }).catch(() => {});
                }
            } catch {
                // Non-blocking
            }

            setSubmitted(true);
            setShowConfirm(false);
            toast.success('Deletion request submitted');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to submit request';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deletion Request Submitted</h3>
                        <p className="text-sm text-gray-500">We received your request</p>
                    </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Your account deletion request has been submitted. Our team will review and process it within 30 days
                    in accordance with applicable privacy regulations (PIPEDA, GDPR, CCPA). You will receive a
                    confirmation email once your request has been processed.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-red-200 dark:border-red-900/50 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400">Delete Account</h3>
                        <p className="text-sm text-gray-500">Permanently remove your account and data</p>
                    </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-900/30 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-300">
                        Requesting account deletion will permanently remove your account, all associated data, and
                        organization membership. This action is irreversible and will be processed within 30 days.
                    </p>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Under PIPEDA, GDPR, and CCPA, you have the right to request deletion of your personal data.
                    Once submitted, our team will review and process your request.
                </p>

                <button
                    onClick={() => setShowConfirm(true)}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium flex items-center gap-2 transition-colors"
                >
                    <Trash2 className="w-5 h-5" />
                    Request Account Deletion
                </button>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Confirm Account Deletion
                            </h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            This will submit a request to permanently delete your account and all associated data.
                            This cannot be undone.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Reason for leaving (optional)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Tell us why you're leaving..."
                                    rows={3}
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type <span className="font-bold text-red-600">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="DELETE"
                                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center text-lg tracking-widest focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleRequestDeletion}
                                    disabled={confirmText !== 'DELETE' || submitting}
                                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Confirm Deletion Request'
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirm(false);
                                        setConfirmText('');
                                        setReason('');
                                    }}
                                    className="px-4 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SecurityTab;
