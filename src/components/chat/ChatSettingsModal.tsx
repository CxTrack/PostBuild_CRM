import React, { useState, useEffect, useCallback } from 'react';
import { X, Bell, BellOff, Volume2, VolumeX, Monitor, Eye, EyeOff, Keyboard, Layout, Shield, Mail, AlertTriangle } from 'lucide-react';
import { ChatSettings, DEFAULT_CHAT_SETTINGS } from '@/types/chat.types';
import type { OrganizationChatPolicy } from '@/types/chat.types';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';

interface ChatSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ChatSettings;
    onSave: (settings: ChatSettings) => void;
    // Phase 2: policy & auto-reply
    chatPolicy?: OrganizationChatPolicy;
    onSavePolicy?: (policy: Partial<OrganizationChatPolicy>) => Promise<void>;
    autoReply?: { enabled: boolean; message: string };
    onSaveAutoReply?: (enabled: boolean, message: string) => Promise<void>;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
    isOpen,
    onClose,
    settings,
    onSave,
    chatPolicy,
    onSavePolicy,
    autoReply,
    onSaveAutoReply,
}) => {
    const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);
    const [localAutoReplyEnabled, setLocalAutoReplyEnabled] = useState(autoReply?.enabled || false);
    const [localAutoReplyMessage, setLocalAutoReplyMessage] = useState(autoReply?.message || '');
    const [localPolicy, setLocalPolicy] = useState<Partial<OrganizationChatPolicy>>({});
    const [savingPolicy, setSavingPolicy] = useState(false);
    const { currentMembership } = useOrganizationStore();

    const isOrgAdmin = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
            setLocalAutoReplyEnabled(autoReply?.enabled || false);
            setLocalAutoReplyMessage(autoReply?.message || '');
            setLocalPolicy({
                enforce_honest_presence: chatPolicy?.enforce_honest_presence || false,
                enforce_read_receipts: chatPolicy?.enforce_read_receipts || false,
                allow_status_dnd: chatPolicy?.allow_status_dnd ?? true,
                allow_status_away: chatPolicy?.allow_status_away ?? true,
            });
        }
    }, [isOpen, settings, autoReply, chatPolicy]);

    if (!isOpen) return null;

    const handleSave = async () => {
        onSave(localSettings);

        // Save auto-reply
        if (onSaveAutoReply) {
            await onSaveAutoReply(localAutoReplyEnabled, localAutoReplyMessage);
        }

        onClose();
    };

    const handleSavePolicyClick = async () => {
        if (!onSavePolicy) return;
        setSavingPolicy(true);
        try {
            await onSavePolicy(localPolicy);
            toast.success('Chat policies updated');
        } catch {
            toast.error('Failed to save policies');
        } finally {
            setSavingPolicy(false);
        }
    };

    const handleReset = () => {
        setLocalSettings(DEFAULT_CHAT_SETTINGS);
    };

    const SettingToggle: React.FC<{
        label: string;
        description: string;
        icon: React.ReactNode;
        enabled: boolean;
        onChange: (value: boolean) => void;
        disabled?: boolean;
        enforcedNote?: string;
    }> = ({ label, description, icon, enabled, onChange, disabled, enforcedNote }) => (
        <div className={`flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${disabled ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    {icon}
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
                    {enforcedNote && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <Shield size={10} /> {enforcedNote}
                        </p>
                    )}
                </div>
            </div>
            <button
                onClick={() => !disabled && onChange(!enabled)}
                disabled={disabled}
                className={`
          relative w-12 h-6 rounded-full transition-all duration-200
          ${enabled
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }
          ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
        `}
            >
                <span
                    className={`
            absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200
            ${enabled ? 'left-7' : 'left-1'}
          `}
                />
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chat Settings</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Settings */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                    {/* Notifications Section */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Notifications</p>

                    <SettingToggle
                        label="Notifications"
                        description="Receive notifications for new messages"
                        icon={localSettings.notifications_enabled ? <Bell size={18} /> : <BellOff size={18} />}
                        enabled={localSettings.notifications_enabled}
                        onChange={(v) => setLocalSettings({ ...localSettings, notifications_enabled: v })}
                    />

                    <SettingToggle
                        label="Sound"
                        description="Play sound for new messages"
                        icon={localSettings.sound_enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                        enabled={localSettings.sound_enabled}
                        onChange={(v) => setLocalSettings({ ...localSettings, sound_enabled: v })}
                    />

                    <SettingToggle
                        label="Desktop Notifications"
                        description="Show browser notifications"
                        icon={<Monitor size={18} />}
                        enabled={localSettings.desktop_notifications}
                        onChange={(v) => setLocalSettings({ ...localSettings, desktop_notifications: v })}
                    />

                    {/* Privacy Section */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6">Privacy</p>

                    <SettingToggle
                        label="Read Receipts"
                        description="Let others know when you've read their messages"
                        icon={localSettings.show_read_receipts ? <Eye size={18} /> : <EyeOff size={18} />}
                        enabled={localSettings.show_read_receipts}
                        onChange={(v) => setLocalSettings({ ...localSettings, show_read_receipts: v })}
                        disabled={chatPolicy?.enforce_read_receipts}
                        enforcedNote={chatPolicy?.enforce_read_receipts ? 'Enforced by organization policy' : undefined}
                    />

                    <SettingToggle
                        label="Typing Indicators"
                        description="Show when you're typing"
                        icon={<Keyboard size={18} />}
                        enabled={localSettings.show_typing_indicators}
                        onChange={(v) => setLocalSettings({ ...localSettings, show_typing_indicators: v })}
                    />

                    {/* Display Section */}
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6">Display</p>

                    <SettingToggle
                        label="Compact Mode"
                        description="Show more messages with less spacing"
                        icon={<Layout size={18} />}
                        enabled={localSettings.compact_mode}
                        onChange={(v) => setLocalSettings({ ...localSettings, compact_mode: v })}
                    />

                    <SettingToggle
                        label="Enter to Send"
                        description="Press Enter to send, Shift+Enter for new line"
                        icon={<Keyboard size={18} />}
                        enabled={localSettings.enter_to_send}
                        onChange={(v) => setLocalSettings({ ...localSettings, enter_to_send: v })}
                    />

                    {/* Auto-Reply Section */}
                    {onSaveAutoReply && (
                        <>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 mt-6">Auto-Reply</p>

                            <SettingToggle
                                label="Out of Office"
                                description="Auto-reply when someone messages you directly"
                                icon={<Mail size={18} />}
                                enabled={localAutoReplyEnabled}
                                onChange={setLocalAutoReplyEnabled}
                            />

                            {localAutoReplyEnabled && (
                                <div className="mt-2 mb-3">
                                    <textarea
                                        value={localAutoReplyMessage}
                                        onChange={(e) => setLocalAutoReplyMessage(e.target.value)}
                                        placeholder="I'm currently out of office and will respond when I return..."
                                        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder-gray-400"
                                        rows={3}
                                        maxLength={500}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                                        {localAutoReplyMessage.length}/500
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Organization Chat Policies (Admin Only) */}
                    {isOrgAdmin && onSavePolicy && (
                        <>
                            <div className="mt-6 mb-3 flex items-center gap-2">
                                <Shield size={14} className="text-amber-500" />
                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Organization Policies</p>
                            </div>

                            <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-3 mb-3">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                                    <AlertTriangle size={12} />
                                    These policies apply to all members of your organization.
                                </p>
                            </div>

                            <SettingToggle
                                label="Enforce Honest Presence"
                                description="Prevent employees from faking 'Online' status when idle"
                                icon={<Eye size={18} />}
                                enabled={localPolicy.enforce_honest_presence || false}
                                onChange={(v) => setLocalPolicy(prev => ({ ...prev, enforce_honest_presence: v }))}
                            />

                            <SettingToggle
                                label="Enforce Read Receipts"
                                description="Prevent members from disabling read receipts"
                                icon={<EyeOff size={18} />}
                                enabled={localPolicy.enforce_read_receipts || false}
                                onChange={(v) => setLocalPolicy(prev => ({ ...prev, enforce_read_receipts: v }))}
                            />

                            <SettingToggle
                                label="Allow Do Not Disturb"
                                description="Let members set DND status to mute notifications"
                                icon={<BellOff size={18} />}
                                enabled={localPolicy.allow_status_dnd ?? true}
                                onChange={(v) => setLocalPolicy(prev => ({ ...prev, allow_status_dnd: v }))}
                            />

                            <SettingToggle
                                label="Allow Away Status"
                                description="Let members manually set Away status with a message"
                                icon={<Monitor size={18} />}
                                enabled={localPolicy.allow_status_away ?? true}
                                onChange={(v) => setLocalPolicy(prev => ({ ...prev, allow_status_away: v }))}
                            />

                            <button
                                onClick={handleSavePolicyClick}
                                disabled={savingPolicy}
                                className="mt-3 w-full py-2 text-sm font-medium bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-colors"
                            >
                                {savingPolicy ? 'Saving...' : 'Save Organization Policies'}
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <button
                        onClick={handleReset}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                    >
                        Reset to Defaults
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatSettingsModal;
