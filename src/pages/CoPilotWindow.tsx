import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useCopilotChatStore } from '@/stores/copilotChatStore';
import { useCustomerStore } from '@/stores/customerStore';
import CoPilotChatArea from '@/components/copilot/CoPilotChatArea';
import CoPilotInput from '@/components/copilot/CoPilotInput';
import TokenUsageIndicator from '@/components/copilot/TokenUsageIndicator';
import { logQBEvent } from '@/utils/qbActionLog';
import {
  Sparkles,
  MessageSquare,
  Zap,
  Info,
  User,
  TrendingUp,
  FileText,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  CheckSquare,
  Package,
} from 'lucide-react';
import { useQuickActions } from '@/hooks/useQuickActions';
import type { QuickAction } from '@/hooks/useQuickActions';

/**
 * Standalone CoPilot window -- rendered at /copilot-window in a separate browser
 * window (via window.open). No sidebar, no header, just the chat interface at
 * full viewport. Shares state with main app via same-origin Zustand stores.
 */
const CoPilotWindow: React.FC = () => {
  const {
    messages,
    isLoading,
    currentContext,
    tokenUsage,
    sendMessage,
    clearMessages,
    confirmAction,
    cancelAction,
    markChoiceSelected,
    markChoicesSelected,
    addAssistantMessage,
    setMessageFeedback,
    advancePersonalization,
    isPersonalizationInterview,
    pAcknowledgmentLoading,
    activeConversationId,
    conversationCustomerId,
  } = useCoPilot();

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { customers } = useCustomerStore();
  const quickActions = useQuickActions();

  // Set window title
  useEffect(() => {
    document.title = 'CxTrack CoPilot';
  }, []);

  // Warn on close if AI is generating
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isLoading]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    await sendMessage(trimmed);
  }, [input, isLoading, sendMessage]);

  // Personalization interview handler
  const handlePersonalizationAnswer = useCallback(
    (messageId: string, answers: string[]) => {
      markChoicesSelected(messageId, answers);
      advancePersonalization(answers);
    },
    [markChoicesSelected, advancePersonalization]
  );

  // QB choice handler (same logic as CoPilotPage)
  const handleChoiceSelect = useCallback(
    async (messageId: string, choiceId: string) => {
      markChoiceSelected(messageId, choiceId);

      const msg = messages.find((m) => m.id === messageId);
      if (msg?.pendingAction) {
        const customer = customers.find((c) => c.id === choiceId);
        if (!customer) return;
        const enrichedAction = {
          ...msg.pendingAction,
          fields: msg.pendingAction.fields.map((f) => ({ ...f })),
        };
        const nameField = enrichedAction.fields.find((f) => f.key === 'customer_name');
        if (nameField) nameField.value = customer.name;
        const phoneField = enrichedAction.fields.find((f) => f.key === 'to_phone');
        if (phoneField && customer.phone) phoneField.value = customer.phone;
        const emailField = enrichedAction.fields.find((f) => f.key === 'to_email');
        if (emailField && customer.email) emailField.value = customer.email;
        const idField = enrichedAction.fields.find((f) => f.key === 'customer_id');
        if (idField) idField.value = customer.id;
        addAssistantMessage({
          role: 'assistant',
          content: `Got it -- here's the action for **${customer.name}**:`,
          action: enrichedAction,
          actionStatus: 'proposed',
        });
        return;
      }

      if (choiceId === 'other') {
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      if (msg?.isAIGeneratedChoices) {
        const selectedChoice = msg.choices?.find((c: any) => c.id === choiceId);
        if (selectedChoice) {
          const followUpPrompt = selectedChoice.description
            ? `${selectedChoice.label}: ${selectedChoice.description}`
            : selectedChoice.label;
          await sendMessage(followUpPrompt);
          return;
        }
      }

      const insightData = currentContext?.data?.insightData;
      const insightType = currentContext?.data?.insightType;
      if (!insightData) return;

      logQBEvent({
        insightId: insightData.id || '',
        insightType: insightType || '',
        eventType: 'choice',
        choiceId,
        customerId: insightData.customer_id,
        customerName: insightData.customer_name,
        dealValue: insightData.value || insightData.total_amount || insightData.amount_outstanding,
      });
    },
    [messages, customers, markChoiceSelected, addAssistantMessage, sendMessage, currentContext]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white overflow-hidden">
      {/* Compact header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
          CxTrack CoPilot
        </span>
      </div>

      {/* Chat Messages */}
      <CoPilotChatArea
        messages={messages}
        isLoading={isLoading}
        pAcknowledgmentLoading={pAcknowledgmentLoading}
        contextPage={currentContext?.page}
        onConfirmAction={confirmAction}
        onCancelAction={cancelAction}
        onChoiceSelect={handleChoiceSelect}
        onPersonalizationAnswer={handlePersonalizationAnswer}
        onFeedbackGiven={setMessageFeedback}
        className="px-4"
      />

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {quickActions.map((qa, i) => (
            <button
              key={`${qa.label}-${i}`}
              onClick={() => setInput(qa.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300"
            >
              <QuickActionIcon name={qa.icon} />
              {qa.label}
            </button>
          ))}
        </div>
      </div>

      {/* Token Usage */}
      <TokenUsageIndicator tokenUsage={tokenUsage} />

      {/* Input */}
      <CoPilotInput
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        hasMessages={messages.length > 0}
        onClear={clearMessages}
        textareaRef={inputRef}
        autoFocus
      />
    </div>
  );
};

const QuickActionIcon: React.FC<{ name: QuickAction['icon'] }> = ({ name }) => {
  const cls = 'w-3.5 h-3.5';
  switch (name) {
    case 'MessageSquare': return <MessageSquare className={cls} />;
    case 'Zap': return <Zap className={cls} />;
    case 'Info': return <Info className={cls} />;
    case 'User': return <User className={cls} />;
    case 'TrendingUp': return <TrendingUp className={cls} />;
    case 'FileText': return <FileText className={cls} />;
    case 'Phone': return <Phone className={cls} />;
    case 'Mail': return <Mail className={cls} />;
    case 'Calendar': return <Calendar className={cls} />;
    case 'BarChart3': return <BarChart3 className={cls} />;
    case 'CheckSquare': return <CheckSquare className={cls} />;
    case 'Package': return <Package className={cls} />;
    default: return <Zap className={cls} />;
  }
};

export default CoPilotWindow;
