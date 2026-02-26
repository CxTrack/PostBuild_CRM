import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mail,
  Inbox,
  Star,
  Send,
  Search,
  RefreshCw,
  Settings,
  ChevronLeft,
  Reply,
  MailOpen,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  User,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmailStore, type EmailThread, type EmailFilter } from '@/stores/emailStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useThemeStore } from '@/stores/themeStore';
import toast from 'react-hot-toast';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';
import DOMPurify from 'dompurify';

// ── Helpers ──────────────────────────────────────────────────
function formatEmailDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  if (isThisYear(d)) return format(d, 'MMM d');
  return format(d, 'MMM d, yyyy');
}

function formatFullDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

function getInitial(email: string | null): string {
  if (!email) return '?';
  return email.charAt(0).toUpperCase();
}

function sanitizeHtml(html: string): string {
  // Strip cid: inline image references (MIME-embedded images that can't be
  // resolved in the browser). Replace with a transparent 1x1 gif so layout
  // isn't broken, and hide them visually via style.
  const cleaned = html.replace(
    /(<img\b[^>]*)\bsrc\s*=\s*["']cid:[^"']*["']/gi,
    '$1src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" style="display:none"'
  );

  return DOMPurify.sanitize(cleaned, {
    ALLOWED_TAGS: [
      'p', 'br', 'div', 'span', 'b', 'i', 'u', 'strong', 'em',
      'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table',
      'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
      'colgroup', 'col', 'img', 'sub', 'sup',
      // Email-specific tags used by marketing email builders
      'center', 'font', 'small', 's', 'strike', 'del', 'address',
      'figure', 'figcaption', 'abbr', 'section', 'article', 'header', 'footer',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'style', 'class', 'width', 'height',
      // Table layout attributes critical for email rendering
      'align', 'valign', 'bgcolor', 'background', 'border',
      'cellpadding', 'cellspacing', 'colspan', 'rowspan',
      // Font/text attributes used by legacy email HTML
      'color', 'face', 'size', 'dir', 'title', 'role',
    ],
  });
}

// ── Filter tabs ──────────────────────────────────────────────
const FILTER_TABS: { key: EmailFilter; label: string; icon: any }[] = [
  { key: 'all', label: 'All', icon: Inbox },
  { key: 'unread', label: 'Unread', icon: Mail },
  { key: 'starred', label: 'Starred', icon: Star },
  { key: 'sent', label: 'Sent', icon: Send },
];

// ── Main Component ───────────────────────────────────────────
export default function EmailPage() {
  const { theme } = useThemeStore();
  const { user } = useAuthContext();
  const { currentOrganization } = useOrganizationStore();
  const navigate = useNavigate();

  const {
    threads,
    selectedThreadId,
    filter,
    searchQuery,
    loading,
    syncing,
    unreadCount,
    connectionStatus,
    fetchThreads,
    markAsRead,
    toggleStar,
    syncNow,
    checkConnection,
    setFilter,
    setSelectedThread,
    setSearchQuery,
    sendReply,
  } = useEmailStore();

  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const orgId = currentOrganization?.id;
  const userId = user?.id;

  // Initial load
  useEffect(() => {
    if (orgId && userId) {
      fetchThreads(orgId, userId);
      checkConnection(orgId, userId);
    }
  }, [orgId, userId]);

  // Filter threads
  const filteredThreads = useMemo(() => {
    let result = threads;

    if (filter === 'unread') result = result.filter(t => t.unreadCount > 0);
    else if (filter === 'starred') result = result.filter(t => t.starred);
    else if (filter === 'sent') result = result.filter(t => t.latestDirection === 'outbound');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.snippet.toLowerCase().includes(q) ||
        t.participants.some(p => p.toLowerCase().includes(q)) ||
        (t.customerName && t.customerName.toLowerCase().includes(q))
      );
    }

    return result;
  }, [threads, filter, searchQuery]);

  const selectedThread = threads.find(t => t.id === selectedThreadId) || null;

  // Mark as read when selecting thread
  useEffect(() => {
    if (selectedThread) {
      const unreadIds = selectedThread.messages.filter(m => !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) markAsRead(unreadIds);
    }
  }, [selectedThreadId]);

  const handleThreadClick = (thread: EmailThread) => {
    setSelectedThread(thread.id);
    setMobileShowDetail(true);
  };

  const handleSync = async () => {
    if (!orgId || syncing) return;
    const result = await syncNow(orgId);
    if (result.synced > 0) {
      toast.success(`Synced ${result.synced} new email${result.synced > 1 ? 's' : ''}`);
      if (userId) fetchThreads(orgId, userId);
    } else {
      toast('Inbox is up to date', { icon: '📬' });
    }
  };

  const isDark = theme === 'dark' || theme === 'midnight';
  const isMidnight = theme === 'midnight';

  const containerBg = isMidnight ? 'bg-black' : 'bg-gray-50 dark:bg-gray-900';
  const panelBg = isMidnight ? 'bg-gray-900/50 border-gray-700/50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  const hoverBg = isMidnight ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
  const activeBg = isMidnight ? 'bg-gray-800/80' : 'bg-blue-50 dark:bg-gray-700/70';

  // Not connected state
  if (connectionStatus === 'disconnected' && !loading) {
    return (
      <div className={`min-h-full flex flex-col items-center justify-center p-6 ${containerBg}`}>
        <div className={`${panelBg} border rounded-xl p-8 max-w-md text-center`}>
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Connect Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your Outlook or Gmail account to see your inbox here, auto-link emails to customers, and reply directly from the CRM.
          </p>
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Settings size={16} />
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${containerBg}`}>
      {/* Two-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Thread list */}
        <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col border-r ${panelBg} ${mobileShowDetail ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Inbox</h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Connection status */}
                <div className="flex items-center gap-1 mr-2" title={connectionStatus === 'connected' ? 'Email connected' : 'Checking connection...'}>
                  {connectionStatus === 'connected' ? (
                    <Wifi size={14} className="text-green-500" />
                  ) : (
                    <WifiOff size={14} className="text-gray-400" />
                  )}
                </div>
                {/* Sync button */}
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Sync now"
                >
                  <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                  isMidnight
                    ? 'bg-gray-800/60 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/30`}
              />
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MailOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filter !== 'all' ? `No ${filter} emails` : searchQuery ? 'No emails match your search' : 'No emails yet'}
                </p>
                {filter === 'all' && !searchQuery && (
                  <button onClick={handleSync} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    Sync your inbox
                  </button>
                )}
              </div>
            ) : (
              filteredThreads.map(thread => (
                <button
                  key={thread.id}
                  onClick={() => handleThreadClick(thread)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 transition-colors ${
                    selectedThreadId === thread.id ? activeBg : hoverBg
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium ${
                      thread.customerId
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {thread.customerName ? getInitial(thread.customerName) : getInitial(thread.participants[0])}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-sm truncate ${
                          thread.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'font-normal text-gray-700 dark:text-gray-300'
                        }`}>
                          {thread.customerName || thread.participants.find(p => p !== user?.email) || thread.participants[0] || 'Unknown'}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {formatEmailDate(thread.lastMessageAt)}
                        </span>
                      </div>

                      <div className={`text-sm truncate mt-0.5 ${
                        thread.unreadCount > 0 ? 'font-medium text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {thread.subject}
                      </div>

                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {thread.snippet}
                      </div>

                      {/* Indicators */}
                      <div className="flex items-center gap-2 mt-1">
                        {thread.unreadCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                        {thread.starred && (
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        )}
                        {thread.messageCount > 1 && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {thread.messageCount} messages
                          </span>
                        )}
                        {thread.customerId && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            CRM
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel - Thread detail */}
        <div className={`flex-1 flex flex-col ${mobileShowDetail ? 'flex' : 'hidden md:flex'}`}>
          {selectedThread ? (
            <ThreadDetail
              thread={selectedThread}
              onBack={() => { setMobileShowDetail(false); setSelectedThread(null); }}
              onToggleStar={(emailId, starred) => toggleStar(emailId, starred)}
              onSendReply={sendReply}
              onRefresh={() => orgId && userId && fetchThreads(orgId, userId)}
              isDark={isDark}
              isMidnight={isMidnight}
              panelBg={panelBg}
              currentUserEmail={user?.email || ''}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                isMidnight ? 'bg-gray-800/50' : 'bg-gray-100 dark:bg-gray-800'
              }`}>
                <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Choose an email thread from the left to view the full conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Thread Detail ────────────────────────────────────────────
function ThreadDetail({
  thread,
  onBack,
  onToggleStar,
  onSendReply,
  onRefresh,
  isDark,
  isMidnight,
  panelBg,
  currentUserEmail,
}: {
  thread: EmailThread;
  onBack: () => void;
  onToggleStar: (emailId: string, starred: boolean) => void;
  onSendReply: (params: any) => Promise<boolean>;
  onRefresh: () => void;
  isDark: boolean;
  isMidnight: boolean;
  panelBg: string;
  currentUserEmail: string;
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread.id, thread.messages.length]);

  const handleSendReply = async () => {
    if (!replyText.trim() || sending) return;

    const lastInbound = [...thread.messages].reverse().find(m => m.direction === 'inbound');
    const replyTo = lastInbound?.sender_email || thread.participants.find(p => p !== currentUserEmail) || '';

    if (!replyTo) {
      toast.error('No recipient found');
      return;
    }

    setSending(true);
    const success = await onSendReply({
      to: replyTo,
      subject: thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`,
      body: replyText,
      conversationId: thread.messages[0]?.conversation_id || undefined,
      inReplyTo: thread.messages[thread.messages.length - 1]?.message_id || undefined,
      customerId: thread.customerId || undefined,
    });

    if (success) {
      setReplyText('');
      toast.success('Reply sent');
      // Refresh after a short delay so the server can process
      setTimeout(onRefresh, 2000);
    } else {
      toast.error('Failed to send reply');
    }
    setSending(false);
  };

  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Thread header */}
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3`}>
        <button
          onClick={onBack}
          className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {thread.subject}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
            </span>
            {thread.customerId && (
              <button
                onClick={() => navigate(`/dashboard/customers/${thread.customerId}`)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <User size={11} />
                {thread.customerName || 'View Customer'}
                <ArrowUpRight size={10} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            const starredMsg = thread.messages.find(m => m.starred) || thread.messages[0];
            if (starredMsg) onToggleStar(starredMsg.id, starredMsg.starred);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title={thread.starred ? 'Unstar' : 'Star'}
        >
          <Star size={16} className={thread.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {thread.messages.map((msg) => {
          const isOutbound = msg.direction === 'outbound';
          const hasHtml = !!msg.body_html;

          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] lg:max-w-[70%] rounded-xl px-4 py-3 ${
                isOutbound
                  ? (isMidnight ? 'bg-blue-600/20 border border-blue-500/30' : 'bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50')
                  : (isMidnight ? 'bg-gray-800/60 border border-gray-700/50' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700')
              }`}>
                {/* Sender + time */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs font-medium ${
                    isOutbound ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {isOutbound ? 'You' : (msg.sender_email || 'Unknown')}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {formatFullDate(msg.sent_at || msg.created_at)}
                  </span>
                </div>

                {/* Body */}
                {hasHtml ? (
                  <div
                    className={`email-body text-sm leading-relaxed break-words ${
                      isOutbound ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
                    }`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.body_html!) }}
                  />
                ) : (
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isOutbound ? 'text-gray-800 dark:text-gray-200' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {msg.body_text || ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose reply bar */}
      <div className={`px-4 py-3 border-t border-gray-200 dark:border-gray-700`}>
        <div className={`flex items-end gap-2 rounded-xl border ${
          isMidnight ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        } p-2`}>
          <Reply size={16} className="text-gray-400 mb-2 ml-1 flex-shrink-0" />
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            placeholder="Write a reply..."
            rows={2}
            className={`flex-1 resize-none bg-transparent text-sm focus:outline-none ${
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            }`}
          />
          <button
            onClick={handleSendReply}
            disabled={!replyText.trim() || sending}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              replyText.trim() && !sending
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
            title="Send reply (Ctrl+Enter)"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 ml-1">
          Press Ctrl+Enter to send
        </p>
      </div>
    </div>
  );
}
