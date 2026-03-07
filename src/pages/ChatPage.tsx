import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { MessageCircle, ArrowLeft, Send, Plus, ExternalLink, X, Search, Smile, Settings, Hash, Users as UsersIcon, Sparkles, Phone, Trash2, TicketCheck, Paperclip, Bug, HelpCircle, CreditCard, UserCog, AlertTriangle, CheckCircle2, Edit3, XCircle, Pin, PinOff, Tag, FileText, ChevronDown, Crown, Shield, User, UserMinus, LogOut, UserPlus, MessageSquare, FolderOpen, Mail } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Message, Conversation, ChatSettings, DEFAULT_CHAT_SETTINGS, ConversationLabel, LABEL_COLORS } from '@/types/chat.types';
import type { PresenceStatus } from '@/types/chat.types';
import { useOrganizationStore } from '@/stores/organizationStore';
import { usePresence } from '@/hooks/usePresence';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { ChatSettingsModal } from '@/components/chat/ChatSettingsModal';
import { FileAttachmentButton, FilePreview } from '@/components/chat/FileAttachment';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import ChatMembersPanel from '@/components/chat/ChatMembersPanel';
import { AddMembersModal } from '@/components/chat/AddMembersModal';
import { LabelManager } from '@/components/chat/LabelManager';
import ConversationDocuments from '@/components/chat/ConversationDocuments';
import ActionCard from '@/components/copilot/ActionCard';
import SmsAgentSuggestions from '@/components/chat/SmsAgentSuggestions';
import { parseActionProposal } from '@/utils/parseActionProposal';
import { executeAction, checkActionPermission } from '@/utils/executeAction';
import type { ActionStatus } from '@/types/copilot-actions.types';
import { useTicketStore, type TicketCategory, type TicketPriority } from '@/stores/ticketStore';
import { uploadTicketAttachment, type AttachmentMeta } from '@/utils/ticketAttachments';
import TicketAttachmentUploader from '@/components/tickets/TicketAttachmentUploader';
import toast from 'react-hot-toast';
import { NotificationBell } from '@/components/ui/NotificationBell';

// Presence status colors
const statusColors: Record<PresenceStatus, string> = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    away: 'bg-amber-500',
    dnd: 'bg-red-500',
    offline: 'bg-gray-400',
};
const statusLabels: Record<PresenceStatus, string> = {
    online: 'Online',
    idle: 'Idle',
    away: 'Away',
    dnd: 'Do Not Disturb',
    offline: 'Offline',
};

// =====================================================
// TICKET INTAKE TYPES & CONSTANTS
// =====================================================
type TicketIntakeStep = 'idle' | 'describing' | 'uploading' | 'categorizing' | 'confirming' | 'submitted';

interface TicketDraft {
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    attachments: AttachmentMeta[];
    aiIntakeLog: Array<{ role: string; content: string; timestamp: string }>;
}

const INITIAL_TICKET_DRAFT: TicketDraft = {
    subject: '',
    description: '',
    category: 'general',
    priority: 'normal',
    attachments: [],
    aiIntakeLog: [],
};

// Patterns that indicate user wants to submit a ticket
const TICKET_INTENT_PATTERNS = [
    /\b(submit|create|open|file|raise)\s+(a\s+)?(ticket|issue|bug|report|request|support)/i,
    /\b(report|found)\s+(a\s+)?(bug|issue|problem|error|glitch)/i,
    /\b(something.*(broken|wrong|not working|crashing|doesn'?t work))/i,
    /\b(need|want)\s+(help|support|assistance)\b/i,
    /\b(having|got|have)\s+(a\s+)?(problem|issue|trouble|error)/i,
    /\bhelp\s+me\s+(with|fix|resolve)/i,
    /\b(feature\s+request|request\s+a?\s*feature)/i,
    /\b(billing|payment)\s+(issue|problem|question)/i,
];

// Patterns that indicate CRM actions -- redirect to CoPilot instead of AI processing
const COPILOT_REDIRECT_PATTERNS = [
    /\b(create|add|make|new)\s+(a\s+)?(customer|client|contact|borrower|patient|member)/i,
    /\b(create|add|make|new)\s+(a\s+)?(deal|pipeline|application|project|case|job|order)/i,
    /\b(create|add|make|new)\s+(a\s+)?(task|to-?do|follow-?up|reminder)/i,
    /\b(create|add|make|new)\s+(a\s+)?(invoice|quote|estimate|proposal|bid)/i,
    /\b(create|add|make|new)\s+(a\s+)?(note|comment)\s+(for|to|on|about)/i,
    /\b(send|draft|compose)\s+(a\s+)?(email|sms|text|message)\s+(to)/i,
    /\b(update|change|modify|edit)\s+(a\s+)?(customer|client|deal|task|invoice)/i,
    /\b(log|record)\s+(a\s+)?(call|meeting|activity)/i,
];

const CATEGORY_OPTIONS: { value: TicketCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'bug_report', label: 'Bug Report', icon: <Bug size={16} />, desc: 'Something is broken' },
    { value: 'feature_request', label: 'Feature Request', icon: <Sparkles size={16} />, desc: 'Suggest an improvement' },
    { value: 'general', label: 'General Inquiry', icon: <HelpCircle size={16} />, desc: 'General question' },
    { value: 'billing', label: 'Billing', icon: <CreditCard size={16} />, desc: 'Payment or subscription' },
    { value: 'account_issue', label: 'Account Issue', icon: <UserCog size={16} />, desc: 'Login or access problem' },
    { value: 'technical', label: 'Technical', icon: <AlertTriangle size={16} />, desc: 'Technical assistance' },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
];


// Read auth token from localStorage (AbortController workaround)
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

interface ChatPageProps {
    isPopup?: boolean;
}

// Memoized message bubble for performance
const MessageBubble = React.memo<{
    msg: Message;
    isOwn: boolean;
    currentUserId: string;
    onAddReaction: (messageId: string, emoji: string) => void;
    onRemoveReaction: (messageId: string, reactionId: string) => void;
    compact: boolean;
    onConfirmAction?: (messageId: string, editedFields: Record<string, any>) => void;
    onCancelAction?: (messageId: string) => void;
    isRead?: boolean;
    showReadReceipts?: boolean;
}>(({ msg, isOwn, currentUserId, onAddReaction, onRemoveReaction, compact, onConfirmAction, onCancelAction, isRead, showReadReceipts }) => {
    // For SMS messages, check metadata.direction to determine side
    const isSms = msg.message_type === 'sms';
    const isInboundSms = isSms && (msg.metadata as any)?.direction === 'inbound';
    const isLiveAgent = msg.sender_id === 'live-agent';
    const displayOwn = isSms ? !isInboundSms : (isOwn && !isLiveAgent);
    const customerName = isInboundSms ? ((msg.metadata as any)?.customer_name || 'Customer') : null;

    return (
        <div className={`flex flex-col ${displayOwn ? 'items-end' : 'items-start'} group`}>
            {/* Show customer name label for inbound SMS */}
            {isInboundSms && customerName && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-medium ml-1 mb-0.5 flex items-center gap-1">
                    <Phone size={8} /> {customerName}
                </span>
            )}
            {/* SMS direction indicator for outbound */}
            {isSms && !isInboundSms && (
                <span className="text-[10px] text-blue-400 font-medium mr-1 mb-0.5 flex items-center gap-1">
                    SMS <Phone size={8} />
                </span>
            )}
            {/* Live agent name label */}
            {isLiveAgent && (
                <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold ml-1 mb-0.5 flex items-center gap-1">
                    <Shield size={8} /> {msg.sender?.full_name || 'Admin'}
                </span>
            )}
            <div className={`
      max-w-[70%] ${compact ? 'px-3 py-2' : 'px-5 py-3'} rounded-2xl
      ${displayOwn
                    ? (isSms ? 'bg-green-600 text-white rounded-br-sm' : 'bg-blue-600 text-white rounded-br-sm')
                    : isLiveAgent
                        ? 'bg-green-100 dark:bg-green-900/30 text-gray-900 dark:text-white rounded-bl-sm border border-green-200/50 dark:border-green-800/50'
                        : (isInboundSms ? 'bg-green-100 dark:bg-green-900/30 text-gray-900 dark:text-white rounded-bl-sm border border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm')}
    `}>
                {/* Text content - hide generic "Sent X file(s)" if attachments present */}
                {msg.content && !(msg.content.match(/^Sent \d+ file\(s\)$/) && (msg.metadata as any)?.attachments?.length > 0) && (
                    <p className={`${compact ? 'text-sm' : 'text-[15px]'} leading-relaxed whitespace-pre-wrap`}>{msg.content}</p>
                )}
                {/* Attachment rendering */}
                {(msg.metadata as any)?.attachments?.map((att: any, i: number) => (
                    att.file_type?.startsWith('image/') ? (
                        <img
                            key={i}
                            src={att.file_url}
                            alt={att.file_name}
                            className="mt-2 max-w-full rounded-lg max-h-64 object-contain cursor-pointer"
                            onClick={() => window.open(att.file_url, '_blank')}
                            loading="lazy"
                        />
                    ) : (
                        <a
                            key={i}
                            href={att.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`mt-2 flex items-center gap-2 text-sm ${displayOwn ? 'text-blue-100 hover:text-white' : 'text-blue-600 dark:text-blue-400 hover:underline'}`}
                        >
                            <Paperclip size={14} /> {att.file_name}
                        </a>
                    )
                ))}
                <p className={`text-[10px] mt-1 flex items-center gap-1 ${displayOwn ? (isSms ? 'text-green-100' : 'text-blue-100') : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {/* Read receipt checkmarks for own messages */}
                    {displayOwn && showReadReceipts && (
                        <span className={`ml-0.5 ${isRead ? (isSms ? 'text-green-200' : 'text-blue-200') : (isSms ? 'text-green-300/50' : 'text-blue-300/50')}`}>
                            {isRead ? '✓✓' : '✓'}
                        </span>
                    )}
                </p>
            </div>
            {/* Reactions always rendered so + button appears on hover */}
            <MessageReactions
                messageId={msg.id}
                reactions={msg.reactions || []}
                currentUserId={currentUserId}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
                isOwnMessage={displayOwn}
            />
            {msg.action && onConfirmAction && onCancelAction && (
                <div className="max-w-[70%] w-full">
                    <ActionCard
                        action={msg.action}
                        status={msg.actionStatus || 'proposed'}
                        result={msg.actionResult}
                        onConfirm={(editedFields) => onConfirmAction(msg.id, editedFields)}
                        onCancel={() => onCancelAction(msg.id)}
                    />
                </div>
            )}
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';

// Memoized conversation item (compact)
const ConversationItem = React.memo<{
    conv: Conversation;
    isActive: boolean;
    unreadCount?: number;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
}>(({ conv, isActive, unreadCount = 0, onClick, onContextMenu }) => {
    const isSms = conv.channel_type === 'sms';
    const isChannel = conv.channel_type === 'channel';
    const isGroup = conv.channel_type === 'group';
    const hasUnread = unreadCount > 0 && !isActive;

    // Type-specific icon for compact view
    const TypeIcon = () => {
        if (isSms) return <Phone size={14} className="text-green-500" />;
        if (isChannel) return <Hash size={14} className="text-blue-500" />;
        if (isGroup) return <UsersIcon size={14} className="text-purple-500" />;
        return <MessageSquare size={14} className="text-gray-400" />;
    };

    return (
        <button
            onClick={onClick}
            onContextMenu={onContextMenu}
            className={`
      w-full px-3 py-2 rounded-xl mb-0.5
      flex items-center gap-2.5
      transition-all duration-150
      ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
    `}
        >
            {/* Compact type icon */}
            <div className="relative flex-shrink-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                    <TypeIcon />
                </div>
                {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
                )}
            </div>
            <div className="flex-1 text-left overflow-hidden min-w-0">
                <div className="flex items-center gap-1.5">
                    {conv.is_pinned && <Pin size={10} className="text-amber-500 flex-shrink-0" />}
                    <p className={`truncate text-sm ${hasUnread ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-900 dark:text-white'}`}>
                        {isChannel ? `# ${conv.name || 'channel'}` :
                            conv.name || conv.participants?.[0]?.user?.full_name || 'User'}
                    </p>
                    {/* Label color dots (max 3) */}
                    {conv.labels && conv.labels.length > 0 && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                            {conv.labels.slice(0, 3).map(l => (
                                <span key={l.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                            ))}
                            {conv.labels.length > 3 && (
                                <span className="text-[8px] text-gray-400">+{conv.labels.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>
                {/* SMS keeps phone number subtitle (useful info) */}
                {isSms && (
                    <p className="text-[10px] text-gray-500 truncate">{(conv as any).customer_phone || 'Customer'}</p>
                )}
            </div>
            {hasUnread && (
                <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-bold rounded-full bg-blue-500 text-white flex-shrink-0">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </button>
    );
});
ConversationItem.displayName = 'ConversationItem';

export const ChatPage: React.FC<ChatPageProps> = ({ isPopup = false }) => {
    const navigate = useNavigate();
    const { user } = useAuthContext();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const { teamMembers, currentOrganization } = useOrganizationStore();
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const MAX_CHAT_ATTACHMENTS = 5;
    const messageDraftsRef = useRef<Record<string, { text: string; files: File[] }>>({}); // Per-conversation drafts
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [isTyping, setIsTyping] = useState(false); // Sparky AI typing indicator
    const [typingUsers, setTypingUsers] = useState<{ userId: string; name: string }[]>([]);
    const [createType, setCreateType] = useState<'group' | 'channel'>('group');
    const typingTimeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const lastTypingBroadcastRef = useRef<number>(0);
    const broadcastChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Phase 1: Advanced Chat features
    const { getPresenceStatus, setMyStatus, clearManualStatus, manualStatus, chatPolicy, saveChatPolicy, autoReply, setAutoReply } = usePresence();
    const autoReplySentRef = useRef<Record<string, number>>({}); // conversationId -> timestamp of last auto-reply
    const [showMembersPanel, setShowMembersPanel] = useState(false);
    const [showAddMembersModal, setShowAddMembersModal] = useState(false);
    const [showLabelManager, setShowLabelManager] = useState(false);
    const [labelManagerConvId, setLabelManagerConvId] = useState<string>('');
    const [labelManagerAssignedIds, setLabelManagerAssignedIds] = useState<string[]>([]);
    const [chatTab, setChatTab] = useState<'chat' | 'files'>('chat');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; conv: Conversation } | null>(null);
    const [showStatusSelector, setShowStatusSelector] = useState(false);
    const [orgLabels, setOrgLabels] = useState<ConversationLabel[]>([]);
    const [activeLabelFilter, setActiveLabelFilter] = useState<string | null>(null);
    const [participantPinData, setParticipantPinData] = useState<Record<string, { is_pinned: boolean; pinned_at: string | null }>>({});
    // Read receipts: track other participants' last_read_at
    const [participantReadTimes, setParticipantReadTimes] = useState<Record<string, string>>({});
    const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
        const saved = localStorage.getItem('cxtrack_chat_settings');
        return saved ? JSON.parse(saved) : DEFAULT_CHAT_SETTINGS;
    });
    // Load chat settings from DB (syncs across devices, falls back to localStorage)
    useEffect(() => {
        const loadDbSettings = async () => {
            if (!user?.id) return;
            try {
                const token = getAuthToken();
                if (!token) return;
                const res = await fetch(
                    `${supabaseUrl}/rest/v1/chat_settings?user_id=eq.${user.id}&select=notifications_enabled,sound_enabled,desktop_notifications,show_read_receipts,show_typing_indicators,compact_mode,enter_to_send`,
                    { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                );
                if (res.ok) {
                    const rows = await res.json();
                    if (rows.length > 0) {
                        const dbSettings = rows[0];
                        const merged: ChatSettings = {
                            notifications_enabled: dbSettings.notifications_enabled ?? DEFAULT_CHAT_SETTINGS.notifications_enabled,
                            sound_enabled: dbSettings.sound_enabled ?? DEFAULT_CHAT_SETTINGS.sound_enabled,
                            desktop_notifications: dbSettings.desktop_notifications ?? DEFAULT_CHAT_SETTINGS.desktop_notifications,
                            show_read_receipts: dbSettings.show_read_receipts ?? DEFAULT_CHAT_SETTINGS.show_read_receipts,
                            show_typing_indicators: dbSettings.show_typing_indicators ?? DEFAULT_CHAT_SETTINGS.show_typing_indicators,
                            compact_mode: dbSettings.compact_mode ?? DEFAULT_CHAT_SETTINGS.compact_mode,
                            enter_to_send: dbSettings.enter_to_send ?? DEFAULT_CHAT_SETTINGS.enter_to_send,
                        };
                        setChatSettings(merged);
                        localStorage.setItem('cxtrack_chat_settings', JSON.stringify(merged));
                    }
                }
            } catch { /* use localStorage/defaults */ }
        };
        loadDbSettings();
    }, [user?.id]);

    // SMS Agent Suggestions state
    const [showSmsSuggestions, setShowSmsSuggestions] = useState(false);
    const [lastInboundSmsText, setLastInboundSmsText] = useState('');
    const [smsSuggestionKey, setSmsSuggestionKey] = useState(0);

    // Ticket Intake state
    const [ticketIntakeActive, setTicketIntakeActive] = useState(false);
    const [ticketIntakeStep, setTicketIntakeStep] = useState<TicketIntakeStep>('idle');
    const [ticketDraft, setTicketDraft] = useState<TicketDraft>({ ...INITIAL_TICKET_DRAFT });
    const [ticketDescriptionExchanges, setTicketDescriptionExchanges] = useState(0);
    const [ticketDraftId] = useState(() => `draft_${crypto.randomUUID().replace(/-/g, '').substring(0, 12)}`);

    // Live Chat state (post-ticket submission)
    const [activeTicketId, setActiveTicketId] = useState<string | null>(() => {
        try { return sessionStorage.getItem('sparky_active_ticket_id'); } catch { return null; }
    });
    const [liveAgentName, setLiveAgentName] = useState<string | null>(null);
    const liveChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const notificationAudioRef = useRef<HTMLAudioElement | null>(null);

    // Pre-load notification sound
    useEffect(() => {
        notificationAudioRef.current = new Audio('/notification.mp3');
        notificationAudioRef.current.volume = 0.5;
    }, []);

    // Request desktop notification permission if enabled
    useEffect(() => {
        if (chatSettings.desktop_notifications && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [chatSettings.desktop_notifications]);

    // Listen for new messages in OTHER conversations (dispatched by useChatUnreadCount hook)
    useEffect(() => {
        const handler = (e: Event) => {
            const msg = (e as CustomEvent).detail;
            if (!msg) return;
            // Don't notify if we're actively viewing this conversation
            if (msg.conversation_id === activeConversation?.id) return;

            // Play notification sound
            if (chatSettings.sound_enabled && notificationAudioRef.current) {
                notificationAudioRef.current.currentTime = 0;
                notificationAudioRef.current.play().catch(() => {});
            }
            // Show toast notification
            if (chatSettings.notifications_enabled) {
                toast('New message from a teammate', { icon: '💬', duration: 3000 });
            }
            // Show desktop notification
            if (chatSettings.desktop_notifications && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('CxTrack - New Message', {
                    body: 'You have a new chat message',
                    icon: '/favicon.ico',
                });
            }
        };
        window.addEventListener('chat-new-message', handler);
        return () => window.removeEventListener('chat-new-message', handler);
    }, [activeConversation?.id, chatSettings]);

    useEffect(() => {
        fetchConversations();
    }, [user]);

    useEffect(() => {
        if (activeConversation && !activeConversation.id.startsWith('new-') && activeConversation.id !== 'ai-agent') {
            loadMessages(activeConversation.id);
            markConversationRead(activeConversation.id);

            // Load other participants' last_read_at for read receipts
            (async () => {
                try {
                    const token = getAuthToken();
                    if (!token || !user?.id) return;
                    const res = await fetch(
                        `${supabaseUrl}/rest/v1/conversation_participants?conversation_id=eq.${activeConversation.id}&user_id=neq.${user.id}&select=user_id,last_read_at`,
                        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                    );
                    if (res.ok) {
                        const rows: { user_id: string; last_read_at: string | null }[] = await res.json();
                        const times: Record<string, string> = {};
                        rows.forEach(r => { if (r.last_read_at) times[r.user_id] = r.last_read_at; });
                        setParticipantReadTimes(times);
                    }
                } catch { /* non-critical */ }
            })();

            // Real-time channel for new messages (postgres_changes)
            const channel = supabase.channel(`page-chat-${activeConversation.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${activeConversation.id}`
                }, (payload: any) => {
                    const newMsg = payload.new;
                    if (newMsg.sender_id !== user?.id) {
                        setMessages(prev => [...prev, newMsg as Message]);
                        // Auto-mark read since user is actively viewing this conversation
                        markConversationRead(activeConversation.id);
                        // Play notification sound for active conversation
                        if (chatSettings.sound_enabled && notificationAudioRef.current) {
                            notificationAudioRef.current.currentTime = 0;
                            notificationAudioRef.current.play().catch(() => {});
                        }
                        // Trigger SMS suggestions for inbound SMS
                        if (newMsg.message_type === 'sms' && (newMsg.metadata as any)?.direction === 'inbound') {
                            setLastInboundSmsText(newMsg.content);
                            setSmsSuggestionKey(prev => prev + 1);
                            setShowSmsSuggestions(true);
                        }
                    }
                })
                .subscribe();

            // Broadcast channel for typing indicators + read receipts (ephemeral, no DB)
            const broadcastCh = supabase.channel(`chat-presence-${activeConversation.id}`)
                .on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
                    if (payload.userId === user?.id) return;
                    setTypingUsers(prev => {
                        const exists = prev.some(u => u.userId === payload.userId);
                        if (!exists) return [...prev, { userId: payload.userId, name: payload.name }];
                        return prev;
                    });
                    // Auto-clear after 3 seconds of no typing
                    if (typingTimeoutRef.current[payload.userId]) clearTimeout(typingTimeoutRef.current[payload.userId]);
                    typingTimeoutRef.current[payload.userId] = setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u.userId !== payload.userId));
                        delete typingTimeoutRef.current[payload.userId];
                    }, 3000);
                })
                .on('broadcast', { event: 'read-receipt' }, ({ payload }: { payload: any }) => {
                    if (payload.userId === user?.id) return;
                    setParticipantReadTimes(prev => ({
                        ...prev,
                        [payload.userId]: payload.readAt,
                    }));
                })
                .subscribe();
            broadcastChannelRef.current = broadcastCh;

            return () => {
                supabase.removeChannel(channel);
                supabase.removeChannel(broadcastCh);
                broadcastChannelRef.current = null;
                setTypingUsers([]);
                setParticipantReadTimes({});
                Object.values(typingTimeoutRef.current).forEach(t => clearTimeout(t));
                typingTimeoutRef.current = {};
            };
        }
    }, [activeConversation?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const fetchConversations = async () => {
        if (!user) return;

        const orgId = useOrganizationStore.getState().currentOrganization?.id;
        const token = getAuthToken();

        let query = supabase
            .from('conversations')
            .select(`
        *,
        participants:conversation_participants(
          user:user_profiles(id, full_name)
        )
      `)
            .order('updated_at', { ascending: false });

        // Scope to current organization so multi-org users only see relevant conversations
        if (orgId) {
            query = query.eq('organization_id', orgId);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
            console.error('Error fetching conversations:', fetchError);
            return;
        }

        if (data) {
            // Fetch pin data for current user's participant rows
            let pinMap: Record<string, { is_pinned: boolean; pinned_at: string | null }> = {};
            if (token && orgId) {
                try {
                    const pinRes = await fetch(
                        `${supabaseUrl}/rest/v1/conversation_participants?user_id=eq.${user.id}&select=conversation_id,is_pinned,pinned_at`,
                        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                    );
                    if (pinRes.ok) {
                        const pinRows: { conversation_id: string; is_pinned: boolean; pinned_at: string | null }[] = await pinRes.json();
                        pinRows.forEach(r => { pinMap[r.conversation_id] = { is_pinned: r.is_pinned, pinned_at: r.pinned_at }; });
                        setParticipantPinData(pinMap);
                    }
                } catch { /* non-critical */ }
            }

            // Fetch label assignments
            let labelAssignments: Record<string, ConversationLabel[]> = {};
            if (token && orgId) {
                try {
                    const labelsRes = await fetch(
                        `${supabaseUrl}/rest/v1/conversation_label_assignments?select=conversation_id,label:conversation_labels(id,name,color)&conversation_labels.organization_id=eq.${orgId}`,
                        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                    );
                    if (labelsRes.ok) {
                        const rows: { conversation_id: string; label: ConversationLabel | null }[] = await labelsRes.json();
                        rows.forEach(r => {
                            if (r.label) {
                                if (!labelAssignments[r.conversation_id]) labelAssignments[r.conversation_id] = [];
                                labelAssignments[r.conversation_id].push(r.label);
                            }
                        });
                    }
                } catch { /* non-critical */ }
            }

            // Fetch org labels for filter chips
            if (token && orgId) {
                try {
                    const olRes = await fetch(
                        `${supabaseUrl}/rest/v1/conversation_labels?organization_id=eq.${orgId}&order=name.asc`,
                        { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                    );
                    if (olRes.ok) setOrgLabels(await olRes.json());
                } catch { /* non-critical */ }
            }

            // For direct/group convos, filter out current user from participants
            // so the display shows the other person's name (not your own)
            const processed = data.map(conv => {
                const pin = pinMap[conv.id];
                const labels = labelAssignments[conv.id] || [];
                let processedConv = { ...conv, is_pinned: pin?.is_pinned || false, pinned_at: pin?.pinned_at, labels };
                if (conv.channel_type !== 'channel' && conv.participants) {
                    const others = conv.participants.filter(
                        (p: any) => p.user?.id !== user.id
                    );
                    processedConv = { ...processedConv, participants: others.length > 0 ? others : conv.participants };
                }
                return processedConv;
            });
            setConversations(processed);
        }
    };

    // Fetch per-conversation unread counts
    const fetchUnreadCounts = useCallback(async () => {
        if (!user?.id || !currentOrganization?.id) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_unread_message_counts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                },
                body: JSON.stringify({ p_user_id: user.id, p_organization_id: currentOrganization.id }),
            });
            if (!res.ok) return;
            const data: { conversation_id: string; unread_count: number }[] = await res.json();
            const counts: Record<string, number> = {};
            data.forEach(row => { counts[row.conversation_id] = row.unread_count || 0; });
            setUnreadCounts(counts);
        } catch { /* non-critical */ }
    }, [user?.id, currentOrganization?.id]);

    // Mark a conversation as read by updating last_read_at
    const markConversationRead = useCallback(async (conversationId: string) => {
        if (!user?.id || conversationId === 'ai-agent') return;
        try {
            const token = getAuthToken();
            if (!token) return;
            await fetch(`${supabaseUrl}/rest/v1/conversation_participants?conversation_id=eq.${conversationId}&user_id=eq.${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({ last_read_at: new Date().toISOString() }),
            });
            // Clear local unread count for this conversation
            setUnreadCounts(prev => ({ ...prev, [conversationId]: 0 }));
            // Signal sidebar hook to refresh badge count
            window.dispatchEvent(new CustomEvent('chat-mark-read'));
            // Broadcast read-receipt to other participants in real-time
            if (broadcastChannelRef.current) {
                broadcastChannelRef.current.send({
                    type: 'broadcast',
                    event: 'read-receipt',
                    payload: { userId: user.id, readAt: new Date().toISOString() },
                });
            }
        } catch { /* non-critical */ }
    }, [user?.id]);

    // Fetch unread counts alongside conversations
    useEffect(() => {
        fetchUnreadCounts();
    }, [fetchUnreadCounts, conversations.length]);

    // Switch conversation with per-conversation draft save/restore
    const switchConversation = useCallback((conv: Conversation | null) => {
        // Save current draft
        if (activeConversation) {
            const hasDraft = newMessage.trim() || attachedFiles.length > 0;
            if (hasDraft) {
                messageDraftsRef.current[activeConversation.id] = { text: newMessage, files: attachedFiles };
            } else {
                delete messageDraftsRef.current[activeConversation.id];
            }
        }
        // Load new conversation's draft (or clear)
        if (conv) {
            const draft = messageDraftsRef.current[conv.id];
            setNewMessage(draft?.text || '');
            setAttachedFiles(draft?.files || []);
        } else {
            setNewMessage('');
            setAttachedFiles([]);
        }
        setActiveConversation(conv);
    }, [activeConversation, newMessage, attachedFiles]);

    const loadMessages = async (conversationId: string) => {
        if (conversationId === 'ai-agent') return;
        try {
            const { data, error: fetchError } = await supabase
                .from('messages')
                .select(`
                *,
                sender:user_profiles(full_name),
                reactions:message_reactions(id, emoji, user_id)
            `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (fetchError) throw fetchError;

            if ((!data || data.length === 0) && conversationId.startsWith('new-mock-')) {
                setMessages([]);
            } else if (data) {
                setMessages(data);
                // Trigger SMS suggestions if last message is inbound SMS
                if (activeConversation?.channel_type === 'sms' && data.length > 0) {
                    const lastMsg = data[data.length - 1];
                    if (lastMsg.message_type === 'sms' && (lastMsg.metadata as any)?.direction === 'inbound') {
                        setLastInboundSmsText(lastMsg.content);
                        setSmsSuggestionKey(prev => prev + 1);
                        setShowSmsSuggestions(true);
                    } else {
                        setShowSmsSuggestions(false);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]); // Clear messages on error
        }
    };

    // Upload a file to chat-attachments bucket and return metadata
    const uploadChatAttachment = async (file: File, conversationId: string): Promise<{ file_name: string; file_type: string; file_size: number; file_url: string } | null> => {
        const token = getAuthToken();
        const orgId = currentOrganization?.id;
        if (!token || !orgId) return null;
        try {
            const fileExt = file.name.split('.').pop() || 'bin';
            const filePath = `${orgId}/${conversationId}/${crypto.randomUUID()}.${fileExt}`;
            // Upload via direct fetch (AbortController workaround)
            const formData = new FormData();
            formData.append('', file);
            const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/chat-attachments/${filePath}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey },
                body: formData,
            });
            if (!uploadRes.ok) {
                console.error('Chat attachment upload failed:', uploadRes.status);
                return null;
            }
            // Get signed URL (1 hour expiry)
            const signRes = await fetch(`${supabaseUrl}/storage/v1/object/sign/chat-attachments/${filePath}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ expiresIn: 3600 }),
            });
            const signData = await signRes.json();
            const signedUrl = signData?.signedURL
                ? `${supabaseUrl}/storage/v1${signData.signedURL}`
                : `${supabaseUrl}/storage/v1/object/chat-attachments/${filePath}`;
            return { file_name: file.name, file_type: file.type, file_size: file.size, file_url: signedUrl };
        } catch (err) {
            console.error('Chat attachment upload error:', err);
            return null;
        }
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && attachedFiles.length === 0) || !activeConversation) return;

        const messageContent = newMessage;
        const filesToSend = [...attachedFiles]; // capture before clearing
        setNewMessage('');
        setAttachedFiles([]);
        // Clear per-conversation draft since we're sending
        if (activeConversation) delete messageDraftsRef.current[activeConversation.id];
        setShowSmsSuggestions(false);

        const newMsg: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent || (filesToSend.length > 0 ? `Sent ${filesToSend.length} file(s)` : ''),
            sender_id: user?.id || 'user-me',
            created_at: new Date().toISOString(),
            sender: { full_name: 'Me' },
            reactions: [],
        };

        setMessages(prev => [...prev, newMsg]);

        // If it's a real conversation, save to DB via direct fetch (avoids AbortController)
        if (activeConversation && !activeConversation.id.startsWith('new-') && activeConversation.id !== 'ai-agent' && user) {
            const token = getAuthToken();
            if (token) {
                try {
                    // Upload all attached files in parallel
                    let attachmentsMeta: { file_name: string; file_type: string; file_size: number; file_url: string }[] = [];
                    if (filesToSend.length > 0) {
                        const results = await Promise.all(filesToSend.map(f => uploadChatAttachment(f, activeConversation.id)));
                        attachmentsMeta = results.filter((r): r is NonNullable<typeof r> => r !== null);
                        if (attachmentsMeta.length < filesToSend.length) {
                            toast.error(`${filesToSend.length - attachmentsMeta.length} file(s) failed to upload.`);
                        }
                    }
                    const hasImages = attachmentsMeta.some(a => a.file_type.startsWith('image/'));

                    // For SMS conversations, send the message as an SMS too
                    if (activeConversation.channel_type === 'sms' && (activeConversation as any).customer_phone) {
                        const chatOrgId = useOrganizationStore.getState().currentOrganization?.id;
                        const smsRes = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                to: (activeConversation as any).customer_phone,
                                body: messageContent,
                                organizationId: chatOrgId,
                                customer_id: (activeConversation as any).customer_id,
                                document_type: 'custom',
                            }),
                        });
                        if (!smsRes.ok) {
                            console.error('SMS send failed:', smsRes.status);
                            toast.error('Failed to send SMS. Message saved to chat only.');
                        }
                    }

                    const msgRes = await fetch(`${supabaseUrl}/rest/v1/messages`, {
                        method: 'POST',
                        headers: {
                            'apikey': supabaseAnonKey,
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({
                            conversation_id: activeConversation.id,
                            sender_id: user.id,
                            content: messageContent || (attachmentsMeta.length > 0 ? `Sent ${attachmentsMeta.length} file(s)` : ''),
                            message_type: hasImages ? 'image' : (attachmentsMeta.length > 0 ? 'file' : (activeConversation.channel_type === 'sms' ? 'sms' : 'text')),
                            ...(attachmentsMeta.length > 0 ? { metadata: { attachments: attachmentsMeta } } : {}),
                        }),
                    });
                    if (!msgRes.ok) {
                        console.error('Message send failed:', msgRes.status);
                        toast.error('Failed to save message.');
                    }

                    // Auto-reply: if recipient in a DM has auto_reply_enabled, insert a system message (throttled to 1hr per conversation)
                    if (msgRes.ok && activeConversation.channel_type === 'direct') {
                        const otherUserId = activeConversation.participants?.[0]?.user?.id;
                        if (otherUserId) {
                            const otherPresence = getPresenceStatus(otherUserId);
                            if (otherPresence?.auto_reply_enabled && otherPresence?.auto_reply_message) {
                                const lastSent = autoReplySentRef.current[activeConversation.id] || 0;
                                const hourAgo = Date.now() - 60 * 60 * 1000;
                                if (lastSent < hourAgo) {
                                    autoReplySentRef.current[activeConversation.id] = Date.now();
                                    const otherName = activeConversation.participants?.[0]?.user?.full_name || 'User';
                                    // Show as a local system message (not saved to DB to avoid noise)
                                    const autoReplyMsg: Message = {
                                        id: `auto-reply-${Date.now()}`,
                                        content: `${otherName} is away: "${otherPresence.auto_reply_message}"`,
                                        sender_id: 'system',
                                        message_type: 'system',
                                        created_at: new Date().toISOString(),
                                        sender: { full_name: 'System' },
                                        reactions: [],
                                    };
                                    setMessages(prev => [...prev, autoReplyMsg]);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error sending message:', err);
                }
            }
        }

        // AI Response Logic — call copilot-chat edge function
        if (activeConversation.id === 'ai-agent' || activeConversation.name === 'Sparky AI') {
            setIsTyping(true);
            (async () => {
                try {
                    // Read auth token from localStorage (avoids Supabase AbortController issue)
                    let accessToken: string | null = null;
                    try {
                        const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
                        const storageKey = ref ? `sb-${ref}-auth-token` : null;
                        const stored = storageKey ? localStorage.getItem(storageKey) : null;
                        if (stored) {
                            const parsed = JSON.parse(stored);
                            accessToken = parsed?.access_token || null;
                        }
                        if (!accessToken) {
                            const fallbackKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
                            if (fallbackKey) {
                                const parsed = JSON.parse(localStorage.getItem(fallbackKey) || '{}');
                                accessToken = parsed?.access_token || null;
                            }
                        }
                    } catch {
                        const { data: { session } } = await supabase.auth.getSession();
                        accessToken = session?.access_token || null;
                    }

                    if (!accessToken) {
                        addSparkyMessage("I need you to be signed in to use AI features. Please refresh the page and try again.");
                        setIsTyping(false);
                        return;
                    }

                    // =====================================================
                    // LIVE CHAT MODE (route messages to ticket thread)
                    // =====================================================
                    if (activeTicketId && !ticketIntakeActive) {
                        try {
                            await useTicketStore.getState().userReplyToTicket(activeTicketId, messageContent);
                        } catch (err) {
                            console.error('Failed to send live chat message:', err);
                            addSparkyMessage("Failed to send your message. Please try again.");
                        }
                        setIsTyping(false);
                        return;
                    }

                    // =====================================================
                    // TICKET INTAKE FLOW (handled before normal AI chat)
                    // =====================================================
                    if (ticketIntakeActive) {
                        await handleTicketIntakeMessage(messageContent, accessToken);
                        return;
                    }

                    // Check for ticket intent BEFORE sending to normal AI
                    if (TICKET_INTENT_PATTERNS.some(p => p.test(messageContent))) {
                        activateTicketIntake(messageContent);
                        return;
                    }

                    // Check for CRM action requests -- redirect to CoPilot
                    if (COPILOT_REDIRECT_PATTERNS.some(p => p.test(messageContent))) {
                        addSparkyMessage(
                            "That sounds like a CRM action! I'm focused on support and tickets here.\n\n" +
                            "To create or manage records (customers, deals, tasks, invoices), use the **CoPilot** -- you'll find it on any page by clicking the AI assistant icon.\n\n" +
                            "Is there anything else I can help you with here? I'm great at:\n" +
                            "\u2022 Submitting support tickets\n" +
                            "\u2022 Reporting bugs\n" +
                            "\u2022 Answering questions about CxTrack"
                        );
                        setIsTyping(false);
                        return;
                    }

                    // =====================================================
                    // NORMAL AI CHAT (existing copilot-chat flow)
                    // =====================================================
                    // Build conversation history from recent messages
                    const recentMessages = messages.slice(-10).map(m => ({
                        role: m.sender_id === 'sparky-ai' ? 'assistant' as const : 'user' as const,
                        content: m.content,
                    }));

                    const org = useOrganizationStore.getState().currentOrganization;
                    const membership = useOrganizationStore.getState().currentMembership;

                    const response = await fetch(`${supabaseUrl}/functions/v1/copilot-chat`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: messageContent,
                            conversationHistory: recentMessages,
                            context: {
                                page: 'Sparky',
                                industry: org?.industry_template || 'general_business',
                                orgName: org?.name || 'Your Organization',
                                userRole: membership?.role || 'user',
                            },
                        }),
                    });

                    const data = await response.json();

                    let aiContent: string;
                    let aiAction: Message['action'] = undefined;
                    let aiActionStatus: Message['actionStatus'] = undefined;

                    if (!response.ok) {
                        if (data.error === 'token_limit_reached') {
                            aiContent = "You've used all your AI tokens for this month. Upgrade your plan for more monthly tokens, or wait until your tokens reset at the start of the next billing period.";
                        } else {
                            aiContent = `Sorry, I encountered an issue processing your request. Please try again in a moment.`;
                        }
                    } else {
                        const rawResponse = data.response || "I'm not sure how to respond to that. Could you try rephrasing?";
                        // Parse for action proposals
                        const parsed = parseActionProposal(rawResponse);
                        aiContent = parsed.textContent;

                        // Permission gate: strip action if user doesn't have permission
                        if (parsed.action) {
                            if (checkActionPermission(parsed.action.actionType)) {
                                aiAction = parsed.action;
                                aiActionStatus = 'proposed';
                            } else {
                                aiContent += "\n\n\u26a0\ufe0f You don't have permission to perform this action. Contact your admin.";
                            }
                        }
                    }
                    // Log debug info to console for troubleshooting
                    if (data.debug) {
                        console.warn('[Sparky AI Debug]', data.debug);
                    }
                    if (data.provider === 'error' || data.provider === 'none') {
                        console.error('[Sparky AI] Provider issue:', data.provider, data.debug);
                    }

                    const aiMsg: Message = {
                        id: `ai-${Date.now()}`,
                        content: aiContent,
                        sender_id: 'sparky-ai',
                        created_at: new Date().toISOString(),
                        sender: { full_name: 'Sparky AI' },
                        reactions: [],
                        action: aiAction,
                        actionStatus: aiActionStatus,
                    };
                    setMessages(prev => [...prev, aiMsg]);
                } catch (err) {
                    console.error('Sparky AI error:', err);
                    addSparkyMessage("Sorry, I encountered an error. Please try again.");
                } finally {
                    setIsTyping(false);
                }
            })();
        }
    };

    // =====================================================
    // TICKET INTAKE HELPERS
    // =====================================================

    /** Add a Sparky AI message to the chat */
    const addSparkyMessage = useCallback((content: string) => {
        const aiMsg: Message = {
            id: `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            content,
            sender_id: 'sparky-ai',
            created_at: new Date().toISOString(),
            sender: { full_name: 'Sparky AI' },
            reactions: [],
        };
        setMessages(prev => [...prev, aiMsg]);
    }, []);

    /** Activate ticket intake mode */
    const activateTicketIntake = useCallback((initialMessage: string) => {
        setTicketIntakeActive(true);
        setTicketIntakeStep('describing');
        setTicketDescriptionExchanges(1);

        // Log user's initial message
        const now = new Date().toISOString();
        setTicketDraft(prev => ({
            ...prev,
            aiIntakeLog: [
                { role: 'user', content: initialMessage, timestamp: now },
            ],
        }));

        addSparkyMessage(
            "I'll help you submit a support ticket. Tell me more about the issue you're experiencing:\n\n" +
            "\u2022 What happened?\n" +
            "\u2022 What were you trying to do?\n" +
            "\u2022 Any error messages you saw?\n\n" +
            "The more detail you provide, the faster our team can help."
        );

        // Also log Sparky's response
        setTicketDraft(prev => ({
            ...prev,
            aiIntakeLog: [
                ...prev.aiIntakeLog,
                { role: 'assistant', content: "I'll help you submit a support ticket. Tell me more about the issue.", timestamp: new Date().toISOString() },
            ],
        }));
        setIsTyping(false);
    }, [addSparkyMessage]);

    /** Handle messages during ticket intake */
    const handleTicketIntakeMessage = useCallback(async (content: string, accessToken: string) => {
        const now = new Date().toISOString();

        // Log to intake log
        setTicketDraft(prev => ({
            ...prev,
            aiIntakeLog: [...prev.aiIntakeLog, { role: 'user', content, timestamp: now }],
        }));

        switch (ticketIntakeStep) {
            case 'describing': {
                const exchanges = ticketDescriptionExchanges + 1;
                setTicketDescriptionExchanges(exchanges);

                // After 2+ exchanges, attempt to summarize; otherwise ask a follow-up
                if (exchanges >= 2) {
                    // Try to summarize with AI
                    try {
                        const intakeHistory = [
                            ...ticketDraft.aiIntakeLog,
                            { role: 'user', content, timestamp: now },
                        ];

                        const response = await fetch(`${supabaseUrl}/functions/v1/copilot-chat`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: `[TICKET_INTAKE_SUMMARIZE]\n\nConversation:\n${intakeHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`,
                                context: {
                                    page: 'Ticket Intake',
                                    orgName: useOrganizationStore.getState().currentOrganization?.name || 'Your Organization',
                                },
                            }),
                        });

                        const data = await response.json();

                        if (response.ok && data.response) {
                            // Try to parse the TICKET_SUMMARY JSON from response
                            const summaryMatch = data.response.match(/\{[\s\S]*?"subject"[\s\S]*?"description"[\s\S]*?\}/);
                            if (summaryMatch) {
                                try {
                                    const summary = JSON.parse(summaryMatch[0]);
                                    setTicketDraft(prev => ({
                                        ...prev,
                                        subject: summary.subject || prev.subject,
                                        description: summary.description || content,
                                        category: summary.suggestedCategory || 'general',
                                        priority: summary.suggestedPriority || 'normal',
                                    }));
                                } catch {
                                    // Fallback: use the conversation as description
                                    setTicketDraft(prev => ({
                                        ...prev,
                                        subject: content.substring(0, 80),
                                        description: intakeHistory.filter(m => m.role === 'user').map(m => m.content).join('\n\n'),
                                    }));
                                }
                            } else {
                                setTicketDraft(prev => ({
                                    ...prev,
                                    subject: content.substring(0, 80),
                                    description: intakeHistory.filter(m => m.role === 'user').map(m => m.content).join('\n\n'),
                                }));
                            }
                        } else {
                            // Fallback without AI
                            setTicketDraft(prev => ({
                                ...prev,
                                subject: content.substring(0, 80),
                                description: ticketDraft.aiIntakeLog.filter(m => m.role === 'user').map(m => m.content).join('\n\n') + '\n\n' + content,
                            }));
                        }
                    } catch {
                        setTicketDraft(prev => ({
                            ...prev,
                            subject: content.substring(0, 80),
                            description: ticketDraft.aiIntakeLog.filter(m => m.role === 'user').map(m => m.content).join('\n\n') + '\n\n' + content,
                        }));
                    }

                    setTicketIntakeStep('uploading');
                    addSparkyMessage(
                        "Got it, I have a good picture of the issue. Would you like to attach any screenshots or files?\n\n" +
                        "Use the attachment button below to upload files, or type \"skip\" to continue without attachments."
                    );
                } else {
                    // Ask for more detail
                    addSparkyMessage(
                        "Thanks for that context. Can you provide any additional details? For example:\n\n" +
                        "\u2022 Steps to reproduce the issue\n" +
                        "\u2022 What browser/device you're using\n" +
                        "\u2022 How often this happens\n\n" +
                        "Or type \"that's all\" if you've covered everything."
                    );

                    // Handle "that's all" type responses
                    if (/^(that'?s?\s*(all|it|everything)|no\s*more|done|nothing\s*(else|more))/i.test(content)) {
                        setTicketDraft(prev => ({
                            ...prev,
                            subject: prev.aiIntakeLog.filter(m => m.role === 'user')[0]?.content.substring(0, 80) || content.substring(0, 80),
                            description: prev.aiIntakeLog.filter(m => m.role === 'user').map(m => m.content).join('\n\n'),
                        }));
                        setTicketIntakeStep('uploading');
                        addSparkyMessage(
                            "Got it. Would you like to attach any screenshots or files?\n\n" +
                            "Use the attachment button below, or type \"skip\" to continue."
                        );
                    }
                }
                break;
            }

            case 'uploading': {
                // User says they're done uploading or want to skip
                if (/^(skip|no|done|no\s*(files?|attachments?|screenshots?)|continue|next)/i.test(content)) {
                    setTicketIntakeStep('categorizing');
                    addSparkyMessage("Now let's categorize your ticket. Please select a category from the options below.");
                } else {
                    addSparkyMessage(
                        "Use the attachment button (paperclip icon) to upload files. When you're done, type \"done\" to continue."
                    );
                }
                break;
            }

            case 'categorizing': {
                // This step is handled via chip clicks, but handle text too
                const categoryMap: Record<string, TicketCategory> = {
                    'bug': 'bug_report', 'bug report': 'bug_report',
                    'feature': 'feature_request', 'feature request': 'feature_request',
                    'general': 'general', 'general inquiry': 'general',
                    'billing': 'billing', 'payment': 'billing',
                    'account': 'account_issue', 'account issue': 'account_issue',
                    'technical': 'technical', 'tech': 'technical',
                };
                const matched = Object.entries(categoryMap).find(([key]) => content.toLowerCase().includes(key));
                if (matched) {
                    setTicketDraft(prev => ({ ...prev, category: matched[1] }));
                    addSparkyMessage(`Category set to "${CATEGORY_OPTIONS.find(c => c.value === matched[1])?.label}". Now select a priority level.`);
                } else {
                    addSparkyMessage("Please select a category from the options shown above, or type one: Bug Report, Feature Request, General, Billing, Account Issue, Technical.");
                }
                break;
            }

            case 'confirming': {
                const lower = content.toLowerCase().trim();
                if (lower === 'submit' || lower === 'yes' || lower === 'confirm' || lower === 'send' || lower === 'looks good') {
                    await submitTicketFromIntake();
                } else if (lower === 'edit' || lower === 'change' || lower === 'modify') {
                    setTicketIntakeStep('describing');
                    setTicketDescriptionExchanges(0);
                    addSparkyMessage("Sure, let's start over. Tell me about the issue again.");
                } else if (lower === 'cancel' || lower === 'nevermind' || lower === 'never mind') {
                    resetTicketIntake();
                    addSparkyMessage("Ticket cancelled. Is there anything else I can help with?");
                } else {
                    addSparkyMessage('Type "submit" to send the ticket, "edit" to start over, or "cancel" to discard.');
                }
                break;
            }

            default:
                break;
        }

        // Log Sparky's response to intake log
        setTicketDraft(prev => ({
            ...prev,
            aiIntakeLog: [...prev.aiIntakeLog, { role: 'assistant', content: '[step transition]', timestamp: new Date().toISOString() }],
        }));

        setIsTyping(false);
    }, [ticketIntakeStep, ticketDescriptionExchanges, ticketDraft, addSparkyMessage]);

    /** Handle category chip click */
    const handleCategorySelect = useCallback((category: TicketCategory) => {
        setTicketDraft(prev => ({ ...prev, category }));
        const label = CATEGORY_OPTIONS.find(c => c.value === category)?.label || category;
        addSparkyMessage(`Category: ${label}. Now select a priority level:`);
        // We stay in categorizing step -- priority selection will advance to confirming
    }, [addSparkyMessage]);

    /** Handle priority chip click */
    const handlePrioritySelect = useCallback((priority: TicketPriority) => {
        setTicketDraft(prev => ({ ...prev, priority }));
        const label = PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority;
        setTicketIntakeStep('confirming');

        // Build summary
        setTicketDraft(prev => {
            const summary = `Here's a summary of your ticket:\n\n` +
                `**Subject:** ${prev.subject || '(auto-generated)'}\n` +
                `**Category:** ${CATEGORY_OPTIONS.find(c => c.value === prev.category)?.label || prev.category}\n` +
                `**Priority:** ${label}\n` +
                `**Attachments:** ${prev.attachments.length} file(s)\n\n` +
                `**Description:**\n${prev.description.substring(0, 300)}${prev.description.length > 300 ? '...' : ''}\n\n` +
                `Type "submit" to send, "edit" to start over, or "cancel" to discard.`;
            addSparkyMessage(summary);
            return { ...prev, priority };
        });
    }, [addSparkyMessage]);

    /** Handle file upload during ticket intake */
    const handleTicketFileUpload = useCallback(async (file: File) => {
        const orgId = useOrganizationStore.getState().currentOrganization?.id;
        if (!orgId) {
            toast.error('No organization selected');
            return;
        }
        try {
            const meta = await uploadTicketAttachment(file, orgId, ticketDraftId);
            setTicketDraft(prev => ({
                ...prev,
                attachments: [...prev.attachments, meta],
            }));
            addSparkyMessage(`Uploaded "${file.name}" successfully. Upload more files or type "done" to continue.`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed';
            toast.error(msg);
        }
    }, [ticketDraftId, addSparkyMessage]);

    /** Handle attachments from TicketAttachmentUploader */
    const handleTicketAttachmentChange = useCallback((attachments: AttachmentMeta[]) => {
        setTicketDraft(prev => ({ ...prev, attachments }));
    }, []);

    /** Submit the ticket */
    const submitTicketFromIntake = useCallback(async () => {
        setIsTyping(true);
        try {
            const ticket = await useTicketStore.getState().createTicketFromSparky({
                subject: ticketDraft.subject || 'Support Request',
                description: ticketDraft.description,
                category: ticketDraft.category as string,
                priority: ticketDraft.priority as string,
                attachments: ticketDraft.attachments,
                aiIntakeLog: ticketDraft.aiIntakeLog,
            });

            setTicketIntakeStep('submitted');

            // Enter live chat mode -- admin can respond directly
            setActiveTicketId(ticket.id);
            try { sessionStorage.setItem('sparky_active_ticket_id', ticket.id); } catch { /* ignore */ }

            addSparkyMessage(
                `Your ticket has been submitted successfully!\n\n` +
                `**Ticket ID:** ${ticket.id.substring(0, 8)}...\n` +
                `**Subject:** ${ticket.subject}\n` +
                `**Status:** Open\n\n` +
                `An admin may respond here directly. You'll see their name when they join.\n` +
                `You can also continue chatting here -- your messages will be added to the ticket thread.\n\n` +
                `Type anything to add a follow-up, or start a **new conversation** from the sidebar.`
            );

            // Reset intake state but keep activeTicketId
            setTimeout(() => {
                setTicketIntakeActive(false);
                setTicketIntakeStep('idle');
                setTicketDraft({ ...INITIAL_TICKET_DRAFT });
                setTicketDescriptionExchanges(0);
            }, 500);
        } catch (err) {
            console.error('Failed to submit ticket:', err);
            addSparkyMessage("Sorry, I encountered an error submitting the ticket. Please try again or use the Help Center form.");
        } finally {
            setIsTyping(false);
        }
    }, [ticketDraft, addSparkyMessage]);

    /** Reset ticket intake state */
    const resetTicketIntake = useCallback(() => {
        setTicketIntakeActive(false);
        setTicketIntakeStep('idle');
        setTicketDraft({ ...INITIAL_TICKET_DRAFT });
        setTicketDescriptionExchanges(0);
    }, []);

    /** End live chat mode */
    const endLiveChat = useCallback(() => {
        setActiveTicketId(null);
        setLiveAgentName(null);
        try { sessionStorage.removeItem('sparky_active_ticket_id'); } catch { /* ignore */ }
        if (liveChannelRef.current) {
            supabase.removeChannel(liveChannelRef.current);
            liveChannelRef.current = null;
        }
    }, []);

    // Realtime subscription for live chat -- listen for admin replies to the active ticket
    useEffect(() => {
        if (!activeTicketId || !user?.id) return;

        // Clean up previous subscription
        if (liveChannelRef.current) {
            supabase.removeChannel(liveChannelRef.current);
        }

        const channel = supabase
            .channel(`sparky-live-${activeTicketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${activeTicketId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Record<string, any>;
                    // Only show messages from other users (admin replies)
                    if (newMsg.user_id === user.id) return;
                    // Skip internal notes
                    if (newMsg.is_internal) return;

                    const agentName = newMsg.user_name || 'Admin';
                    setLiveAgentName(agentName);

                    // Add admin message to Sparky chat with special styling
                    const adminMsg: Message = {
                        id: `live-${newMsg.id || Date.now()}`,
                        content: newMsg.message,
                        sender_id: 'live-agent',
                        created_at: newMsg.created_at || new Date().toISOString(),
                        sender: { full_name: agentName },
                        reactions: [],
                    };
                    setMessages(prev => [...prev, adminMsg]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'support_tickets',
                    filter: `id=eq.${activeTicketId}`,
                },
                (payload) => {
                    const updated = payload.new as Record<string, any>;
                    if (updated.status === 'resolved' || updated.status === 'closed') {
                        addSparkyMessage(
                            `This ticket has been marked as **${updated.status}** by the admin.\n\n` +
                            `If you need further help, feel free to start a new conversation.`
                        );
                        endLiveChat();
                    }
                }
            )
            .subscribe();

        liveChannelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            liveChannelRef.current = null;
        };
    }, [activeTicketId, user?.id, addSparkyMessage, endLiveChat]);

    // Confirm an action proposed by Sparky AI
    const handleConfirmAction = useCallback(async (messageId: string, editedFields: Record<string, any>) => {
        // Set status to executing
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, actionStatus: 'executing' as ActionStatus } : m
        ));

        const message = messages.find(m => m.id === messageId);
        if (!message?.action) return;

        const result = await executeAction(message.action, editedFields);

        // Update the message with the result
        setMessages(prev => prev.map(m =>
            m.id === messageId
                ? { ...m, actionStatus: (result.success ? 'completed' : 'failed') as ActionStatus, actionResult: result }
                : m
        ));

        if (result.success) {
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    }, [messages]);

    // Cancel an action proposed by Sparky AI
    const handleCancelAction = useCallback((messageId: string) => {
        setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, actionStatus: 'cancelled' as ActionStatus } : m
        ));
    }, []);

    const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
        if (!user?.id) return;
        // Check if user already reacted with this emoji (toggle off)
        const existingMsg = messages.find(m => m.id === messageId);
        const existingReaction = existingMsg?.reactions?.find(
            r => r.emoji === emoji && r.user_id === user.id
        );
        if (existingReaction) {
            // Toggle off -- remove the reaction
            handleRemoveReaction(messageId, existingReaction.id);
            return;
        }
        // Optimistic UI update with temp ID
        const tempId = `reaction-${Date.now()}`;
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    reactions: [...(msg.reactions || []), { id: tempId, message_id: messageId, user_id: user.id, emoji }],
                };
            }
            return msg;
        }));
        // Persist to database
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await fetch(`${supabaseUrl}/rest/v1/message_reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({ message_id: messageId, user_id: user.id, emoji }),
            });
            if (res.ok) {
                const [inserted] = await res.json();
                // Replace temp ID with real DB ID
                setMessages(prev => prev.map(msg => {
                    if (msg.id === messageId) {
                        return { ...msg, reactions: (msg.reactions || []).map(r => r.id === tempId ? { ...r, id: inserted.id } : r) };
                    }
                    return msg;
                }));
            }
        } catch { /* optimistic UI already showing */ }
    }, [user?.id, messages]);

    const handleRemoveReaction = useCallback(async (messageId: string, reactionId: string) => {
        // Optimistic UI update
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => r.id !== reactionId),
                };
            }
            return msg;
        }));
        // Persist to database (skip temp IDs that never made it to DB)
        if (reactionId.startsWith('reaction-')) return;
        try {
            const token = getAuthToken();
            if (!token) return;
            await fetch(`${supabaseUrl}/rest/v1/message_reactions?id=eq.${reactionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                },
            });
        } catch { /* optimistic UI already updated */ }
    }, []);

    const handleEmojiSelect = (emoji: string) => {
        setNewMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    const handleStartNewConversation = async (member: any) => {
        if (!user) return;

        // Check if a direct conversation already exists with this member
        const existing = conversations.find(c =>
            (!c.channel_type || c.channel_type === 'direct') &&
            c.participants?.some(p => p.user?.id === member.id)
        );

        if (existing) {
            switchConversation(existing);
            setShowNewMessageModal(false);
            return;
        }

        // Use direct fetch to avoid Supabase AbortController issue
        const token = getAuthToken();
        if (!token) {
            toast.error('Session expired. Please refresh and try again.');
            return;
        }

        const orgId = useOrganizationStore.getState().currentOrganization?.id;
        if (!orgId) {
            toast.error('No organization selected.');
            return;
        }

        try {
            // Generate UUID client-side so we can reference it immediately
            // without relying on return=representation (which applies SELECT RLS
            // and fails because the user isn't a participant yet).
            const conversationId = crypto.randomUUID();

            // Step 1: Create conversation with return=minimal (bypasses SELECT RLS)
            const convRes = await fetch(`${supabaseUrl}/rest/v1/conversations`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    id: conversationId,
                    organization_id: orgId,
                    channel_type: 'direct',
                    is_group: false,
                    created_by: user.id,
                }),
            });

            if (!convRes.ok) {
                const errBody = await convRes.text();
                console.error('Conversation creation failed:', convRes.status, errBody);
                throw new Error(`Failed to create conversation (${convRes.status})`);
            }

            // Step 2: Add both participants
            const partRes = await fetch(`${supabaseUrl}/rest/v1/conversation_participants`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify([
                    { conversation_id: conversationId, user_id: user.id, role: 'member' },
                    { conversation_id: conversationId, user_id: member.id, role: 'member' },
                ]),
            });

            if (!partRes.ok) {
                console.error('Failed to add participants:', partRes.status);
                throw new Error('Failed to add participants');
            }

            // Build conversation object locally using the known UUID
            const newConv = {
                id: conversationId,
                organization_id: orgId,
                channel_type: 'direct',
                is_group: false,
                created_by: user.id,
                created_at: new Date().toISOString(),
                participants: [{ user: { id: member.id, full_name: member.full_name } }],
            };

            setConversations(prev => [newConv, ...prev]);
            switchConversation(newConv);
            setShowNewMessageModal(false);
            setMessages([]);
        } catch (error) {
            console.error('Failed to start conversation:', error);
            toast.error('Failed to start conversation. Please try again.');
        }
    };

    const handleClearChat = async () => {
        if (!activeConversation || activeConversation.id === 'ai-agent') return;
        if (!confirm('Are you sure you want to clear all messages in this conversation? This cannot be undone.')) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/messages?conversation_id=eq.${activeConversation.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${token}`,
                        'Prefer': 'return=minimal',
                    },
                }
            );
            if (res.ok) {
                setMessages([]);
                toast.success('Chat cleared.');
            } else {
                toast.error('Failed to clear chat.');
            }
        } catch {
            toast.error('Failed to clear chat.');
        }
    };

    const handleSaveSettings = async (settings: ChatSettings) => {
        setChatSettings(settings);
        localStorage.setItem('cxtrack_chat_settings', JSON.stringify(settings));
        // Persist to chat_settings DB table
        try {
            const token = getAuthToken();
            if (!token || !user?.id) return;
            await fetch(`${supabaseUrl}/rest/v1/chat_settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Prefer': 'resolution=merge-duplicates,return=minimal',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    ...settings,
                    updated_at: new Date().toISOString(),
                }),
            });
        } catch { /* localStorage fallback is fine */ }
    };

    // Toggle pin for a conversation
    const handleTogglePin = useCallback(async (conv: Conversation) => {
        const token = getAuthToken();
        if (!token || !user?.id) return;

        const isPinned = conv.is_pinned;
        const newPinned = !isPinned;

        try {
            const res = await fetch(
                `${supabaseUrl}/rest/v1/conversation_participants?conversation_id=eq.${conv.id}&user_id=eq.${user.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': supabaseAnonKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify({
                        is_pinned: newPinned,
                        pinned_at: newPinned ? new Date().toISOString() : null,
                    }),
                }
            );
            if (res.ok) {
                setConversations(prev => prev.map(c =>
                    c.id === conv.id ? { ...c, is_pinned: newPinned, pinned_at: newPinned ? new Date().toISOString() : null } : c
                ));
                setParticipantPinData(prev => ({
                    ...prev,
                    [conv.id]: { is_pinned: newPinned, pinned_at: newPinned ? new Date().toISOString() : null },
                }));
                toast.success(newPinned ? 'Chat pinned' : 'Chat unpinned');
            }
        } catch { toast.error('Failed to update pin'); }
        setContextMenu(null);
    }, [user?.id]);

    // Open label manager for a conversation via context menu
    const handleOpenLabels = useCallback((conv: Conversation) => {
        setLabelManagerConvId(conv.id);
        setLabelManagerAssignedIds((conv.labels || []).map(l => l.id));
        setShowLabelManager(true);
        setContextMenu(null);
    }, []);

    // Reset chat tab on conversation switch
    useEffect(() => {
        setChatTab('chat');
    }, [activeConversation?.id]);

    // Close context menu on click outside
    useEffect(() => {
        if (!contextMenu) return;
        const handler = () => setContextMenu(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, [contextMenu]);

    const handleOpenPopup = () => {
        window.open('/chat-window', 'CxTrackChat', 'width=450,height=700,menubar=no,toolbar=no,location=no,status=no');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && chatSettings.enter_to_send && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className={`
      h-full w-full 
      bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800
      flex flex-col
      ${!isPopup ? 'p-6' : ''}
    `}>
            <div className={`
        flex-1 
        bg-white/80 dark:bg-gray-800/80 
        backdrop-blur-xl
        ${!isPopup ? 'rounded-[32px] shadow-xl border border-white/20' : ''}
        overflow-hidden flex relative
      `}>

                {/* Left Side: Conversations List */}
                <div className={`
          w-full md:w-[350px] 
          border-r border-gray-200/50 dark:border-gray-700/50
          flex flex-col
          ${activeConversation ? 'hidden md:flex' : 'flex'}
        `}>
                    {/* Header */}
                    <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h2>
                        <div className="flex items-center gap-1">
                            {/* Status selector */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowStatusSelector(!showStatusSelector)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 relative"
                                    title="Set status"
                                >
                                    <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-800 ${statusColors[manualStatus || 'online']}`} />
                                    <User size={18} />
                                    {autoReply.enabled && <span className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" title="Auto-reply active" />}
                                </button>
                                {showStatusSelector && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowStatusSelector(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="p-1">
                                                {(['online', 'away', 'dnd', 'offline'] as PresenceStatus[]).map(s => {
                                                    // Policy restrictions
                                                    const disabled = (s === 'dnd' && !chatPolicy.allow_status_dnd)
                                                        || (s === 'away' && !chatPolicy.allow_status_away);
                                                    return (
                                                        <button
                                                            key={s}
                                                            onClick={() => {
                                                                if (disabled) return;
                                                                if (s === 'online') { clearManualStatus(); }
                                                                else { setMyStatus(s); }
                                                                setShowStatusSelector(false);
                                                            }}
                                                            disabled={disabled}
                                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                                                                disabled ? 'opacity-40 cursor-not-allowed' :
                                                                (manualStatus || 'online') === s
                                                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                                            }`}
                                                        >
                                                            <span className={`w-2.5 h-2.5 rounded-full ${statusColors[s]}`} />
                                                            <span className="flex-1 text-left">{statusLabels[s]}</span>
                                                            {disabled && <Shield size={10} className="text-amber-500" title="Blocked by org policy" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {chatPolicy.enforce_honest_presence && (
                                                <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                        <Shield size={10} /> Honest presence enforced
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                            <NotificationBell />
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"
                                title="Chat Settings"
                            >
                                <Settings size={18} />
                            </button>
                            {!isPopup && (
                                <button
                                    onClick={handleOpenPopup}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"
                                    title="Open in new window"
                                >
                                    <ExternalLink size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-4 pt-4 pb-2">
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl px-4 py-2.5 flex items-center">
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input
                                className="bg-transparent w-full outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Label filter chips */}
                    {orgLabels.length > 0 && (
                        <div className="px-4 pb-2 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                            {orgLabels.map(label => (
                                <button
                                    key={label.id}
                                    onClick={() => setActiveLabelFilter(prev => prev === label.id ? null : label.id)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
                                        activeLabelFilter === label.id
                                            ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-sm'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: label.color }} />
                                    {label.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-2">
                        {(() => {
                            // Sort: pinned first (by pinned_at desc), then by updated_at desc
                            const sortByPin = (a: Conversation, b: Conversation) => {
                                if (a.is_pinned && !b.is_pinned) return -1;
                                if (!a.is_pinned && b.is_pinned) return 1;
                                if (a.is_pinned && b.is_pinned) {
                                    return new Date(b.pinned_at || 0).getTime() - new Date(a.pinned_at || 0).getTime();
                                }
                                return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
                            };

                            const filteredConversations = conversations.filter(conv => {
                                // Label filter
                                if (activeLabelFilter && !(conv.labels || []).some(l => l.id === activeLabelFilter)) return false;
                                // Text search
                                if (!searchQuery.trim()) return true;
                                const query = searchQuery.toLowerCase();
                                const name = (conv.name || conv.participants?.[0]?.user?.full_name || '').toLowerCase();
                                return name.includes(query);
                            });

                            const channels = filteredConversations.filter(c => c.channel_type === 'channel').sort(sortByPin);
                            const groups = filteredConversations.filter(c => c.channel_type === 'group').sort(sortByPin);
                            const smsConversations = filteredConversations.filter(c => c.channel_type === 'sms').sort(sortByPin);
                            const directMessages = filteredConversations.filter(c => !c.channel_type || c.channel_type === 'direct').sort(sortByPin);

                            return (
                                <>
                                    {/* AI Assistant Section */}
                                    <div className="mb-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-1.5 block flex items-center gap-2">
                                            <Sparkles size={10} className="text-blue-500" /> AI Assistant
                                        </span>
                                        <button
                                            onClick={() => {
                                                const aiConv: any = {
                                                    id: 'ai-agent',
                                                    name: 'Sparky AI',
                                                    channel_type: 'direct',
                                                    participants: [{ user: { full_name: 'Sparky AI' } }]
                                                };
                                                switchConversation(aiConv);
                                                setTicketIntakeActive(false);
                                                setTicketIntakeStep('idle');
                                                setTicketDraft({ ...INITIAL_TICKET_DRAFT });
                                                setTicketDescriptionExchanges(0);
                                                endLiveChat();
                                                setMessages([
                                                    {
                                                        id: 'ai-welcome',
                                                        content: "Hey! I'm Sparky, your support assistant. Here's what I can do:\n\n\u2022 **Submit a support ticket** with screenshots and details\n\u2022 **Report a bug** or technical issue\n\u2022 **Get help** with CxTrack features and how-tos\n\u2022 **Live chat** with an admin after submitting a ticket\n\nFor CRM actions like creating customers, deals, or tasks, use the **CoPilot** available on any page.\n\nWhat can I help you with?",
                                                        sender_id: 'sparky-ai',
                                                        created_at: new Date().toISOString(),
                                                        sender: { full_name: 'Sparky AI' },
                                                        reactions: []
                                                    }
                                                ]);
                                            }}
                                            className={`
                          w-full px-3 py-2 rounded-xl mb-0.5
                          flex items-center gap-2.5
                          transition-all duration-150
                          ${activeConversation?.id === 'ai-agent' ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                        `}
                                        >
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${activeConversation?.id === 'ai-agent' ? 'bg-blue-100 dark:bg-blue-800/40' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                                                <Sparkles size={14} className={activeConversation?.id === 'ai-agent' ? 'text-blue-600 dark:text-blue-400' : 'text-white'} />
                                            </div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1 text-left">Sparky AI</p>
                                            <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 animate-pulse" />
                                        </button>
                                    </div>

                                    {channels.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Hash size={12} />
                                                    Channels
                                                </span>
                                                <button
                                                    onClick={() => { setCreateType('channel'); setShowCreateGroupModal(true); }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            {channels.map(conv => (
                                                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} unreadCount={unreadCounts[conv.id] || 0} onClick={() => switchConversation(conv)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, conv }); }} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Groups Section */}
                                    {groups.length > 0 && (
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <UsersIcon size={12} />
                                                    Groups
                                                </span>
                                                <button
                                                    onClick={() => { setCreateType('group'); setShowCreateGroupModal(true); }}
                                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            {groups.map(conv => (
                                                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} unreadCount={unreadCounts[conv.id] || 0} onClick={() => switchConversation(conv)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, conv }); }} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Direct Messages Section */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between px-3 py-2">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Direct Messages</span>
                                            <button
                                                onClick={() => setShowNewMessageModal(true)}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 hover:text-gray-600"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        {directMessages.map(conv => (
                                            <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} unreadCount={unreadCounts[conv.id] || 0} onClick={() => switchConversation(conv)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, conv }); }} />
                                        ))}
                                    </div>

                                    {/* SMS / Customer Texts Section */}
                                    {smsConversations.length > 0 && (
                                        <div className="mb-8">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Phone size={12} />
                                                    Customer Texts
                                                </span>
                                            </div>
                                            {smsConversations.map(conv => (
                                                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} unreadCount={unreadCounts[conv.id] || 0} onClick={() => switchConversation(conv)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, conv }); }} />
                                            ))}
                                        </div>
                                    )}

                                    {filteredConversations.length === 0 && (
                                        <div className="text-center py-10 text-gray-400">
                                            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>{searchQuery ? 'No results found' : 'No conversations yet'}</p>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* Right-click context menu */}
                    {contextMenu && (
                        <div
                            className="fixed z-[70] w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden py-1"
                            style={{ top: contextMenu.y, left: contextMenu.x }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => handleTogglePin(contextMenu.conv)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                {contextMenu.conv.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                {contextMenu.conv.is_pinned ? 'Unpin' : 'Pin conversation'}
                            </button>
                            <button
                                onClick={() => handleOpenLabels(contextMenu.conv)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <Tag size={14} />
                                Labels...
                            </button>
                        </div>
                    )}

                    {/* New Msg Btn */}
                    <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button
                            onClick={() => setShowNewMessageModal(true)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={18} />
                            New Message
                        </button>
                    </div>
                </div>

                {/* Right Side: Chat Area */}
                <div className={`
          flex-1 flex flex-col
          ${!activeConversation ? 'hidden md:flex bg-gray-50/50 dark:bg-gray-900/50 items-center justify-center' : 'flex'}
        `}>
                    {!activeConversation ? (
                        <div className="text-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-10 h-10 opacity-30" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Messages</h3>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 px-6 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => switchConversation(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${activeConversation.channel_type === 'sms' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                                        {activeConversation.channel_type === 'sms'
                                            ? <Phone size={18} />
                                            : activeConversation.id === 'ai-agent' ? <Sparkles size={18} />
                                            : (activeConversation.name?.charAt(0) || activeConversation.participants?.[0]?.user?.full_name?.charAt(0) || 'U')}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {activeConversation.channel_type === 'channel' ? `# ${activeConversation.name || 'channel'}` :
                                                activeConversation.name || activeConversation.participants?.[0]?.user?.full_name || 'Chat'}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            {activeConversation.channel_type === 'sms' ? (
                                                <>
                                                    <Phone size={10} className="text-green-500" />
                                                    <span className="text-xs text-gray-500">SMS - {(activeConversation as any).customer_phone || 'Customer'}</span>
                                                </>
                                            ) : activeConversation.id === 'ai-agent' ? (
                                                <>
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-xs text-gray-500">Always Online</span>
                                                </>
                                            ) : (() => {
                                                // Show presence for DM conversations
                                                const otherUserId = activeConversation.participants?.[0]?.user?.id;
                                                const presence = otherUserId ? getPresenceStatus(otherUserId) : null;
                                                const presenceStatus: PresenceStatus = presence?.status || 'offline';
                                                return (
                                                    <>
                                                        <span className={`w-2 h-2 rounded-full ${statusColors[presenceStatus]}`} />
                                                        <span className="text-xs text-gray-500">{statusLabels[presenceStatus]}</span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {/* Members Button (group/channel only) */}
                                    {activeConversation.id !== 'ai-agent' && (activeConversation.channel_type === 'group' || activeConversation.channel_type === 'channel') && (
                                        <button
                                            onClick={() => setShowMembersPanel(true)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            title="Members"
                                        >
                                            <UsersIcon size={16} />
                                        </button>
                                    )}
                                    {/* Clear Chat Button */}
                                    {activeConversation.id !== 'ai-agent' && (
                                        <button
                                            onClick={handleClearChat}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                                            title="Clear chat history"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    {/* Close/Exit Chat Button */}
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                        title="Close chat"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* OOO Auto-Reply Banner */}
                            {activeConversation.channel_type === 'direct' && activeConversation.id !== 'ai-agent' && (() => {
                                const otherUserId = activeConversation.participants?.[0]?.user?.id;
                                if (!otherUserId) return null;
                                const otherPresence = getPresenceStatus(otherUserId);
                                if (!otherPresence?.auto_reply_enabled || !otherPresence?.auto_reply_message) return null;
                                return (
                                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/15 border-b border-amber-200/50 dark:border-amber-800/30 flex items-start gap-2">
                                        <Mail size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                {activeConversation.participants?.[0]?.user?.full_name || 'This person'} has auto-reply on
                                            </p>
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-0.5 italic">
                                                "{otherPresence.auto_reply_message}"
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Tab bar: Chat | Files (hidden for Sparky AI and SMS) */}
                            {activeConversation.id !== 'ai-agent' && activeConversation.channel_type !== 'sms' && (
                                <div className="flex border-b border-gray-200/50 dark:border-gray-700/50">
                                    <button
                                        onClick={() => setChatTab('chat')}
                                        className={`flex-1 py-2 text-xs font-semibold text-center transition-colors relative ${
                                            chatTab === 'chat'
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        Chat
                                        {chatTab === 'chat' && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
                                    </button>
                                    <button
                                        onClick={() => setChatTab('files')}
                                        className={`flex-1 py-2 text-xs font-semibold text-center transition-colors relative flex items-center justify-center gap-1 ${
                                            chatTab === 'files'
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <FolderOpen size={12} />
                                        Files
                                        {chatTab === 'files' && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
                                    </button>
                                </div>
                            )}

                            {/* Files tab: ConversationDocuments */}
                            {chatTab === 'files' && activeConversation.id !== 'ai-agent' && activeConversation.channel_type !== 'sms' && (
                                <ConversationDocuments conversationId={activeConversation.id} />
                            )}

                            {/* Messages Area (hidden when files tab active) */}
                            {chatTab === 'chat' && <div className={`flex-1 overflow-y-auto p-6 ${chatSettings.compact_mode ? 'space-y-2' : 'space-y-4'}`}>
                                {messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        isOwn={msg.sender_id === (user?.id || 'user-me')}
                                        currentUserId={user?.id || 'user-me'}
                                        onAddReaction={handleAddReaction}
                                        onRemoveReaction={handleRemoveReaction}
                                        compact={chatSettings.compact_mode}
                                        onConfirmAction={handleConfirmAction}
                                        onCancelAction={handleCancelAction}
                                        isRead={Object.values(participantReadTimes).some(readAt => readAt >= msg.created_at)}
                                        showReadReceipts={chatSettings.show_read_receipts}
                                    />
                                ))}
                                {/* Sparky AI typing indicator */}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-gray-100 dark:bg-gray-800 px-5 py-3 rounded-2xl rounded-bl-sm">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Team member typing indicators */}
                                {typingUsers.length > 0 && (
                                    <div className="flex items-center gap-2 px-2 py-1">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                        </span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>}

                            {chatTab === 'chat' && (<>
                            {/* Attached Files Preview */}
                            {attachedFiles.length > 0 && (
                                <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <div className="flex flex-wrap gap-2">
                                        {attachedFiles.map((file, i) => (
                                            <FilePreview key={i} file={file} onRemove={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))} />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">{attachedFiles.length}/{MAX_CHAT_ATTACHMENTS} files</p>
                                </div>
                            )}

                            {/* SMS Agent Suggestions */}
                            {activeConversation.channel_type === 'sms' && (
                                <SmsAgentSuggestions
                                    key={smsSuggestionKey}
                                    organizationId={useOrganizationStore.getState().currentOrganization?.id || ''}
                                    inboundMessage={lastInboundSmsText}
                                    customerName={activeConversation.name || undefined}
                                    customerPhone={(activeConversation as any).customer_phone || undefined}
                                    conversationHistory={messages.slice(-10).map(m => ({
                                        role: (m.message_type === 'sms' && (m.metadata as any)?.direction === 'inbound' ? 'customer' : 'agent') as 'customer' | 'agent',
                                        content: m.content,
                                    }))}
                                    onSelectSuggestion={(text) => {
                                        setNewMessage(text);
                                        setShowSmsSuggestions(false);
                                        inputRef.current?.focus();
                                    }}
                                    onDismiss={() => setShowSmsSuggestions(false)}
                                    visible={showSmsSuggestions}
                                />
                            )}

                            {/* Ticket Intake: Category Selection Chips */}
                            {ticketIntakeActive && ticketIntakeStep === 'categorizing' && !ticketDraft.category && (
                                <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-purple-50/50 dark:bg-purple-900/10">
                                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                                        <TicketCheck size={12} /> Select a category:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {CATEGORY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handleCategorySelect(opt.value)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ticket Intake: Priority Selection Chips */}
                            {ticketIntakeActive && ticketIntakeStep === 'categorizing' && ticketDraft.category && (
                                <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-purple-50/50 dark:bg-purple-900/10">
                                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2 flex items-center gap-1.5">
                                        <AlertTriangle size={12} /> Select priority:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {PRIORITY_OPTIONS.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => handlePrioritySelect(opt.value)}
                                                className={`px-3 py-1.5 text-xs font-medium rounded-full ${opt.color} hover:opacity-80 transition-opacity`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ticket Intake: Confirmation Actions */}
                            {ticketIntakeActive && ticketIntakeStep === 'confirming' && (
                                <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-purple-50/50 dark:bg-purple-900/10">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={submitTicketFromIntake}
                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors"
                                        >
                                            <CheckCircle2 size={14} />
                                            Submit Ticket
                                        </button>
                                        <button
                                            onClick={() => {
                                                setTicketIntakeStep('describing');
                                                setTicketDescriptionExchanges(0);
                                                addSparkyMessage("Let's start over. Tell me about the issue.");
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <Edit3 size={14} />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                resetTicketIntake();
                                                addSparkyMessage("Ticket cancelled. Is there anything else I can help with?");
                                            }}
                                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        >
                                            <XCircle size={14} />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Ticket Intake: File Upload Area */}
                            {ticketIntakeActive && ticketIntakeStep === 'uploading' && (
                                <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-purple-50/50 dark:bg-purple-900/10">
                                    <TicketAttachmentUploader
                                        organizationId={useOrganizationStore.getState().currentOrganization?.id || ''}
                                        ticketOrDraftId={ticketDraftId}
                                        attachments={ticketDraft.attachments}
                                        onAttachmentsChange={handleTicketAttachmentChange}
                                        compact
                                    />
                                    <button
                                        onClick={() => {
                                            setTicketIntakeStep('categorizing');
                                            addSparkyMessage(
                                                `${ticketDraft.attachments.length > 0 ? `${ticketDraft.attachments.length} file(s) attached. ` : ''}Now let's categorize your ticket. Select a category:`
                                            );
                                        }}
                                        className="mt-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                    >
                                        {ticketDraft.attachments.length > 0 ? 'Done uploading, continue \u2192' : 'Skip attachments \u2192'}
                                    </button>
                                </div>
                            )}

                            {/* Ticket Intake Progress Indicator */}
                            {ticketIntakeActive && ticketIntakeStep !== 'idle' && ticketIntakeStep !== 'submitted' && (
                                <div className="px-4 py-1.5 bg-purple-600/10 dark:bg-purple-900/20 border-t border-purple-200/50 dark:border-purple-800/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <TicketCheck size={12} className="text-purple-600 dark:text-purple-400" />
                                            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                                Ticket Intake
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {['describing', 'uploading', 'categorizing', 'confirming'].map((step, i) => (
                                                <div
                                                    key={step}
                                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                                                        step === ticketIntakeStep
                                                            ? 'bg-purple-600 dark:bg-purple-400'
                                                            : ['describing', 'uploading', 'categorizing', 'confirming'].indexOf(ticketIntakeStep) > i
                                                                ? 'bg-purple-400 dark:bg-purple-600'
                                                                : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Live Chat Banner */}
                            {activeTicketId && activeConversation?.id === 'ai-agent' && (
                                <div className="px-4 py-2.5 border-t border-green-200/50 dark:border-green-800/30 bg-green-50/80 dark:bg-green-900/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                                        </span>
                                        <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                            {liveAgentName
                                                ? `You are now talking to ${liveAgentName}`
                                                : 'Live ticket chat active -- waiting for admin response'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            endLiveChat();
                                            addSparkyMessage("Live chat ended. Is there anything else I can help with?");
                                        }}
                                        className="text-[10px] font-medium text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 px-2 py-0.5 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                    >
                                        End chat
                                    </button>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-2">
                                    {/* Emoji Button */}
                                    <div className={`relative ${showEmojiPicker ? 'z-40' : ''}`}>
                                        <button
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                            title="Add emoji"
                                        >
                                            <Smile size={20} />
                                        </button>
                                        {showEmojiPicker && (
                                            <EmojiPicker
                                                onSelect={handleEmojiSelect}
                                                onClose={() => setShowEmojiPicker(false)}
                                            />
                                        )}
                                    </div>

                                    {/* File Attachment - during ticket intake uploading step, wire to ticket upload */}
                                    {ticketIntakeActive && ticketIntakeStep === 'uploading' ? (
                                        <FileAttachmentButton
                                            onFileSelect={(file) => { if (file) handleTicketFileUpload(file); }}
                                            disabled={ticketDraft.attachments.length >= 5}
                                        />
                                    ) : (
                                        <FileAttachmentButton
                                            onFileSelect={(file) => {
                                                if (attachedFiles.length < MAX_CHAT_ATTACHMENTS) {
                                                    setAttachedFiles(prev => [...prev, file]);
                                                } else {
                                                    toast.error(`Maximum ${MAX_CHAT_ATTACHMENTS} files per message`);
                                                }
                                            }}
                                            disabled={attachedFiles.length >= MAX_CHAT_ATTACHMENTS}
                                        />
                                    )}

                                    {/* Input */}
                                    <input
                                        ref={inputRef}
                                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                        placeholder={ticketIntakeActive
                                            ? ticketIntakeStep === 'describing' ? "Describe the issue..."
                                            : ticketIntakeStep === 'uploading' ? 'Type "done" when finished uploading...'
                                            : ticketIntakeStep === 'confirming' ? 'Type "submit", "edit", or "cancel"...'
                                            : "Type your message..."
                                            : "Type your message..."}
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            // Broadcast typing indicator (debounced to every 2 seconds)
                                            if (e.target.value && chatSettings.show_typing_indicators && broadcastChannelRef.current && activeConversation?.id !== 'ai-agent') {
                                                const now = Date.now();
                                                if (now - lastTypingBroadcastRef.current > 2000) {
                                                    lastTypingBroadcastRef.current = now;
                                                    broadcastChannelRef.current.send({
                                                        type: 'broadcast',
                                                        event: 'typing',
                                                        payload: { userId: user?.id, name: user?.user_metadata?.full_name || 'Someone' },
                                                    });
                                                }
                                            }
                                        }}
                                        onPaste={(e) => {
                                            const items = e.clipboardData?.items;
                                            if (!items) return;
                                            const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'));
                                            if (imageItems.length === 0) return; // allow normal text paste
                                            e.preventDefault();
                                            const remaining = MAX_CHAT_ATTACHMENTS - attachedFiles.length;
                                            if (remaining <= 0) {
                                                toast.error(`Maximum ${MAX_CHAT_ATTACHMENTS} files per message`);
                                                return;
                                            }
                                            const newFiles: File[] = [];
                                            for (const item of imageItems.slice(0, remaining)) {
                                                const file = item.getAsFile();
                                                if (file) {
                                                    const ext = file.type.split('/')[1] || 'png';
                                                    newFiles.push(new File([file], `pasted-image-${Date.now()}-${newFiles.length}.${ext}`, { type: file.type }));
                                                }
                                            }
                                            if (newFiles.length > 0) setAttachedFiles(prev => [...prev, ...newFiles]);
                                        }}
                                        onKeyPress={handleKeyPress}
                                    />

                                    {/* Send Button */}
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() && attachedFiles.length === 0}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-full transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                            </>)}
                        </>
                    )}
                </div>

                {/* New Message Modal */}
                {showNewMessageModal && (
                    <div className="absolute inset-0 z-50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Message</h3>
                                <button
                                    onClick={() => setShowNewMessageModal(false)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                >
                                    <X size={20} className="text-gray-500" />
                                </button>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500 mb-3 uppercase font-bold tracking-wider">Suggested Contacts</p>
                                <div className="space-y-2">
                                    {teamMembers.filter(u => u.id !== user?.id).map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => handleStartNewConversation(u)}
                                            className="w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl flex items-center gap-3 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {u.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 dark:text-white">{u.full_name}</p>
                                                <p className="text-xs text-gray-500">Team Member</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Group Modal */}
                {showCreateGroupModal && (
                    <CreateGroupModal
                        isOpen={showCreateGroupModal}
                        onClose={() => setShowCreateGroupModal(false)}
                        type={createType}
                        onCreated={(conv) => {
                            setConversations(prev => [conv, ...prev]);
                            switchConversation(conv);
                            setShowCreateGroupModal(false);
                        }}
                    />
                )}
            </div>

            {/* Chat Members Panel */}
            {activeConversation && activeConversation.id !== 'ai-agent' && (
                <ChatMembersPanel
                    isOpen={showMembersPanel}
                    onClose={() => setShowMembersPanel(false)}
                    conversation={activeConversation}
                    currentUserId={user?.id || ''}
                    getPresenceStatus={getPresenceStatus}
                    onMembersChanged={() => fetchConversations()}
                    onAddMembers={() => { setShowMembersPanel(false); setShowAddMembersModal(true); }}
                />
            )}

            {/* Add Members Modal */}
            {activeConversation && activeConversation.id !== 'ai-agent' && (
                <AddMembersModal
                    isOpen={showAddMembersModal}
                    onClose={() => setShowAddMembersModal(false)}
                    conversation={activeConversation}
                    existingMemberIds={[
                        ...(activeConversation.participants?.map(p => p.user?.id).filter(Boolean) as string[] || []),
                        user?.id || '',
                    ]}
                    onMembersAdded={() => fetchConversations()}
                />
            )}

            {/* Label Manager */}
            <LabelManager
                isOpen={showLabelManager}
                onClose={() => setShowLabelManager(false)}
                conversationId={labelManagerConvId}
                assignedLabelIds={labelManagerAssignedIds}
                onLabelsChanged={() => fetchConversations()}
            />

            {/* Settings Modal */}
            <ChatSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={chatSettings}
                onSave={handleSaveSettings}
                chatPolicy={chatPolicy}
                onSavePolicy={saveChatPolicy}
                autoReply={autoReply}
                onSaveAutoReply={setAutoReply}
            />
        </div>
    );
};
