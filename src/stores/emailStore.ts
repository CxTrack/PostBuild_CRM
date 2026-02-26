import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

// Helper to get auth token from localStorage (AbortController workaround)
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* ignore */ }
    }
  }
  return null;
};

// Direct fetch helpers
async function supabaseGet<T = any>(table: string, query: string): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error(`GET ${table} failed: ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table: string, query: string, body: Record<string, any>): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`PATCH ${table} failed: ${await res.text()}`);
}

// Types
export interface EmailMessage {
  id: string;
  organization_id: string;
  customer_id: string | null;
  user_id: string;
  direction: 'inbound' | 'outbound';
  sender_email: string | null;
  recipient_email: string;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  status: string;
  provider: string;
  message_id: string | null;
  conversation_id: string | null;
  in_reply_to: string | null;
  template_key: string | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
  is_read: boolean;
  starred: boolean;
  folder: string;
  snippet: string | null;
  // Joined fields
  customer_name?: string;
}

export interface EmailThread {
  id: string; // conversation_id or email id for standalone
  subject: string;
  snippet: string;
  participants: string[];
  lastMessageAt: string;
  messageCount: number;
  unreadCount: number;
  starred: boolean;
  customerId: string | null;
  customerName: string | null;
  messages: EmailMessage[];
  latestDirection: 'inbound' | 'outbound';
}

export type EmailFilter = 'all' | 'unread' | 'starred' | 'sent';

interface EmailStore {
  threads: EmailThread[];
  selectedThreadId: string | null;
  filter: EmailFilter;
  searchQuery: string;
  loading: boolean;
  syncing: boolean;
  unreadCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';

  fetchThreads: (orgId: string, userId: string) => Promise<void>;
  markAsRead: (emailIds: string[]) => Promise<void>;
  toggleStar: (emailId: string, currentStarred: boolean) => Promise<void>;
  syncNow: (orgId: string) => Promise<{ synced: number }>;
  checkConnection: (orgId: string, userId: string) => Promise<void>;
  setFilter: (filter: EmailFilter) => void;
  setSelectedThread: (threadId: string | null) => void;
  setSearchQuery: (query: string) => void;
  sendReply: (params: {
    to: string;
    subject: string;
    body: string;
    conversationId?: string;
    inReplyTo?: string;
    customerId?: string;
  }) => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  threads: [] as EmailThread[],
  selectedThreadId: null as string | null,
  filter: 'all' as EmailFilter,
  searchQuery: '',
  loading: false,
  syncing: false,
  unreadCount: 0,
  connectionStatus: 'unknown' as const,
};

function groupIntoThreads(emails: EmailMessage[]): EmailThread[] {
  const threadMap = new Map<string, EmailMessage[]>();

  for (const email of emails) {
    const key = email.conversation_id || email.id;
    const existing = threadMap.get(key);
    if (existing) {
      existing.push(email);
    } else {
      threadMap.set(key, [email]);
    }
  }

  const threads: EmailThread[] = [];

  for (const [id, messages] of threadMap) {
    // Sort messages within thread by date ascending
    messages.sort((a, b) => new Date(a.sent_at || a.created_at).getTime() - new Date(b.sent_at || b.created_at).getTime());

    const first = messages[0];
    const last = messages[messages.length - 1];
    const participants = [...new Set(messages.flatMap(m => [m.sender_email, m.recipient_email].filter(Boolean) as string[]))];
    const unreadCount = messages.filter(m => !m.is_read).length;

    threads.push({
      id,
      subject: first.subject || '(No subject)',
      snippet: last.snippet || last.body_text?.slice(0, 150) || '',
      participants,
      lastMessageAt: last.sent_at || last.created_at,
      messageCount: messages.length,
      unreadCount,
      starred: messages.some(m => m.starred),
      customerId: first.customer_id,
      customerName: first.customer_name || null,
      messages,
      latestDirection: last.direction,
    });
  }

  // Sort threads by most recent message descending
  threads.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

  return threads;
}

export const useEmailStore = create<EmailStore>((set, get) => ({
  ...initialState,

  reset: () => set(initialState),

  fetchThreads: async (orgId: string, userId: string) => {
    set({ loading: true });
    try {
      const emails = await supabaseGet<EmailMessage[]>(
        'email_log',
        `organization_id=eq.${orgId}&user_id=eq.${userId}&select=*,customers(first_name,last_name,name,company)&order=sent_at.desc.nullslast,created_at.desc&limit=200`
      );

      // Flatten joined customer data
      const processed = emails.map((e: any) => ({
        ...e,
        customer_name: e.customers
          ? (e.customers.name || `${e.customers.first_name || ''} ${e.customers.last_name || ''}`.trim() || e.customers.company || null)
          : null,
        customers: undefined,
      }));

      const threads = groupIntoThreads(processed);
      const unreadCount = processed.filter((e: EmailMessage) => !e.is_read && e.direction === 'inbound').length;

      set({ threads, unreadCount, loading: false });
    } catch (err) {
      console.error('[emailStore] fetchThreads error:', err);
      set({ loading: false });
    }
  },

  markAsRead: async (emailIds: string[]) => {
    if (emailIds.length === 0) return;

    // Optimistic update
    set(state => {
      const threads = state.threads.map(t => ({
        ...t,
        messages: t.messages.map(m => emailIds.includes(m.id) ? { ...m, is_read: true } : m),
        unreadCount: t.messages.filter(m => !emailIds.includes(m.id) && !m.is_read).length,
      }));
      const unreadCount = threads.reduce((sum, t) => sum + t.unreadCount, 0);
      return { threads, unreadCount };
    });

    try {
      for (const id of emailIds) {
        await supabasePatch('email_log', `id=eq.${id}`, { is_read: true });
      }
    } catch (err) {
      console.error('[emailStore] markAsRead error:', err);
    }
  },

  toggleStar: async (emailId: string, currentStarred: boolean) => {
    const newStarred = !currentStarred;

    // Optimistic update
    set(state => ({
      threads: state.threads.map(t => ({
        ...t,
        messages: t.messages.map(m => m.id === emailId ? { ...m, starred: newStarred } : m),
        starred: t.messages.some(m => m.id === emailId ? newStarred : m.starred),
      })),
    }));

    try {
      await supabasePatch('email_log', `id=eq.${emailId}`, { starred: newStarred });
    } catch (err) {
      console.error('[emailStore] toggleStar error:', err);
    }
  },

  syncNow: async (orgId: string) => {
    set({ syncing: true });
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${supabaseUrl}/functions/v1/sync-inbox-emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization_id: orgId }),
      });

      const data = await res.json();
      set({ syncing: false });
      return { synced: data.synced || 0 };
    } catch (err) {
      console.error('[emailStore] syncNow error:', err);
      set({ syncing: false });
      return { synced: 0 };
    }
  },

  checkConnection: async (_orgId: string, userId: string) => {
    try {
      const connections = await supabaseGet(
        'email_oauth_connections',
        `user_id=eq.${userId}&status=eq.active&limit=1`
      );
      set({ connectionStatus: connections.length > 0 ? 'connected' : 'disconnected' });
    } catch {
      set({ connectionStatus: 'unknown' });
    }
  },

  setFilter: (filter) => set({ filter }),
  setSelectedThread: (threadId) => set({ selectedThreadId: threadId }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  sendReply: async (params) => {
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${supabaseUrl}/functions/v1/send-user-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: params.to,
          subject: params.subject,
          body: params.body,
          customer_id: params.customerId || undefined,
          in_reply_to: params.inReplyTo || undefined,
          conversation_id: params.conversationId || undefined,
        }),
      });

      if (!res.ok) {
        console.error('[emailStore] sendReply failed:', await res.text());
        return false;
      }

      return true;
    } catch (err) {
      console.error('[emailStore] sendReply error:', err);
      return false;
    }
  },
}));
