/**
 * Chat Unread Count Hook
 * Fetches total unread message count across all conversations for the current user.
 * Uses direct fetch() to avoid Supabase AbortController issue.
 * Subscribes to real-time inserts on the messages table for live updates.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthContext } from '@/contexts/AuthContext';
import { getAuthToken } from '@/utils/auth.utils';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

export function useChatUnreadCount() {
  const [totalUnread, setTotalUnread] = useState(0);
  const { user } = useAuthContext();
  const { currentOrganization } = useOrganizationStore();
  const mountedRef = useRef(true);

  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.id || !currentOrganization?.id) return;

    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_unread_message_counts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          p_user_id: user.id,
          p_organization_id: currentOrganization.id,
        }),
      });

      if (!res.ok) return;

      const data: { conversation_id: string; unread_count: number }[] = await res.json();
      if (!mountedRef.current) return;

      const total = data.reduce((sum, row) => sum + (row.unread_count || 0), 0);
      setTotalUnread(total);
    } catch {
      // Silently fail -- unread badge is non-critical
    }
  }, [user?.id, currentOrganization?.id]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchUnreadCounts();
    return () => { mountedRef.current = false; };
  }, [fetchUnreadCounts]);

  // Real-time: listen for new messages to bump count
  useEffect(() => {
    if (!currentOrganization?.id) return;

    const channel = supabase
      .channel('chat-unread-listener')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          // Only bump if the message isn't from the current user
          if (payload.new && payload.new.sender_id !== user?.id) {
            fetchUnreadCounts();
            // Dispatch event so ChatPage can play sound/show notifications
            window.dispatchEvent(new CustomEvent('chat-new-message', { detail: payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrganization?.id, user?.id, fetchUnreadCounts]);

  // Listen for mark-read events from ChatPage to refresh sidebar badge
  useEffect(() => {
    const handler = () => { fetchUnreadCounts(); };
    window.addEventListener('chat-mark-read', handler);
    return () => window.removeEventListener('chat-mark-read', handler);
  }, [fetchUnreadCounts]);

  // Expose a refresh function so ChatPage can call it after marking read
  return { totalUnread, refreshUnreadCount: fetchUnreadCounts };
}
