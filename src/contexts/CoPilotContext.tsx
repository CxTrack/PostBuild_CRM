import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import type { ActionProposal, ActionStatus, ActionResult, ChoiceOption } from '@/types/copilot-actions.types';
import { parseActionProposal } from '@/utils/parseActionProposal';
import { executeAction, checkActionPermission } from '@/utils/executeAction';
import { getAuthToken } from '@/utils/auth.utils';
import { useImpersonationStore } from '@/stores/impersonationStore';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: ActionProposal;
  actionStatus?: ActionStatus;
  actionResult?: ActionResult;
  choices?: ChoiceOption[];
  choiceSelected?: string;
  feedbackRating?: 'positive' | 'negative';
  /** Stored when disambiguation is needed -- the action waiting for customer selection */
  pendingAction?: ActionProposal;
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
  addAssistantMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  markChoiceSelected: (messageId: string, choiceId: string) => void;
  setMessageFeedback: (messageId: string, rating: 'positive' | 'negative') => void;
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

  // Clear CoPilot conversation when the impersonation target changes
  // (e.g., switching from Alex -> Josie, or starting/ending impersonation)
  const { isImpersonating, targetUserId } = useImpersonationStore();
  const prevTargetRef = useRef<string | null>(null);

  useEffect(() => {
    const key = isImpersonating ? targetUserId : '__self__';
    if (prevTargetRef.current !== null && prevTargetRef.current !== key) {
      setMessages([]);
      setTokenUsage(null);
    }
    prevTargetRef.current = key;
  }, [isImpersonating, targetUserId]);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addAssistantMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, message]);
  }, []);

  const markChoiceSelected = useCallback((messageId: string, choiceId: string) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, choiceSelected: choiceId } : m
    ));
  }, []);

  const setMessageFeedback = useCallback((messageId: string, rating: 'positive' | 'negative') => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, feedbackRating: rating } : m
    ));
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
      // Use shared auth utility to avoid Supabase AbortController issue
      const accessToken = await getAuthToken();

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

      // Read AI CoPilot Context — use impersonated user's profile when active
      const impersonation = useImpersonationStore.getState();
      const profile = useAuthStore.getState().profile;

      const effectiveMeta = impersonation.isImpersonating && impersonation.targetProfile
        ? (impersonation.targetProfile.profile_metadata || {})
        : (profile?.profile_metadata || {});
      const effectiveName = impersonation.isImpersonating
        ? (impersonation.targetUserName || '')
        : (profile?.full_name || '');

      const userPreferences = {
        full_name: effectiveName,
        work_style: effectiveMeta.work_style || [],
        communication_preference: effectiveMeta.communication_preference || [],
        goals: effectiveMeta.goals || [],
        expertise: effectiveMeta.expertise || [],
        interests: effectiveMeta.interests || [],
      };
      const hasAIContext = !!(
        effectiveMeta.work_style?.length ||
        effectiveMeta.communication_preference?.length ||
        effectiveMeta.goals?.length
      );

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
          userPreferences,
          hasUserProfile: hasAIContext,
          // Pass impersonation context so edge function uses correct user for tokens + data
          ...(impersonation.isImpersonating && impersonation.targetUserId && {
            impersonation: {
              targetUserId: impersonation.targetUserId,
              targetOrgId: impersonation.targetOrgId,
            },
          }),
          context: {
            page: currentContext?.page || 'Dashboard',
            industry: org?.industry_template || 'general_business',
            orgName: org?.name || 'Your Organization',
            userRole: membership?.role || 'user',
            ...(isAdminPage && { isAdmin: true }),
            // AI Quarterback mode: forward insight data for hyper business-savvy responses
            ...(currentContext?.data?.quarterbackMode && {
              quarterbackMode: true,
              insightType: currentContext.data.insightType,
              insightData: currentContext.data.insightData,
            }),
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

      // Enrich action proposals with local CRM data (phone, email, customer_id)
      // If multiple customers share the same name, show disambiguation choices
      let disambiguationChoices: import('@/types/copilot-actions.types').ChoiceOption[] | null = null;
      let disambiguationAction: ActionProposal | undefined;

      if (parsed.action) {
        const customerNameField = parsed.action.fields.find(f => f.key === 'customer_name');
        if (customerNameField?.value) {
          const store = useCustomerStore.getState();
          if (store.customers.length === 0) {
            await store.fetchCustomers();
          }
          const allCustomers = useCustomerStore.getState().customers;
          const searchName = customerNameField.value.toLowerCase().trim();

          // Collect ALL matches at each tier, stop at the first tier that has results
          let matches: typeof allCustomers = [];
          const exactMatches = allCustomers.filter(c => c.name?.toLowerCase() === searchName);
          if (exactMatches.length > 0) {
            matches = exactMatches;
          } else {
            const partialMatches = allCustomers.filter(c => c.name?.toLowerCase().includes(searchName));
            if (partialMatches.length > 0) {
              matches = partialMatches;
            } else {
              const parts = searchName.split(/\s+/);
              if (parts.length >= 2) {
                matches = allCustomers.filter(c => {
                  const name = c.name?.toLowerCase() || '';
                  return parts.every(p => name.includes(p));
                });
              }
            }
          }

          // Deduplicate by ID
          const uniqueMatches = [...new Map(matches.map(c => [c.id, c])).values()];

          if (uniqueMatches.length === 1) {
            // Single match -- auto-fill fields
            const match = uniqueMatches[0];
            const phoneField = parsed.action.fields.find(f => f.key === 'to_phone');
            if (phoneField && !phoneField.value && match.phone) {
              phoneField.value = match.phone;
            }
            const emailField = parsed.action.fields.find(f => f.key === 'to_email');
            if (emailField && !emailField.value && match.email) {
              emailField.value = match.email;
            }
            const idField = parsed.action.fields.find(f => f.key === 'customer_id');
            if (idField && !idField.value) {
              idField.value = match.id;
            }
          } else if (uniqueMatches.length > 1) {
            // Multiple matches -- ask user to disambiguate
            disambiguationAction = parsed.action;
            parsed.action = undefined as any; // Strip action so ActionCard doesn't render yet
            disambiguationChoices = uniqueMatches.slice(0, 4).map(c => {
              const details: string[] = [];
              if (c.phone) details.push(c.phone);
              if (c.email) details.push(c.email);
              if (c.company) details.push(c.company);
              return {
                id: c.id,
                label: c.name || 'Unknown',
                description: details.join(' · ') || 'No contact info',
                icon: 'User',
              };
            });
          }
        }
      }

      // Permission gate: strip action if user doesn't have permission
      let actionToShow = parsed.action;
      let displayContent = parsed.textContent;
      if (actionToShow && !checkActionPermission(actionToShow.actionType)) {
        actionToShow = undefined;
        displayContent += "\n\n⚠️ You don't have permission to perform this action. Contact your admin.";
      }

      // If disambiguation is needed, show choices instead of the action card
      if (disambiguationChoices && disambiguationAction) {
        const disambigMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent + `\n\nI found **${disambiguationChoices.length} customers** matching that name. Which one did you mean?`,
          timestamp: new Date(),
          choices: disambiguationChoices,
          pendingAction: disambiguationAction,
        };
        setMessages(prev => [...prev, disambigMessage]);
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: displayContent,
          timestamp: new Date(),
          action: actionToShow || undefined,
          actionStatus: actionToShow ? 'proposed' : undefined,
        };
        setMessages(prev => [...prev, assistantMessage]);
      }

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
        addAssistantMessage,
        markChoiceSelected,
        setMessageFeedback,
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
