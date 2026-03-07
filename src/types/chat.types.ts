// Chat System Types
import type { ActionProposal, ActionStatus, ActionResult } from '@/types/copilot-actions.types';

// =====================================================
// PRESENCE
// =====================================================
export type PresenceStatus = 'online' | 'idle' | 'away' | 'dnd' | 'offline';

export interface UserPresence {
    user_id: string;
    organization_id: string;
    status: PresenceStatus;
    custom_message?: string;
    last_seen_at: string;
    last_heartbeat_at: string;
    updated_at?: string;
}

// =====================================================
// LABELS
// =====================================================
export interface ConversationLabel {
    id: string;
    organization_id: string;
    name: string;
    color: string;
    created_by?: string;
    created_at: string;
}

export interface ConversationLabelAssignment {
    id: string;
    conversation_id: string;
    label_id: string;
    assigned_by?: string;
    assigned_at: string;
    label?: ConversationLabel;
}

// =====================================================
// DOCUMENTS
// =====================================================
export interface ConversationDocument {
    id: string;
    conversation_id: string;
    uploaded_by: string;
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    description?: string;
    created_at: string;
    uploader?: { full_name: string };
}

// =====================================================
// LABEL PRESET COLORS
// =====================================================
export const LABEL_COLORS = [
    '#EF4444', // red
    '#F59E0B', // amber
    '#10B981', // emerald
    '#3B82F6', // blue
    '#8B5CF6', // violet
    '#EC4899', // pink
];

// =====================================================
// MESSAGES
// =====================================================
export interface Message {
    id: string;
    conversation_id?: string;
    content: string;
    sender_id: string;
    message_type?: 'text' | 'image' | 'file' | 'system' | 'sms';
    metadata?: Record<string, unknown>;
    is_edited?: boolean;
    edited_at?: string;
    created_at: string;
    sender?: {
        full_name: string;
        avatar_url?: string;
    };
    reactions?: MessageReaction[];
    attachments?: MessageAttachment[];
    action?: ActionProposal;
    actionStatus?: ActionStatus;
    actionResult?: ActionResult;
}

export interface MessageReaction {
    id: string;
    message_id: string;
    user_id: string;
    emoji: string;
    created_at: string;
    user?: {
        full_name: string;
    };
}

export interface MessageAttachment {
    id: string;
    message_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    file_url: string;
    thumbnail_url?: string;
    created_at: string;
}

export interface Conversation {
    id: string;
    organization_id?: string;
    name?: string;
    is_group?: boolean;
    channel_type?: 'direct' | 'group' | 'channel' | 'sms';
    description?: string;
    created_by?: string;
    created_at?: string;
    updated_at: string;
    participants?: ConversationParticipant[];
    last_message?: Message;
    unread_count?: number;
    // Phase 1 additions
    is_pinned?: boolean;
    pinned_at?: string;
    labels?: ConversationLabel[];
}

export interface ConversationParticipant {
    id?: string;
    conversation_id?: string;
    user_id?: string;
    role?: 'admin' | 'member';
    joined_at?: string;
    last_read_at?: string;
    is_muted?: boolean;
    is_pinned?: boolean;
    pinned_at?: string;
    visible_from?: string;
    user: {
        id?: string;
        full_name: string;
        avatar_url?: string;
        status?: PresenceStatus;
    };
}

export interface ChatSettings {
    id?: string;
    user_id?: string;
    notifications_enabled: boolean;
    sound_enabled: boolean;
    desktop_notifications: boolean;
    show_read_receipts: boolean;
    show_typing_indicators: boolean;
    compact_mode: boolean;
    enter_to_send: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface MockUser {
    id: string;
    full_name: string;
    status: 'Online' | 'Offline' | 'Away';
    avatar_url?: string;
}

// Default chat settings
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
    notifications_enabled: true,
    sound_enabled: true,
    desktop_notifications: true,
    show_read_receipts: true,
    show_typing_indicators: true,
    compact_mode: false,
    enter_to_send: true,
};

// Common emoji reactions
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

// Full emoji set for picker (organized by category)
export const EMOJI_CATEGORIES = {
    'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    'Objects': ['🎉', '🎊', '🎁', '🎈', '🔥', '⭐', '✨', '💫', '🌟', '💯', '💢', '💥', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤'],
};
