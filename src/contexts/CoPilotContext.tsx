import React, { createContext, useContext, useState, useCallback } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { ActionProposal, ActionStatus, ActionResult } from '@/types/copilot-actions.types';
import { parseActionProposal } from '@/utils/parseActionProposal';
import { executeAction, checkActionPermission } from '@/utils/executeAction';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: ActionProposal;
  actionStatus?: ActionStatus;
  actionResult?: ActionResult;
}

interface ContextData {
  page?: string;
  data?: any;
}

interface CoPilotConfig {
  provider: 'internal' | 'openai' | 'anthropic' | 'ollama' | 'custom';
  apiKey?: string;
  model?: string;
  endpoint?: string;
}

interface TokenUsage {
  tokensUsed: number;
  tokensRemaining: number;
  tokensAllocated: number;
}

interface CoPilotContextType {
  isOpen: boolean;
  panelSide: 'left' | 'right';
  messages: Message[];
  isLoading: boolean;
  currentContext: ContextData | null;
  config: CoPilotConfig;
  tokenUsage: TokenUsage | null;
  openPanel: () => void;
  closePanel: () => void;
  setPanelSide: (side: 'left' | 'right') => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setContext: (context: ContextData) => void;
  setConfig: (config: CoPilotConfig) => void;
  confirmAction: (messageId: string, editedFields: Record<string, any>) => Promise<void>;
  cancelAction: (messageId: string) => void;
}

const CoPilotContext = createContext<CoPilotContextType | undefined>(undefined);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

export const CoPilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelSide, setPanelSide] = useState<'left' | 'right'>('right');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentContext, setCurrentContext] = useState<ContextData | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [config, setConfig] = useState<CoPilotConfig>({
    provider: 'internal',
    model: 'internal-assistant',
  });

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setContext = useCallback((context: ContextData) => {
    setCurrentContext(context);
  }, []);

  const { customers, addNote, fetchCustomers } = useCustomerStore();

  // Confirm an action proposed by the AI
  const confirmAction = useCallback(async (messageId: string, editedFields: Record<string, any>) => {
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

  // Cancel an action proposed by the AI
  const cancelAction = useCallback((messageId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, actionStatus: 'cancelled' as ActionStatus } : m
    ));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const lowerContent = content.toLowerCase();

      // LOCAL ACTIONS: Note adding (handled locally, no AI needed)
      if (lowerContent.includes('add a note') || lowerContent.includes('add note') || lowerContent.includes('put a note') || lowerContent.includes('create a note')) {
        if (customers.length === 0) {
          await fetchCustomers();
        }

        let customer = null;
        for (const c of useCustomerStore.getState().customers) {
          if (content.toLowerCase().includes(c.name.toLowerCase())) {
            customer = c;
            break;
          }
        }

        if (customer) {
          let noteContent = "";
          if (content.includes("that ")) {
            noteContent = content.split("that ").slice(1).join("that ").trim();
          } else if (content.includes("note ")) {
            noteContent = content.split("note ").slice(1).join("note ").trim();
          } else {
            noteContent = "Update from CoPilot";
          }

          if (noteContent) {
            await addNote({
              customer_id: customer.id,
              content: noteContent
            });

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: `✅ Done! I've added that note to **${customer.name}'s** profile.\n\n**Note:** "${noteContent}"`,
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            toast.success('Note added successfully');
            return;
          }
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "I couldn't find a customer matching that name in your CRM. Could you please double-check the name or navigate to their profile so I can help?",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          return;
        }
      }

      // AI RESPONSE: Call the Edge Function
      // Read auth token directly from localStorage to avoid Supabase AbortController issue
      let accessToken: string | null = null;
      try {
        const ref = SUPABASE_URL.split('//')[1]?.split('.')[0];
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
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I need you to be signed in to use AI features. Please refresh the page and try again.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        return;
      }

      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const org = useOrganizationStore.getState().currentOrganization;
      const membership = useOrganizationStore.getState().currentMembership;

      const isAdminPage = currentContext?.page?.startsWith('Admin') ||
        window.location.pathname.startsWith('/admin');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/copilot-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          conversationHistory,
          context: {
            page: currentContext?.page || 'Dashboard',
            industry: org?.industry_template || 'general_business',
            orgName: org?.name || 'Your Organization',
            userRole: membership?.role || 'user',
            ...(isAdminPage && { isAdmin: true }),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'token_limit_reached') {
          setTokenUsage({
            tokensUsed: data.tokensUsed || 0,
            tokensRemaining: 0,
            tokensAllocated: data.tokensAllocated || 0,
          });

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "🚫 **Out of AI tokens**\n\nYou've used all your AI tokens for this month. To continue using CoPilot AI:\n\n• **Upgrade your plan** for more monthly tokens\n• Tokens reset at the start of each billing period\n\nI can still help with basic CRM actions like adding notes!",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
          return;
        }

        throw new Error(data.error || 'Failed to get AI response');
      }

      // Update token usage
      if (data.tokensRemaining !== undefined) {
        setTokenUsage({
          tokensUsed: data.tokensUsed || 0,
          tokensRemaining: data.tokensRemaining,
          tokensAllocated: data.tokensAllocated || 0,
        });
      }

      // Parse the AI response for action proposals
      const parsed = parseActionProposal(data.response);

      // Permission gate: strip action if user doesn't have permission
      let actionToShow = parsed.action;
      let displayContent = parsed.textContent;
      if (actionToShow && !checkActionPermission(actionToShow.actionType)) {
        actionToShow = undefined;
        displayContent += "\n\n⚠️ You don't have permission to perform this action. Contact your admin.";
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        timestamp: new Date(),
        action: actionToShow || undefined,
        actionStatus: actionToShow ? 'proposed' : undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('CoPilot error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, but I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [customers, addNote, fetchCustomers, messages, currentContext]);

  return (
    <CoPilotContext.Provider
      value={{
        isOpen,
        panelSide,
        messages,
        isLoading,
        currentContext,
        config,
        tokenUsage,
        openPanel,
        closePanel,
        setPanelSide,
        sendMessage,
        clearMessages,
        setContext,
        setConfig,
        confirmAction,
        cancelAction,
      }}
    >
      {children}
    </CoPilotContext.Provider>
  );
};

export const useCoPilot = () => {
  const context = useContext(CoPilotContext);
  if (!context) {
    throw new Error('useCoPilot must be used within CoPilotProvider');
  }
  return context;
};
