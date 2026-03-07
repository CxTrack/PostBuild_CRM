/**
 * MyTicketsTab
 * User-facing ticket list with conversation thread and reply capability.
 * Embedded in HelpCenterTab for users to view and follow-up on submitted tickets.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    MessageSquare, Clock, ChevronDown, ChevronUp, Send,
    Loader2, AlertCircle, CheckCircle, Circle, Sparkles,
    Paperclip, RefreshCw
} from 'lucide-react';
import { useTicketStore, type Ticket, type TicketMessage } from '@/stores/ticketStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import TicketAttachmentViewer from '@/components/tickets/TicketAttachmentViewer';
import TicketAttachmentUploader from '@/components/tickets/TicketAttachmentUploader';
import type { AttachmentMeta } from '@/utils/ticketAttachments';

const timeAgo = (dateStr: string) => {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    open: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Circle, label: 'Open' },
    in_progress: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: Clock, label: 'In Progress' },
    resolved: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle, label: 'Resolved' },
    closed: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: AlertCircle, label: 'Closed' },
};

const priorityColor: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    normal: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export const MyTicketsTab: React.FC = () => {
    const { tickets, loading, fetchTickets, fetchMessages, messages, userReplyToTicket } = useTicketStore();
    const organizationId = useOrganizationStore((s) => s.currentOrganization?.id);
    const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [replyAttachments, setReplyAttachments] = useState<AttachmentMeta[]>([]);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        if (expandedTicketId) {
            fetchMessages(expandedTicketId);
        }
    }, [expandedTicketId, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, expandedTicketId]);

    const handleToggleTicket = (ticketId: string) => {
        setExpandedTicketId(prev => prev === ticketId ? null : ticketId);
        setReplyText('');
        setReplyAttachments([]);
    };

    const handleSendReply = async (ticketId: string) => {
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await userReplyToTicket(ticketId, replyText.trim(), replyAttachments);
            setReplyText('');
            setReplyAttachments([]);
        } catch {
            // Error handled by store
        } finally {
            setSending(false);
        }
    };

    if (loading && tickets.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No tickets yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Submit a ticket or ask Sparky AI for help
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    My Tickets ({tickets.length})
                </h3>
                <button
                    onClick={() => fetchTickets()}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {tickets.map((ticket) => {
                const isExpanded = expandedTicketId === ticket.id;
                const ticketMessages = messages[ticket.id] || [];
                const status = statusConfig[ticket.status] || statusConfig.open;
                const StatusIcon = status.icon;

                return (
                    <div
                        key={ticket.id}
                        className="bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden transition-all"
                    >
                        {/* Ticket Header */}
                        <button
                            onClick={() => handleToggleTicket(ticket.id)}
                            className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                        >
                            <StatusIcon className={`w-4 h-4 flex-shrink-0 ${
                                ticket.status === 'open' ? 'text-blue-500' :
                                ticket.status === 'in_progress' ? 'text-purple-500' :
                                ticket.status === 'resolved' ? 'text-green-500' : 'text-gray-400'
                            }`} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                        {ticket.subject}
                                    </p>
                                    {ticket.submission_method === 'sparky_ai' && (
                                        <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
                                        {status.label}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${priorityColor[ticket.priority] || priorityColor.normal}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                        {timeAgo(ticket.created_at)}
                                    </span>
                                </div>
                            </div>
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                        </button>

                        {/* Expanded Content */}
                        {isExpanded && (
                            <div className="border-t border-gray-200 dark:border-gray-700">
                                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                                    {/* Original Description */}
                                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">You</span>
                                            <span className="text-[10px] text-gray-400">{timeAgo(ticket.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                            {ticket.description}
                                        </p>
                                    </div>

                                    {/* Messages Thread */}
                                    {ticketMessages.map((msg) => {
                                        if (msg.is_internal) return null; // Users don't see internal notes
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`rounded-lg p-3 ${
                                                    msg.user_id === ticket.user_id
                                                        ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800'
                                                        : 'bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-semibold ${
                                                        msg.user_id === ticket.user_id
                                                            ? 'text-blue-700 dark:text-blue-300'
                                                            : 'text-purple-700 dark:text-purple-300'
                                                    }`}>
                                                        {msg.user_id === ticket.user_id ? 'You' : (msg.user_name || 'Support')}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{timeAgo(msg.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                    {msg.message}
                                                </p>
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-2">
                                                        <TicketAttachmentViewer attachments={msg.attachments} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Composer (only if ticket not closed) */}
                                {ticket.status !== 'closed' && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                                        {organizationId && (
                                            <div className="mb-2">
                                                <TicketAttachmentUploader
                                                    organizationId={organizationId}
                                                    ticketOrDraftId={ticket.id}
                                                    attachments={replyAttachments}
                                                    onAttachmentsChange={setReplyAttachments}
                                                    maxFiles={5}
                                                    compact
                                                />
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Type your reply..."
                                                className="flex-1 px-3 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-purple-400 focus:outline-none"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendReply(ticket.id);
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => handleSendReply(ticket.id)}
                                                disabled={sending || !replyText.trim()}
                                                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                {sending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Closed notice */}
                                {ticket.status === 'closed' && (
                                    <div className="border-t border-gray-200 dark:border-gray-700 p-3 text-center">
                                        <p className="text-xs text-gray-400">This ticket is closed</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default MyTicketsTab;
