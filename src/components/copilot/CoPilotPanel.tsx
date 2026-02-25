import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useThemeStore } from '@/stores/themeStore';
import ActionCard from '@/components/copilot/ActionCard';
import ChoiceCard from '@/components/copilot/ChoiceCard';
import FeedbackButtons from '@/components/copilot/FeedbackButtons';
import { useAuthStore } from '@/stores/authStore';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Settings,
  Trash2,
  MessageSquare,
  Database,
  Zap,
  Info,
  Paperclip,
  UserCog,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CoPilotPanel: React.FC = () => {
  const {
    isOpen,
    panelSide,
    messages,
    isLoading,
    currentContext,
    tokenUsage,
    closePanel,
    setPanelSide,
    sendMessage,
    clearMessages,
    confirmAction,
    cancelAction,
    markChoiceSelected,
    addAssistantMessage,
    setMessageFeedback,
  } = useCoPilot();

  const { theme } = useThemeStore();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tokensExpanded, setTokensExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Handle Quarterback choice selection + customer disambiguation
  const handleChoiceSelect = useCallback(async (messageId: string, choiceId: string) => {
    markChoiceSelected(messageId, choiceId);

    // Check if this is a customer disambiguation choice
    const msg = messages.find(m => m.id === messageId);
    if (msg?.pendingAction) {
      const { useCustomerStore } = await import('@/stores/customerStore');
      const customer = useCustomerStore.getState().customers.find(c => c.id === choiceId);
      if (!customer) return;

      // Deep-copy the pending action and enrich with selected customer data
      const enrichedAction = {
        ...msg.pendingAction,
        fields: msg.pendingAction.fields.map(f => ({ ...f })),
      };
      const nameField = enrichedAction.fields.find(f => f.key === 'customer_name');
      if (nameField) nameField.value = customer.name;
      const phoneField = enrichedAction.fields.find(f => f.key === 'to_phone');
      if (phoneField && customer.phone) phoneField.value = customer.phone;
      const emailField = enrichedAction.fields.find(f => f.key === 'to_email');
      if (emailField && customer.email) emailField.value = customer.email;
      const idField = enrichedAction.fields.find(f => f.key === 'customer_id');
      if (idField) idField.value = customer.id;

      addAssistantMessage({
        role: 'assistant',
        content: `Got it -- here's the action for **${customer.name}**:`,
        action: enrichedAction,
        actionStatus: 'proposed',
      });
      return;
    }

    // "Other" lets the user type freely
    if (choiceId === 'other') {
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    // Quarterback insight flow
    const insightData = currentContext?.data?.insightData;
    const insightType = currentContext?.data?.insightType;
    if (!insightData) return;

    const choiceLabel: Record<string, string> = {
      draft_email: 'email',
      draft_sms: 'text message',
      draft_call_script: 'call script',
    };
    const label = choiceLabel[choiceId] || choiceId;

    const prompt = `[QUARTERBACK_MODE] The user chose to draft a ${label}. Insight type: ${insightType}. Customer: ${insightData.customer_name}. Email: ${insightData.email || 'not on file'}. Phone: ${insightData.phone || 'not on file'}. Lifetime value: $${insightData.total_spent?.toLocaleString() || '0'}. Days inactive: ${insightData.days_inactive || insightData.days_stale || insightData.days_overdue || insightData.days_past_followup || 'N/A'}. Draft the ${label} now and include the ACTION_PROPOSAL block so the user can review and send it.`;

    await sendMessage(prompt);
  }, [currentContext, sendMessage, markChoiceSelected, messages, addAssistantMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const switchSide = () => {
    setPanelSide(panelSide === 'left' ? 'right' : 'left');
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark' || theme === 'midnight';
  const isSoftModern = theme === 'soft-modern';

  return (
    <div
      className={`
        fixed top-0 ${panelSide === 'left' ? 'left-0' : 'right-0'} h-full z-50
        ${isSoftModern ? 'bg-[#F8F6F2]' : 'bg-white dark:bg-gray-800'}
        border ${panelSide === 'left' ? 'border-r' : 'border-l'}
        border-gray-200 dark:border-gray-700
        flex flex-col
        transition-all duration-300
      `}
      style={{
        width: '400px',
        boxShadow: panelSide === 'left'
          ? '4px 0 24px rgba(0, 0, 0, 0.15)'
          : '-4px 0 24px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              CxTrack CoPilot
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              AI-powered assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={switchSide}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Switch side"
          >
            {panelSide === 'left' ? (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <button
            onClick={closePanel}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {showSettings && <CoPilotSettings onClose={() => setShowSettings(false)} />}

      {currentContext && (
        <div className="px-4 py-3 border-b bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            Context: {currentContext.page || 'Dashboard'}
          </span>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message, idx) => {
            // Find the previous user message for feedback context
            const prevUserMsg = message.role === 'assistant'
              ? messages.slice(0, idx).reverse().find(m => m.role === 'user')?.content
              : undefined;
            return (
              <MessageBubble
                key={message.id}
                message={message}
                previousUserMessage={prevUserMsg}
                contextPage={currentContext?.page}
                onConfirmAction={confirmAction}
                onCancelAction={cancelAction}
                onChoiceSelect={handleChoiceSelect}
                onFeedbackGiven={setMessageFeedback}
              />
            );
          })
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="text-sm ml-2">CoPilot is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <QuickActionChip
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="Analyze data"
            onClick={() => setInput('Analyze my customer data and give me insights')}
          />
          <QuickActionChip
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Generate report"
            onClick={() => setInput('Generate a summary report of this page')}
          />
          <QuickActionChip
            icon={<Info className="w-3.5 h-3.5" />}
            label="Help"
            onClick={() => setInput('What can you help me with?')}
          />
        </div>
      </div>

      {/* Input area */}
      {/* Token Usage Indicator */}
      <div className="px-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => tokenUsage && setTokensExpanded(prev => !prev)}
          className={`w-full flex items-center justify-between py-1.5 text-xs text-gray-500 dark:text-gray-400 ${tokenUsage ? 'hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer' : 'cursor-default'} transition-colors`}
        >
          <span>AI Tokens</span>
          <div className="flex items-center gap-1.5">
            {tokenUsage ? (
              <>
                {!tokensExpanded && (
                  <span className="text-[10px]">
                    {tokenUsage.tokensRemaining.toLocaleString()} remaining
                  </span>
                )}
                <ChevronDown size={12} className={`transition-transform duration-200 ${tokensExpanded ? 'rotate-180' : ''}`} />
              </>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-gray-500">--</span>
            )}
          </div>
        </button>
        {tokensExpanded && tokenUsage && (
          <div className="pb-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{tokenUsage.tokensRemaining.toLocaleString()} / {tokenUsage.tokensAllocated.toLocaleString()} remaining</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  tokenUsage.tokensRemaining <= 0
                    ? 'bg-red-500'
                    : tokenUsage.tokensRemaining < tokenUsage.tokensAllocated * 0.2
                      ? 'bg-amber-500'
                      : 'bg-purple-500'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (tokenUsage.tokensRemaining / tokenUsage.tokensAllocated) * 100))}%`,
                }}
              />
            </div>
            {tokenUsage.tokensRemaining <= 0 && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                Out of tokens -- upgrade your plan for more
              </p>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CoPilot anything..."
                className="
                  w-full px-4 py-3 pr-10
                  rounded-xl
                  border
                  bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600
                  text-gray-900 dark:text-white
                  placeholder:text-gray-400 dark:placeholder:text-gray-500
                  focus:border-purple-500 focus:outline-none
                  resize-none
                  transition-colors
                  max-h-32
                "
                rows={1}
                style={{ minHeight: '48px' }}
              />

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearMessages}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end pb-0.5">
              <input
                type="file"
                id="copilot-file-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.success(`File "${file.name}" selected for upload`);
                  }
                }}
              />
              <label
                htmlFor="copilot-file-upload"
                className="p-3 rounded-xl border transition-all cursor-pointer bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-500"
                title="Upload file"
              >
                <Paperclip className="w-5 h-5" />
              </label>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="
                  p-3 rounded-xl
                  bg-gradient-to-br from-purple-500 to-purple-600
                  text-white
                  shadow-md
                  hover:from-purple-600 hover:to-purple-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                "
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-3 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => {
  const { fullName, profileMetadata } = useEffectiveUser();
  const hasAIContext = !!(
    profileMetadata.work_style?.length ||
    profileMetadata.communication_preference?.length ||
    profileMetadata.goals?.length
  );
  const firstName = fullName?.split(' ')[0];

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-900/30">
        <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {firstName ? `Hey ${firstName}, I'm your CoPilot` : "Hi! I'm your CoPilot"}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-xs mx-auto">
        I can help you analyze data, spot trends, draft messages, and keep your business on track.
      </p>

      {/* Profile nudge */}
      {!hasAIContext && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-2">
            <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                Personalize your CoPilot
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                Set up your work style, goals, and expertise in{' '}
                <a
                  href="/dashboard/settings?tab=profile"
                  className="underline font-medium hover:text-purple-800 dark:hover:text-purple-200"
                >
                  Settings &gt; Profile
                </a>{' '}
                for more tailored advice.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Try asking:
        </p>
        <div className="space-y-2">
          <SuggestedPrompt text="Show me my top customers this month" />
          <SuggestedPrompt text="What's my revenue trend?" />
          <SuggestedPrompt text="Find overdue tasks" />
        </div>
      </div>
    </div>
  );
};

const SuggestedPrompt: React.FC<{ text: string }> = ({ text }) => {
  const { sendMessage } = useCoPilot();

  return (
    <button
      onClick={() => sendMessage(text)}
      className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300"
    >
      "{text}"
    </button>
  );
};

const MessageBubble: React.FC<{
  message: any;
  previousUserMessage?: string;
  contextPage?: string;
  onConfirmAction?: (messageId: string, editedFields: Record<string, any>) => void;
  onCancelAction?: (messageId: string) => void;
  onChoiceSelect?: (messageId: string, choiceId: string) => void;
  onFeedbackGiven?: (messageId: string, rating: 'positive' | 'negative') => void;
}> = ({ message, previousUserMessage, contextPage, onConfirmAction, onCancelAction, onChoiceSelect, onFeedbackGiven }) => {
  const isUser = message.role === 'user';

  // Render markdown-like bold text (**text**) in assistant messages
  const renderContent = (text: string) => {
    if (isUser) return text;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`
          max-w-[85%] px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap">{renderContent(message.content)}</p>
        <p
          className={`text-xs mt-1 ${isUser
            ? 'text-purple-100'
            : 'text-gray-500 dark:text-gray-400'
            }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
      {/* Feedback buttons for assistant messages */}
      {!isUser && onFeedbackGiven && (
        <FeedbackButtons
          messageId={message.id}
          messageContent={message.content}
          userMessage={previousUserMessage}
          contextPage={contextPage}
          feedbackRating={message.feedbackRating}
          onFeedbackGiven={onFeedbackGiven}
        />
      )}
      {/* Choice Card - Quarterback options */}
      {message.choices && onChoiceSelect && (
        <div className="max-w-[85%] w-full">
          <ChoiceCard
            choices={message.choices}
            selectedChoice={message.choiceSelected}
            onSelect={(choiceId) => onChoiceSelect(message.id, choiceId)}
          />
        </div>
      )}
      {/* Action Card - AI-proposed action */}
      {message.action && onConfirmAction && onCancelAction && (
        <div className="max-w-[85%] w-full">
          <ActionCard
            action={message.action}
            status={message.actionStatus || 'proposed'}
            result={message.actionResult}
            onConfirm={(fields) => onConfirmAction(message.id, fields)}
            onCancel={() => onCancelAction(message.id)}
          />
        </div>
      )}
    </div>
  );
};

const QuickActionChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300"
    >
      {icon}
      {label}
    </button>
  );
};

const CoPilotSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config, setConfig } = useCoPilot();
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  return (
    <div className="px-4 py-3 border-b space-y-3 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          CoPilot Settings
        </h3>
        <button
          onClick={onClose}
          className="text-sm text-purple-600 font-medium hover:text-purple-700"
        >
          Done
        </button>
      </div>

      <div>
        <label className="text-xs font-medium mb-1 block text-gray-600 dark:text-gray-400">
          Model
        </label>
        <select
          value={localConfig.model || 'internal-assistant'}
          onChange={(e) =>
            setLocalConfig({ ...localConfig, model: e.target.value })
          }
          className="w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
        >
          <option value="internal-assistant">CxTrack AI (Default)</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors shadow-md"
      >
        Save Settings
      </button>
    </div>
  );
};

export default CoPilotPanel;
