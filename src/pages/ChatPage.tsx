import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { MessageCircle, ArrowLeft, Send, Plus, ExternalLink, X, Search, Smile, Settings, Hash, Users as UsersIcon, Sparkles, Phone, Trash2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Message, Conversation, ChatSettings, DEFAULT_CHAT_SETTINGS } from '@/types/chat.types';
import { useOrganizationStore } from '@/stores/organizationStore';
import { EmojiPicker } from '@/components/chat/EmojiPicker';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { ChatSettingsModal } from '@/components/chat/ChatSettingsModal';
import { FileAttachmentButton, FilePreview } from '@/components/chat/FileAttachment';
import { CreateGroupModal } from '@/components/chat/CreateGroupModal';
import ActionCard from '@/components/copilot/ActionCard';
import { parseActionProposal } from '@/utils/parseActionProposal';
import { executeAction, checkActionPermission } from '@/utils/executeAction';
import type { ActionStatus } from '@/types/copilot-actions.types';
import toast from 'react-hot-toast';


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
}>(({ msg, isOwn, currentUserId, onAddReaction, onRemoveReaction, compact, onConfirmAction, onCancelAction }) => {
    // For SMS messages, check metadata.direction to determine side
    const isSms = msg.message_type === 'sms';
    const isInboundSms = isSms && (msg.metadata as any)?.direction === 'inbound';
    const displayOwn = isSms ? !isInboundSms : isOwn;
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
            <div className={`
      max-w-[70%] ${compact ? 'px-3 py-2' : 'px-5 py-3'} rounded-2xl
      ${displayOwn
                    ? (isSms ? 'bg-green-600 text-white rounded-br-sm' : 'bg-blue-600 text-white rounded-br-sm')
                    : (isInboundSms ? 'bg-green-100 dark:bg-green-900/30 text-gray-900 dark:text-white rounded-bl-sm border border-green-200 dark:border-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm')}
    `}>
                <p className={`${compact ? 'text-sm' : 'text-[15px]'} leading-relaxed whitespace-pre-wrap`}>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${displayOwn ? (isSms ? 'text-green-100' : 'text-blue-100') : 'text-gray-500 dark:text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {msg.reactions && msg.reactions.length > 0 && (
                    <MessageReactions
                        messageId={msg.id}
                        reactions={msg.reactions}
                        currentUserId={currentUserId}
                        onAddReaction={onAddReaction}
                        onRemoveReaction={onRemoveReaction}
                        isOwnMessage={displayOwn}
                    />
                )}
            </div>
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

// Memoized conversation item
const ConversationItem = React.memo<{
    conv: Conversation;
    isActive: boolean;
    onClick: () => void;
}>(({ conv, isActive, onClick }) => {
    const isSms = conv.channel_type === 'sms';
    return (
        <button
            onClick={onClick}
            className={`
      w-full p-3 rounded-2xl mb-1
      flex items-center gap-3
      transition-all duration-200
      ${isActive ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
    `}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${isSms ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                {isSms ? <Phone size={20} /> : (conv.participants?.[0]?.user?.full_name?.charAt(0) || 'U')}
            </div>
            <div className="flex-1 text-left overflow-hidden">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {conv.channel_type === 'channel' ? `# ${conv.name || 'channel'}` :
                        conv.name || conv.participants?.[0]?.user?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                    {isSms ? `SMS - ${(conv as any).customer_phone || 'Customer'}` : 'Click to view message'}
                </p>
            </div>
        </button>
    );
});
ConversationItem.displayName = 'ConversationItem';

export const ChatPage: React.FC<ChatPageProps> = ({ isPopup = false }) => {
    const { user } = useAuthContext();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const { teamMembers } = useOrganizationStore();
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showNewMessageModal, setShowNewMessageModal] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [createType, setCreateType] = useState<'group' | 'channel'>('group');
    const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
        const saved = localStorage.getItem('cxtrack_chat_settings');
        return saved ? JSON.parse(saved) : DEFAULT_CHAT_SETTINGS;
    });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchConversations();
    }, [user]);

    useEffect(() => {
        if (activeConversation && !activeConversation.id.startsWith('new-') && activeConversation.id !== 'ai-agent') {
            loadMessages(activeConversation.id);

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
                    }
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
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
            // For direct/group convos, filter out current user from participants
            // so the display shows the other person's name (not your own)
            const processed = data.map(conv => {
                if (conv.channel_type !== 'channel' && conv.participants) {
                    const others = conv.participants.filter(
                        (p: any) => p.user?.id !== user.id
                    );
                    return { ...conv, participants: others.length > 0 ? others : conv.participants };
                }
                return conv;
            });
            setConversations(processed);
        }
    };

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
            }
        } catch (error) {
            console.error("Error loading messages:", error);
            setMessages([]); // Clear messages on error
        }
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !attachedFile) || !activeConversation) return;

        const messageContent = newMessage;
        setNewMessage('');
        setAttachedFile(null);

        const newMsg: Message = {
            id: `temp-${Date.now()}`,
            content: messageContent,
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
                    // For SMS conversations, send the message as an SMS too
                    if (activeConversation.channel_type === 'sms' && (activeConversation as any).customer_phone) {
                        const smsRes = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                to: (activeConversation as any).customer_phone,
                                message: messageContent,
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
                            content: messageContent,
                            message_type: activeConversation.channel_type === 'sms' ? 'sms' : 'text',
                        }),
                    });
                    if (!msgRes.ok) {
                        console.error('Message send failed:', msgRes.status);
                        toast.error('Failed to save message.');
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
                        const aiMsg: Message = {
                            id: `ai-${Date.now()}`,
                            content: "I need you to be signed in to use AI features. Please refresh the page and try again.",
                            sender_id: 'sparky-ai',
                            created_at: new Date().toISOString(),
                            sender: { full_name: 'Sparky AI' },
                            reactions: [],
                        };
                        setMessages(prev => [...prev, aiMsg]);
                        setIsTyping(false);
                        return;
                    }

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
                                page: 'Team Chat',
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
                    const aiMsg: Message = {
                        id: `ai-${Date.now()}`,
                        content: "Sorry, I encountered an error. Please try again.",
                        sender_id: 'sparky-ai',
                        created_at: new Date().toISOString(),
                        sender: { full_name: 'Sparky AI' },
                        reactions: [],
                    };
                    setMessages(prev => [...prev, aiMsg]);
                } finally {
                    setIsTyping(false);
                }
            })();
        }
    };

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

    const handleAddReaction = useCallback((messageId: string, emoji: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                const newReaction = {
                    id: `reaction-${Date.now()}`,
                    message_id: messageId,
                    user_id: user?.id || 'user-me',
                    emoji,
                    created_at: new Date().toISOString(),
                };
                return {
                    ...msg,
                    reactions: [...(msg.reactions || []), newReaction],
                };
            }
            return msg;
        }));
    }, [user?.id]);

    const handleRemoveReaction = useCallback((messageId: string, reactionId: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === messageId) {
                return {
                    ...msg,
                    reactions: (msg.reactions || []).filter(r => r.id !== reactionId),
                };
            }
            return msg;
        }));
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
            setActiveConversation(existing);
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
            // Step 1: Create conversation via direct POST (Prefer: return=representation uses RETURNING, bypasses SELECT RLS)
            const convRes = await fetch(`${supabaseUrl}/rest/v1/conversations`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseAnonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify({
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

            const convData = await convRes.json();
            const conv = Array.isArray(convData) ? convData[0] : convData;

            if (!conv?.id) throw new Error('No conversation returned');

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
                    { conversation_id: conv.id, user_id: user.id, role: 'member' },
                    { conversation_id: conv.id, user_id: member.id, role: 'member' },
                ]),
            });

            if (!partRes.ok) {
                console.error('Failed to add participants:', partRes.status);
                throw new Error('Failed to add participants');
            }

            const newConv = {
                ...conv,
                participants: [{ user: { id: member.id, full_name: member.full_name } }],
            };

            setConversations(prev => [newConv, ...prev]);
            setActiveConversation(newConv);
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

    const handleSaveSettings = (settings: ChatSettings) => {
        setChatSettings(settings);
        localStorage.setItem('cxtrack_chat_settings', JSON.stringify(settings));
    };

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
                    <div className="p-4">
                        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl px-4 py-3 flex items-center">
                            <Search size={18} className="text-gray-400 mr-2" />
                            <input
                                className="bg-transparent w-full outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto px-2">
                        {(() => {
                            const filteredConversations = conversations.filter(conv => {
                                if (!searchQuery.trim()) return true;
                                const query = searchQuery.toLowerCase();
                                const name = (conv.name || conv.participants?.[0]?.user?.full_name || '').toLowerCase();
                                return name.includes(query);
                            });

                            const channels = filteredConversations.filter(c => c.channel_type === 'channel');
                            const groups = filteredConversations.filter(c => c.channel_type === 'group');
                            const smsConversations = filteredConversations.filter(c => c.channel_type === 'sms');
                            const directMessages = filteredConversations.filter(c => !c.channel_type || c.channel_type === 'direct');

                            return (
                                <>
                                    {/* Channels Section */}
                                    {/* AI Assistant Section */}
                                    <div className="mb-6">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 block flex items-center gap-2">
                                            <Sparkles size={12} className="text-blue-500" /> AI Assistant
                                        </span>
                                        <button
                                            onClick={() => {
                                                const aiConv: any = {
                                                    id: 'ai-agent',
                                                    name: 'Sparky AI',
                                                    channel_type: 'direct',
                                                    participants: [{ user: { full_name: 'Sparky AI' } }]
                                                };
                                                setActiveConversation(aiConv);
                                                setMessages([
                                                    {
                                                        id: 'ai-welcome',
                                                        content: "Hello! I'm Sparky, your AI business assistant. How can I help you today?",
                                                        sender_id: 'sparky-ai',
                                                        created_at: new Date().toISOString(),
                                                        sender: { full_name: 'Sparky AI' },
                                                        reactions: []
                                                    }
                                                ]);
                                            }}
                                            className={`
                          w-full p-3 rounded-2xl mb-1
                          flex items-center gap-3
                          transition-all duration-200
                          ${activeConversation?.id === 'ai-agent' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-none' : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100 dark:border-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800'}
                        `}
                                        >
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 animate-pulse ${activeConversation?.id === 'ai-agent' ? 'bg-white/20' : 'bg-gradient-to-br from-blue-600 to-purple-600'}`}>
                                                <Sparkles size={24} />
                                            </div>
                                            <div className="flex-1 text-left overflow-hidden">
                                                <p className={`font-bold truncate ${activeConversation?.id === 'ai-agent' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>Sparky AI</p>
                                                <p className={`text-[10px] truncate ${activeConversation?.id === 'ai-agent' ? 'text-blue-100' : 'text-blue-600 dark:text-blue-400 font-medium'}`}>Online • AI Assistant</p>
                                            </div>
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
                                                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} onClick={() => setActiveConversation(conv)} />
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
                                                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} onClick={() => setActiveConversation(conv)} />
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
                                            <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} onClick={() => setActiveConversation(conv)} />
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
                                                <ConversationItem key={conv.id} conv={conv} isActive={activeConversation?.id === conv.id} onClick={() => setActiveConversation(conv)} />
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
                                        onClick={() => setActiveConversation(null)}
                                        className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                                    >
                                        <ArrowLeft size={20} />
                                    </button>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${activeConversation.channel_type === 'sms' ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}>
                                        {activeConversation.channel_type === 'sms'
                                            ? <Phone size={18} />
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
                                            ) : (
                                                <>
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    <span className="text-xs text-gray-500">Online</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                            </div>

                            {/* Messages Area */}
                            <div className={`flex-1 overflow-y-auto p-6 ${chatSettings.compact_mode ? 'space-y-2' : 'space-y-4'}`}>
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
                                    />
                                ))}
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
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Attached File Preview */}
                            {attachedFile && (
                                <div className="px-4 py-2 border-t border-gray-200/50 dark:border-gray-700/50">
                                    <FilePreview file={attachedFile} onRemove={() => setAttachedFile(null)} />
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-2">
                                    {/* Emoji Button */}
                                    <div className="relative">
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

                                    {/* File Attachment */}
                                    <FileAttachmentButton
                                        onFileSelect={setAttachedFile}
                                        disabled={!!attachedFile}
                                    />

                                    {/* Input */}
                                    <input
                                        ref={inputRef}
                                        className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                        placeholder="Type your message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />

                                    {/* Send Button */}
                                    <button
                                        onClick={sendMessage}
                                        disabled={!newMessage.trim() && !attachedFile}
                                        className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-full transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
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
                            setActiveConversation(conv);
                            setShowCreateGroupModal(false);
                        }}
                    />
                )}
            </div>

            {/* Settings Modal */}
            <ChatSettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                settings={chatSettings}
                onSave={handleSaveSettings}
            />
        </div>
    );
};
