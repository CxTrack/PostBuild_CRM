import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useCopilotChatStore } from '@/stores/copilotChatStore';
import type { CopilotConversation } from '@/utils/copilotMessageMapper';
import {
  Plus,
  Archive,
  ArchiveRestore,
  Search,
  Sparkles,
  User,
  MessageSquare,
  MoreVertical,
  Zap,
  Target,
  Palette,
  Pencil,
} from 'lucide-react';

export interface ConversationListProps {
  /** Compact mode for sidebar panel; full mode for full-page */
  compact?: boolean;
  /** Currently active conversation ID */
  activeConversationId?: string | null;
  /** Callback when a conversation is selected */
  onSelectConversation: (conversationId: string) => void;
  /** Callback when "New Chat" is clicked */
  onNewChat: () => void;
}

/** Icon for context type */
const ContextIcon: React.FC<{ type: string; className?: string }> = ({ type, className = 'w-3.5 h-3.5' }) => {
  switch (type) {
    case 'quarterback':
      return <Zap className={className} />;
    case 'customer':
      return <User className={className} />;
    case 'personalization':
      return <Palette className={className} />;
    default:
      return <MessageSquare className={className} />;
  }
};

/** Relative time string (e.g., "2h ago", "3d ago") */
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const ConversationList: React.FC<ConversationListProps> = ({
  compact = false,
  activeConversationId,
  onSelectConversation,
  onNewChat,
}) => {
  const {
    conversations,
    isLoadingConversations,
    loadConversations,
    archiveConversation,
    unarchiveConversation,
    updateConversationTitle,
  } = useCopilotChatStore();

  const [filter, setFilter] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load conversations on mount and filter change
  useEffect(() => {
    loadConversations(filter);
  }, [filter, loadConversations]);

  const handleArchive = useCallback(async (id: string) => {
    await archiveConversation(id);
    setMenuOpenId(null);
  }, [archiveConversation]);

  const handleUnarchive = useCallback(async (id: string) => {
    await unarchiveConversation(id);
    setMenuOpenId(null);
  }, [unarchiveConversation]);

  const handleStartRename = useCallback((id: string) => {
    setMenuOpenId(null);
    setEditingId(id);
  }, []);

  const handleRename = useCallback(async (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (trimmed) {
      await updateConversationTitle(id, trimmed);
    }
    setEditingId(null);
  }, [updateConversationTitle]);

  // Filter conversations by search query (client-side)
  const filtered = searchQuery.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`${compact ? 'p-3' : 'p-4'} border-b border-gray-200 dark:border-gray-700`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-gray-900 dark:text-white`}>
            Conversations
          </h3>
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chat
          </button>
        </div>

        {/* Search */}
        {!compact && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
            />
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'active'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
              filter === 'archived'
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter === 'archived' ? 'No archived conversations' : 'No conversations yet'}
            </p>
            {filter === 'active' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Start a new chat to get going
              </p>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              compact={compact}
              filter={filter}
              menuOpen={menuOpenId === conv.id}
              isEditing={editingId === conv.id}
              onSelect={() => onSelectConversation(conv.id)}
              onToggleMenu={() => setMenuOpenId(menuOpenId === conv.id ? null : conv.id)}
              onArchive={() => handleArchive(conv.id)}
              onUnarchive={() => handleUnarchive(conv.id)}
              onStartRename={() => handleStartRename(conv.id)}
              onRename={(newTitle) => handleRename(conv.id, newTitle)}
              onCancelRename={() => setEditingId(null)}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: CopilotConversation;
  isActive: boolean;
  compact: boolean;
  filter: 'active' | 'archived';
  menuOpen: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onStartRename: () => void;
  onRename: (newTitle: string) => void;
  onCancelRename: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  compact,
  filter,
  menuOpen,
  isEditing,
  onSelect,
  onToggleMenu,
  onArchive,
  onUnarchive,
  onStartRename,
  onRename,
  onCancelRename,
}) => {
  const [editTitle, setEditTitle] = useState(conversation.title);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditTitle(conversation.title);
      setTimeout(() => editInputRef.current?.select(), 50);
    }
  }, [isEditing, conversation.title]);

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onRename(editTitle);
    } else if (e.key === 'Escape') {
      onCancelRename();
    }
  };

  return (
    <div
      className={`
        group relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700/50
        ${isActive
          ? 'bg-purple-50 dark:bg-purple-900/20 border-l-2 border-l-purple-500'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-2 border-l-transparent'
        }
      `}
      onClick={isEditing ? undefined : onSelect}
    >
      {/* Context icon */}
      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
        isActive
          ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      }`}>
        <ContextIcon type={conversation.context_type} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleEditKeyDown}
            onBlur={() => onRename(editTitle)}
            className="w-full text-sm font-medium px-1.5 py-0.5 rounded border bg-white dark:bg-gray-700 border-purple-400 dark:border-purple-500 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p className={`text-sm font-medium truncate ${
            isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'
          }`}>
            {conversation.title}
          </p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {relativeTime(conversation.updated_at)}
          </span>
          {conversation.customer_name && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <User className="w-2.5 h-2.5" />
              {conversation.customer_name}
            </span>
          )}
        </div>
      </div>

      {/* Three-dot menu */}
      {!isEditing && (
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu(); }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>

          {menuOpen && (
            <>
              {/* Click-away backdrop */}
              <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); onToggleMenu(); }} />
              <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg shadow-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 py-1">
                {/* Rename */}
                <button
                  onClick={(e) => { e.stopPropagation(); onStartRename(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Rename
                </button>
                {filter === 'active' ? (
                  <button
                    onClick={(e) => { e.stopPropagation(); onArchive(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUnarchive(); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    Unarchive
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
