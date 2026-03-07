/**
 * CoPilot Chat Persistence Store
 *
 * Zustand store that manages persistent CoPilot conversations and messages.
 * Uses direct fetch() to Supabase REST API to avoid the AbortController issue.
 */
import { create } from 'zustand';
import { getAuthToken } from '@/utils/auth.utils';
import { useOrganizationStore } from './organizationStore';
import { useImpersonationStore } from './impersonationStore';
import type { CopilotConversation, CopilotMessageRow, CopilotMessageInsert } from '@/utils/copilotMessageMapper';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface CopilotChatStore {
  // State
  conversations: CopilotConversation[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;

  // Conversation CRUD
  loadConversations: (filter?: 'active' | 'archived') => Promise<void>;
  createConversation: (opts: {
    customerId?: string | null;
    contextType?: CopilotConversation['context_type'];
    title?: string;
  }) => Promise<string | null>;
  archiveConversation: (id: string) => Promise<void>;
  unarchiveConversation: (id: string) => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  updateConversationCustomer: (id: string, customerId: string | null) => Promise<void>;

  // Message persistence
  loadMessages: (conversationId: string) => Promise<CopilotMessageRow[]>;
  saveMessage: (msg: CopilotMessageInsert) => Promise<string | null>;
  updateMessage: (id: string, updates: Partial<CopilotMessageInsert>) => Promise<void>;

  // Utilities
  generateTitle: (firstMessage: string) => string;
  generateAITitle: (conversationId: string, messages: Array<{ role: string; content: string }>) => Promise<void>;
}

/** Build auth + apikey headers for Supabase REST calls */
async function getHeaders(): Promise<Record<string, string> | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
}

/** Get effective user ID (real or impersonated) */
function getEffectiveUserId(): string | null {
  const imp = useImpersonationStore.getState();
  if (imp.isImpersonating && imp.targetUserId) return imp.targetUserId;
  // Read from localStorage auth token
  try {
    const ref = SUPABASE_URL.split('//')[1]?.split('.')[0];
    const stored = localStorage.getItem(`sb-${ref}-auth-token`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed?.user?.id || null;
    }
  } catch { /* ignore */ }
  return null;
}

/** Get effective organization ID */
function getEffectiveOrgId(): string | null {
  const imp = useImpersonationStore.getState();
  if (imp.isImpersonating && imp.targetOrgId) return imp.targetOrgId;
  return useOrganizationStore.getState().currentOrganization?.id || null;
}

export const useCopilotChatStore = create<CopilotChatStore>((set, get) => ({
  conversations: [],
  isLoadingConversations: false,
  isLoadingMessages: false,

  loadConversations: async (filter = 'active') => {
    set({ isLoadingConversations: true });
    try {
      const headers = await getHeaders();
      if (!headers) return;

      const orgId = getEffectiveOrgId();
      if (!orgId) return;

      // Fetch conversations with message count
      const params = new URLSearchParams({
        organization_id: `eq.${orgId}`,
        status: `eq.${filter}`,
        select: 'id,user_id,organization_id,customer_id,title,context_type,status,metadata,created_at,updated_at',
        order: 'updated_at.desc',
        limit: '50',
      });

      const res = await fetch(`${SUPABASE_URL}/rest/v1/copilot_conversations?${params}`, { headers });
      if (!res.ok) {
        console.error('[CoPilotChat] Failed to load conversations', res.status);
        return;
      }

      const data: CopilotConversation[] = await res.json();
      set({ conversations: data });
    } catch (err) {
      console.error('[CoPilotChat] Load conversations error', err);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  createConversation: async ({ customerId, contextType = 'general', title }) => {
    try {
      const headers = await getHeaders();
      if (!headers) return null;

      const orgId = getEffectiveOrgId();
      const userId = getEffectiveUserId();
      if (!orgId || !userId) return null;

      const body: Record<string, any> = {
        user_id: userId,
        organization_id: orgId,
        title: title || 'New Conversation',
        context_type: contextType,
        status: 'active',
      };
      if (customerId) body.customer_id = customerId;

      const res = await fetch(`${SUPABASE_URL}/rest/v1/copilot_conversations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error('[CoPilotChat] Failed to create conversation', res.status);
        return null;
      }

      const [created] = await res.json();
      if (created) {
        // Prepend to local list
        set(state => ({
          conversations: [created, ...state.conversations],
        }));
        return created.id;
      }
      return null;
    } catch (err) {
      console.error('[CoPilotChat] Create conversation error', err);
      return null;
    }
  },

  archiveConversation: async (id) => {
    try {
      const headers = await getHeaders();
      if (!headers) return;

      await fetch(`${SUPABASE_URL}/rest/v1/copilot_conversations?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'archived' }),
      });

      set(state => ({
        conversations: state.conversations.filter(c => c.id !== id),
      }));
    } catch (err) {
      console.error('[CoPilotChat] Archive conversation error', err);
    }
  },

  unarchiveConversation: async (id) => {
    try {
      const headers = await getHeaders();
      if (!headers) return;

      await fetch(`${SUPABASE_URL}/rest/v1/copilot_conversations?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'active' }),
      });

      set(state => ({
        conversations: state.conversations.filter(c => c.id !== id),
      }));
    } catch (err) {
      console.error('[CoPilotChat] Unarchive conversation error', err);
    }
  },

  updateConversationTitle: async (id, title) => {
    try {
      const headers = await getHeaders();
      if (!headers) return;

      await fetch(`${SUPABASE_URL}/rest/v1/copilot_conversations?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title }),
      });

      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, title } : c
        ),
      }));
    } catch (err) {
      console.error('[CoPilotChat] Update title error', err);
    }
  },

  updateConversationCustomer: async (id, customerId) => {
    try {
      const headers = await getHeaders();
      if (!headers) return;

      await fetch(`${SUPABASE_URL}/rest/v1/copilot_conversations?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ customer_id: customerId }),
      });

      set(state => ({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, customer_id: customerId } : c
        ),
      }));
    } catch (err) {
      console.error('[CoPilotChat] Update customer error', err);
    }
  },

  loadMessages: async (conversationId) => {
    set({ isLoadingMessages: true });
    try {
      const headers = await getHeaders();
      if (!headers) return [];

      const params = new URLSearchParams({
        conversation_id: `eq.${conversationId}`,
        select: '*',
        order: 'created_at.asc',
      });

      const res = await fetch(`${SUPABASE_URL}/rest/v1/copilot_messages?${params}`, { headers });
      if (!res.ok) {
        console.error('[CoPilotChat] Failed to load messages', res.status);
        return [];
      }

      return await res.json();
    } catch (err) {
      console.error('[CoPilotChat] Load messages error', err);
      return [];
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  saveMessage: async (msg) => {
    try {
      const headers = await getHeaders();
      if (!headers) return null;

      // Clean undefined values for Supabase
      const body: Record<string, any> = { ...msg };
      Object.keys(body).forEach(k => {
        if (body[k] === undefined) delete body[k];
      });

      const res = await fetch(`${SUPABASE_URL}/rest/v1/copilot_messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error('[CoPilotChat] Failed to save message', res.status);
        return null;
      }

      const [saved] = await res.json();
      return saved?.id || null;
    } catch (err) {
      console.error('[CoPilotChat] Save message error', err);
      return null;
    }
  },

  updateMessage: async (id, updates) => {
    try {
      const headers = await getHeaders();
      if (!headers) return;

      const body: Record<string, any> = { ...updates };
      Object.keys(body).forEach(k => {
        if (body[k] === undefined) delete body[k];
      });

      await fetch(`${SUPABASE_URL}/rest/v1/copilot_messages?id=eq.${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body),
      });
    } catch (err) {
      console.error('[CoPilotChat] Update message error', err);
    }
  },

  generateTitle: (firstMessage) => {
    // Simple client-side title generation: truncate first message
    const cleaned = firstMessage.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= 60) return cleaned;
    return cleaned.substring(0, 57) + '...';
  },

  generateAITitle: async (conversationId, messages) => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Send first few messages as context for title generation
      const context = messages.slice(0, 4).map(m => ({
        role: m.role,
        content: m.content.substring(0, 300),
      }));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/copilot-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          titleGeneration: true,
          titleContext: context,
        }),
      });

      clearTimeout(timeout);

      if (!res.ok) return;

      const data = await res.json();
      const title = data.title?.trim();
      if (title && title.length > 0 && title.length <= 80) {
        // Persist to DB and update local state
        await get().updateConversationTitle(conversationId, title);
      }
    } catch {
      // Non-critical -- silently fall back to truncated title
    }
  },
}));
