import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Clock, ExternalLink, Plus, ChevronDown, ChevronUp, Zap, User } from 'lucide-react';
import { getAuthToken } from '@/utils/auth.utils';
import { useImpersonationStore } from '@/stores/impersonationStore';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useCoPilot } from '@/contexts/CoPilotContext';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

interface ConversationSummary {
  id: string;
  title: string;
  context_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface CustomerCoPilotHistoryProps {
  customerId: string;
  customerName: string;
}

const CustomerCoPilotHistory: React.FC<CustomerCoPilotHistoryProps> = ({ customerId, customerName }) => {
  const navigate = useNavigate();
  const { openPanel, setConversationCustomerId } = useCoPilot();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const { getEffectiveUserId, getEffectiveOrgId } = useImpersonationStore();
  const { user } = useAuthStore();
  const { organization } = useOrganizationStore();

  const effectiveUserId = getEffectiveUserId(user?.id || '');
  const effectiveOrgId = getEffectiveOrgId(organization?.id || '');

  const fetchConversations = useCallback(async () => {
    if (!effectiveUserId || !effectiveOrgId) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      // Fetch conversations linked to this customer
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/copilot_conversations?customer_id=eq.${customerId}&user_id=eq.${effectiveUserId}&organization_id=eq.${effectiveOrgId}&status=eq.active&order=updated_at.desc&limit=10&select=id,title,context_type,status,created_at,updated_at`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': token,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        setConversations([]);
        return;
      }

      const convs = await res.json();

      // For each conversation, get the message count
      const enriched: ConversationSummary[] = await Promise.all(
        convs.map(async (conv: any) => {
          try {
            const countRes = await fetch(
              `${SUPABASE_URL}/rest/v1/copilot_messages?conversation_id=eq.${conv.id}&select=id`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'apikey': token,
                  'Content-Type': 'application/json',
                  'Prefer': 'count=exact',
                  'Range': '0-0',
                },
              }
            );
            const countHeader = countRes.headers.get('content-range');
            const total = countHeader ? parseInt(countHeader.split('/')[1] || '0') : 0;

            return {
              ...conv,
              message_count: total,
            };
          } catch {
            return { ...conv, message_count: 0 };
          }
        })
      );

      setConversations(enriched);
    } catch (err) {
      console.error('Failed to fetch customer CoPilot history:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, effectiveUserId, effectiveOrgId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleOpenConversation = (conversationId: string) => {
    navigate(`/dashboard/copilot?conversation=${conversationId}`);
  };

  const handleStartNewChat = () => {
    setConversationCustomerId(customerId);
    openPanel();
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getContextIcon = (type: string) => {
    switch (type) {
      case 'quarterback': return <Zap size={12} className="text-amber-500" />;
      case 'customer': return <User size={12} className="text-blue-500" />;
      default: return <MessageSquare size={12} className="text-purple-500" />;
    }
  };

  // Don't render anything if loading or no conversations and we want a minimal footprint
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">CoPilot Conversations</h3>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">CoPilot Conversations</h3>
          {conversations.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">({conversations.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartNewChat}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
          >
            <Plus size={12} />
            Start Chat
          </button>
          {conversations.length > 3 && (
            <button
              onClick={() => setExpanded(prev => !prev)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
          No CoPilot conversations linked to {customerName}. Start a chat to get AI-powered insights about this customer.
        </p>
      ) : (
        <div className="space-y-1.5">
          {(expanded ? conversations : conversations.slice(0, 3)).map(conv => (
            <button
              key={conv.id}
              onClick={() => handleOpenConversation(conv.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex-shrink-0 mt-0.5">
                {getContextIcon(conv.context_type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate font-medium">
                  {conv.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-0.5">
                    <Clock size={10} />
                    {formatRelativeTime(conv.updated_at)}
                  </span>
                  <span>{conv.message_count} messages</span>
                </div>
              </div>
              <ExternalLink size={14} className="flex-shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}

          {conversations.length > 3 && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 py-1"
            >
              Show {conversations.length - 3} more
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerCoPilotHistory;
