import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useThemeStore } from '@/stores/themeStore';
import { useCopilotChatStore } from '@/stores/copilotChatStore';
import CoPilotChatArea from '@/components/copilot/CoPilotChatArea';
import CoPilotInput from '@/components/copilot/CoPilotInput';
import TokenUsageIndicator from '@/components/copilot/TokenUsageIndicator';
import ConversationList from '@/components/copilot/ConversationList';
import { logQBEvent } from '@/utils/qbActionLog';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  MessageSquare,
  Database,
  Zap,
  Info,
  Maximize2,
  Plus,
  History,
  TrendingUp,
  FileText,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  CheckSquare,
  Package,
  User,
  ExternalLink,
} from 'lucide-react';
import { useQuickActions } from '@/hooks/useQuickActions';
import type { QuickAction } from '@/hooks/useQuickActions';

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
    markChoicesSelected,
    addAssistantMessage,
    setMessageFeedback,
    advancePersonalization,
    isPersonalizationInterview,
    pAcknowledgmentLoading,
    startNewConversation,
    loadConversation,
    activeConversationId,
  } = useCoPilot();

  const navigate = useNavigate();
  const { theme } = useThemeStore();
  const quickActions = useQuickActions();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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

    // Handle AI-generated follow-up choices (from CHOICE_PROPOSAL blocks)
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

    // Quarterback insight flow
    const insightData = currentContext?.data?.insightData;
    const insightType = currentContext?.data?.insightType;
    if (!insightData) return;

    // Log QB choice selection
    logQBEvent({
      insightId: insightData.id || '',
      insightType: insightType || '',
      eventType: 'choice',
      choiceId,
      customerId: insightData.customer_id,
      customerName: insightData.customer_name,
      dealValue: insightData.value || insightData.total_amount || insightData.amount_outstanding,
    });

    // Meeting prep flow
    if (insightType === 'upcoming_meeting') {
      const attendeeList = (insightData.meeting_attendees || [])
        .map((a: any) => `${a.name || 'Unknown'} (${a.email})`).join(', ');
      const domainList = (insightData.meeting_company_domains || [])
        .map((d: any) => d.domain).join(', ');

      const meetingContext = `Meeting title: "${insightData.meeting_title}". ` +
        `Starts: ${insightData.meeting_start_time}. ` +
        `Ends: ${insightData.meeting_end_time || 'N/A'}. ` +
        `Location: ${insightData.meeting_location || 'Not specified'}. ` +
        `Meeting URL: ${insightData.meeting_url || 'None'}. ` +
        `Description: ${insightData.meeting_description || 'None provided'}. ` +
        `Attendees: ${attendeeList || 'None listed'}. ` +
        `Company domains: ${domainList || 'None identified'}. ` +
        (insightData.customer_name ? `CRM Customer: ${insightData.customer_name}. ` : '') +
        (insightData.total_spent ? `Lifetime value: $${insightData.total_spent.toLocaleString()}. ` : '');

      let prompt = '';
      switch (choiceId) {
        case 'meeting_research':
          prompt = `[MEETING_PREP_MODE] Action: Research attendees. ${meetingContext}Research the people and companies I'm meeting with. Use the company domains to describe what each company likely does. Summarize what I should know about each attendee and their company before the meeting.`;
          break;
        case 'meeting_agenda':
          prompt = `[MEETING_PREP_MODE] Action: Prepare meeting agenda. ${meetingContext}Create a professional meeting agenda based on the meeting title, description, and any known customer context. Include time allocations, discussion points, and suggested outcomes.`;
          break;
        case 'meeting_prep_notes':
          prompt = `[MEETING_PREP_MODE] Action: Draft prep notes. ${meetingContext}Create concise meeting preparation notes. Include: key talking points, what I should know about the attendees, any CRM relationship history, and 2-3 smart questions I should ask.`;
          break;
        case 'meeting_ask_questions':
          prompt = `[MEETING_PREP_MODE] Action: Interactive preparation. ${meetingContext}You are helping me prepare for this meeting by asking ME questions. Ask me 3-4 focused questions one at a time to understand what I want to accomplish, what my relationship with the attendees is, and what outcomes I am hoping for. After I answer, synthesize my responses into actionable prep notes.`;
          break;
        default:
          prompt = `[MEETING_PREP_MODE] ${meetingContext}Help me prepare for this meeting.`;
      }
      await sendMessage(prompt, { isSystemGenerated: true });
      return;
    }

    // Handle update_task choice
    if (choiceId === 'update_task') {
      const prompt = `[QUARTERBACK_MODE] The user chose to reschedule/update this task. Insight type: ${insightType}. Task ID: ${insightData.id}. Task title: "${insightData.title}". Customer: ${insightData.customer_name || 'unassigned'}. Current due date: ${insightData.due_date || 'unknown'}. Current priority: ${insightData.priority || 'medium'}. Days overdue: ${insightData.days_overdue || 'N/A'}. Email: ${insightData.email || 'not on file'}. Phone: ${insightData.phone || 'not on file'}. Propose an update_task ACTION_PROPOSAL so the user can reschedule the task. Pre-fill the task_id and suggest a reasonable new due date (the next business day from today). After the user confirms the task update, offer to also draft a follow-up message to the customer about the new timeline.`;
      await sendMessage(prompt, { isSystemGenerated: true });
      return;
    }

    // Compound risk: invoice follow-up
    if (choiceId === 'draft_invoice_followup') {
      const prompt = `[QUARTERBACK_MODE] The user chose to follow up on an overdue invoice. Insight type: ${insightType}. Customer: ${insightData.customer_name}. Email: ${insightData.email || 'not on file'}. Phone: ${insightData.phone || 'not on file'}. Lifetime value: $${insightData.total_spent?.toLocaleString() || '0'}. Overdue invoice amount: $${insightData.overdue_invoice_amount?.toLocaleString() || '0'}. Risk score: ${insightData.risk_score || 'N/A'}. Draft a professional payment reminder email referencing the relationship and outstanding amount, and include the ACTION_PROPOSAL block.`;
      await sendMessage(prompt, { isSystemGenerated: true });
      return;
    }

    // Compound risk: full recovery plan
    if (choiceId === 'recovery_plan') {
      const signals: string[] = [];
      if (insightData.has_stale_deal) signals.push(`stale deal worth $${insightData.stale_deal_value?.toLocaleString() || '0'}`);
      if (insightData.has_overdue_invoice) signals.push(`$${insightData.overdue_invoice_amount?.toLocaleString() || '0'} overdue invoice`);
      if (insightData.overdue_task_count > 0) signals.push(`${insightData.overdue_task_count} overdue tasks`);
      if (insightData.days_inactive) signals.push(`${insightData.days_inactive} days since last contact`);
      if (insightData.no_recent_emails) signals.push('no outbound emails in 30 days');
      const prompt = `[QUARTERBACK_MODE] The user wants a full recovery plan. Insight type: ${insightType}. Customer: ${insightData.customer_name}. Email: ${insightData.email || 'not on file'}. Phone: ${insightData.phone || 'not on file'}. Lifetime value: $${insightData.total_spent?.toLocaleString() || '0'}. Risk score: ${((insightData.risk_score || 0) * 100).toFixed(0)}%. Risk signals: ${signals.join(', ')}. Build a structured multi-step recovery plan with specific actions, timelines, and talking points. Address each risk signal. End with a CHOICE_PROPOSAL offering to execute the first step.`;
      await sendMessage(prompt, { isSystemGenerated: true });
      return;
    }

    // Low stock: reorder email
    if (choiceId === 'reorder_email') {
      const prompt = `[QUARTERBACK_MODE] The user chose to draft a reorder email to the supplier. Insight type: ${insightType}. Product: ${insightData.product_name}. SKU: ${insightData.sku || 'N/A'}. Quantity on hand: ${insightData.quantity_on_hand}. Reorder threshold: ${insightData.low_stock_threshold}. Suggested reorder qty: ${insightData.reorder_quantity || 'not set'}. Supplier: ${insightData.supplier_name || 'unknown'}. Email: ${insightData.email || 'not on file'}. Draft a professional reorder email and include the ACTION_PROPOSAL block.`;
      await sendMessage(prompt, { isSystemGenerated: true });
      return;
    }

    // Standard quarterback flow (email/SMS/call script)
    const choiceLabel: Record<string, string> = {
      draft_email: 'email',
      draft_sms: 'text message',
      draft_call_script: 'call script',
    };
    const label = choiceLabel[choiceId] || choiceId;

    const prompt = `[QUARTERBACK_MODE] The user chose to draft a ${label}. Insight type: ${insightType}. Customer: ${insightData.customer_name}. Email: ${insightData.email || 'not on file'}. Phone: ${insightData.phone || 'not on file'}. Lifetime value: $${insightData.total_spent?.toLocaleString() || '0'}. Days inactive: ${insightData.days_inactive || insightData.days_stale || insightData.days_overdue || insightData.days_past_followup || 'N/A'}. Draft the ${label} now and include the ACTION_PROPOSAL block so the user can review and send it.`;

    await sendMessage(prompt, { isSystemGenerated: true });
  }, [currentContext, sendMessage, markChoiceSelected, messages, addAssistantMessage]);

  // Handle personalization interview multi-select answers
  const handlePersonalizationAnswer = useCallback((
    messageId: string,
    selectedIds: string[],
    otherText?: string,
  ) => {
    markChoicesSelected(messageId, selectedIds, otherText);

    const msg = messages.find(m => m.id === messageId);
    if (!msg?.choicesConfig) return;

    const selectedLabels = selectedIds
      .map(id => msg.choicesConfig!.options.find(o => o.id === id)?.label)
      .filter(Boolean);

    const parts = [...selectedLabels];
    if (otherText?.trim()) parts.push(otherText.trim());

    if (parts.length === 0) return;

    const answerText = parts.join(', ');

    // Inject user's answer as a visible message
    addAssistantMessage({
      role: 'user' as const,
      content: answerText,
    });

    // Detect if user typed any freeform text (triggers AI acknowledgment path)
    const hasOtherText = !!otherText?.trim();

    // Advance the deterministic interview
    advancePersonalization(answerText, hasOtherText);
  }, [messages, markChoicesSelected, addAssistantMessage, advancePersonalization]);

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

  const switchSide = () => {
    setPanelSide(panelSide === 'left' ? 'right' : 'left');
  };

  const handlePopOut = () => {
    closePanel();
    window.open('/copilot-window', 'CxTrackCoPilot', 'width=500,height=700,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleNewChat = () => {
    startNewConversation();
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
    setShowHistory(false);
  };

  if (!isOpen) return null;

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

        <div className="flex items-center gap-1">
          {/* New Chat */}
          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="New conversation"
          >
            <Plus className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* History */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
            title="Chat history"
          >
            <History className="w-4.5 h-4.5" />
          </button>

          {/* Pop-out */}
          <button
            onClick={handlePopOut}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Open full page"
          >
            <Maximize2 className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Switch Side */}
          <button
            onClick={switchSide}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Switch side"
          >
            {panelSide === 'left' ? (
              <ChevronRight className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Close */}
          <button
            onClick={closePanel}
            className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Close"
          >
            <X className="w-4.5 h-4.5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {showSettings && <CoPilotSettings onClose={() => setShowSettings(false)} />}

      {currentContext && !showHistory && (
        <div className="px-4 py-3 border-b bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800 flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            Context: {currentContext.page || 'Dashboard'}
          </span>
        </div>
      )}

      {/* Conversation History Overlay */}
      {showHistory ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ConversationList
            compact
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </div>
      ) : (
        <>
          {/* Messages list */}
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
          />

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickActions.map((qa, i) => (
                <QuickActionChip
                  key={`${qa.label}-${i}`}
                  icon={<PanelQuickActionIcon name={qa.icon} />}
                  label={qa.label}
                  onClick={() => setInput(qa.prompt)}
                />
              ))}
            </div>
          </div>

          {/* Token Usage */}
          <TokenUsageIndicator tokenUsage={tokenUsage} />

          {/* Input area */}
          <CoPilotInput
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            hasMessages={messages.length > 0}
            onClear={clearMessages}
            textareaRef={inputRef}
          />
        </>
      )}
    </div>
  );
};

const PanelQuickActionIcon: React.FC<{ name: QuickAction['icon'] }> = ({ name }) => {
  const cls = "w-3.5 h-3.5";
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
