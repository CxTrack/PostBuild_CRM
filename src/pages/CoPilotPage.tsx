import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useCopilotChatStore } from '@/stores/copilotChatStore';
import { useCustomerStore } from '@/stores/customerStore';
import CoPilotChatArea from '@/components/copilot/CoPilotChatArea';
import CoPilotInput from '@/components/copilot/CoPilotInput';
import TokenUsageIndicator from '@/components/copilot/TokenUsageIndicator';
import ConversationList from '@/components/copilot/ConversationList';
import { logQBEvent } from '@/utils/qbActionLog';
import {
  Sparkles,
  MessageSquare,
  Zap,
  Info,
  Database,
  ArrowLeft,
  User,
  Link2,
  X,
  Search,
  ExternalLink,
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

const CoPilotPage: React.FC = () => {
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
    startNewConversation,
    loadConversation,
    activeConversationId,
    conversationCustomerId,
    setConversationCustomerId,
  } = useCoPilot();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState('');
  const [showCustomerLink, setShowCustomerLink] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { updateConversationTitle, updateConversationCustomer } = useCopilotChatStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const quickActions = useQuickActions();

  // Ensure customers are loaded (fixes "No customers found" when navigating directly to CoPilot)
  useEffect(() => {
    if (customers.length === 0) {
      fetchCustomers();
    }
  }, [customers.length, fetchCustomers]);

  // Auto-load conversation from URL query param (?conversation=uuid)
  const loadedFromParamRef = useRef<string | null>(null);
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && convId !== loadedFromParamRef.current && convId !== activeConversationId) {
      loadedFromParamRef.current = convId;
      loadConversation(convId);
      // Clean up the query param after loading
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, activeConversationId, loadConversation, setSearchParams]);

  // Current conversation from store
  const conversations = useCopilotChatStore(s => s.conversations);
  const currentConv = conversations.find(c => c.id === activeConversationId);

  // Get linked customer name
  const linkedCustomer = conversationCustomerId
    ? customers.find(c => c.id === conversationCustomerId)
    : null;

  // QB choice handler (same as CoPilotPanel -- shared logic)
  const handleChoiceSelect = useCallback(async (messageId: string, choiceId: string) => {
    markChoiceSelected(messageId, choiceId);

    const msg = messages.find(m => m.id === messageId);
    if (msg?.pendingAction) {
      const customer = customers.find(c => c.id === choiceId);
      if (!customer) return;
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

    // Meeting prep flow
    if (insightType === 'upcoming_meeting') {
      const attendeeList = (insightData.meeting_attendees || [])
        .map((a: any) => `${a.name || 'Unknown'} (${a.email})`).join(', ');
      const domainList = (insightData.meeting_company_domains || [])
        .map((d: any) => d.domain).join(', ');
      const meetingContext = `Meeting title: "${insightData.meeting_title}". Starts: ${insightData.meeting_start_time}. Ends: ${insightData.meeting_end_time || 'N/A'}. Location: ${insightData.meeting_location || 'Not specified'}. Meeting URL: ${insightData.meeting_url || 'None'}. Description: ${insightData.meeting_description || 'None provided'}. Attendees: ${attendeeList || 'None listed'}. Company domains: ${domainList || 'None identified'}. ${insightData.customer_name ? `CRM Customer: ${insightData.customer_name}. ` : ''}${insightData.total_spent ? `Lifetime value: $${insightData.total_spent.toLocaleString()}. ` : ''}`;

      const promptMap: Record<string, string> = {
        meeting_research: `[MEETING_PREP_MODE] Action: Research attendees. ${meetingContext}Research the people and companies I'm meeting with.`,
        meeting_agenda: `[MEETING_PREP_MODE] Action: Prepare meeting agenda. ${meetingContext}Create a professional meeting agenda.`,
        meeting_prep_notes: `[MEETING_PREP_MODE] Action: Draft prep notes. ${meetingContext}Create concise meeting preparation notes.`,
        meeting_ask_questions: `[MEETING_PREP_MODE] Action: Interactive preparation. ${meetingContext}Ask me 3-4 focused questions to help prepare.`,
      };
      await sendMessage(promptMap[choiceId] || `[MEETING_PREP_MODE] ${meetingContext}Help me prepare.`, { isSystemGenerated: true });
      return;
    }

    if (choiceId === 'update_task') {
      await sendMessage(`[QUARTERBACK_MODE] The user chose to reschedule/update this task. Task ID: ${insightData.id}. Task title: "${insightData.title}". Customer: ${insightData.customer_name || 'unassigned'}. Due date: ${insightData.due_date || 'unknown'}. Priority: ${insightData.priority || 'medium'}. Days overdue: ${insightData.days_overdue || 'N/A'}. Propose an update_task ACTION_PROPOSAL.`, { isSystemGenerated: true });
      return;
    }

    if (choiceId === 'draft_invoice_followup') {
      await sendMessage(`[QUARTERBACK_MODE] Follow up overdue invoice. Customer: ${insightData.customer_name}. Email: ${insightData.email || 'N/A'}. Overdue: $${insightData.overdue_invoice_amount?.toLocaleString() || '0'}. Draft payment reminder with ACTION_PROPOSAL.`, { isSystemGenerated: true });
      return;
    }

    if (choiceId === 'recovery_plan') {
      const signals: string[] = [];
      if (insightData.has_stale_deal) signals.push(`stale deal $${insightData.stale_deal_value?.toLocaleString() || '0'}`);
      if (insightData.has_overdue_invoice) signals.push(`$${insightData.overdue_invoice_amount?.toLocaleString() || '0'} overdue`);
      if (insightData.overdue_task_count > 0) signals.push(`${insightData.overdue_task_count} overdue tasks`);
      if (insightData.days_inactive) signals.push(`${insightData.days_inactive}d inactive`);
      await sendMessage(`[QUARTERBACK_MODE] Full recovery plan. Customer: ${insightData.customer_name}. Risk: ${((insightData.risk_score || 0) * 100).toFixed(0)}%. Signals: ${signals.join(', ')}. Build multi-step plan with CHOICE_PROPOSAL.`, { isSystemGenerated: true });
      return;
    }

    if (choiceId === 'reorder_email') {
      await sendMessage(`[QUARTERBACK_MODE] Draft reorder email. Product: ${insightData.product_name}. SKU: ${insightData.sku || 'N/A'}. Qty on hand: ${insightData.quantity_on_hand}. Supplier: ${insightData.supplier_name || 'unknown'}. Include ACTION_PROPOSAL.`, { isSystemGenerated: true });
      return;
    }

    // Standard quarterback flow
    const choiceLabel: Record<string, string> = { draft_email: 'email', draft_sms: 'text message', draft_call_script: 'call script' };
    const label = choiceLabel[choiceId] || choiceId;
    await sendMessage(`[QUARTERBACK_MODE] Draft ${label}. Insight: ${insightType}. Customer: ${insightData.customer_name}. Email: ${insightData.email || 'N/A'}. Phone: ${insightData.phone || 'N/A'}. Value: $${insightData.total_spent?.toLocaleString() || '0'}. Include ACTION_PROPOSAL.`, { isSystemGenerated: true });
  }, [currentContext, sendMessage, markChoiceSelected, messages, addAssistantMessage, customers]);

  // Personalization answer handler
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
    addAssistantMessage({ role: 'user' as const, content: answerText });
    advancePersonalization(answerText, !!otherText?.trim());
  }, [messages, markChoicesSelected, addAssistantMessage, advancePersonalization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleNewChat = () => {
    startNewConversation();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSelectConversation = async (conversationId: string) => {
    await loadConversation(conversationId);
  };

  // Customer linking
  const handleLinkCustomer = async (customerId: string) => {
    setConversationCustomerId(customerId);
    if (activeConversationId) {
      await updateConversationCustomer(activeConversationId, customerId);
    }
    setShowCustomerLink(false);
    setCustomerSearch('');
  };

  const handleUnlinkCustomer = async () => {
    setConversationCustomerId(null);
    if (activeConversationId) {
      await updateConversationCustomer(activeConversationId, null);
    }
  };

  // Filter customers for search
  const filteredCustomers = customerSearch.trim()
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.company?.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 10)
    : customers.slice(0, 10);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white dark:bg-gray-900">
      {/* Left Sidebar: Conversation List */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <ConversationList
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Right: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {currentConv?.title || 'CxTrack CoPilot'}
              </h1>
              <div className="flex items-center gap-2">
                {currentContext && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                    <Database className="w-3 h-3" />
                    {currentContext.page || 'Dashboard'}
                  </span>
                )}
                {linkedCustomer && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <User className="w-2.5 h-2.5" />
                    {linkedCustomer.name}
                    <button
                      onClick={handleUnlinkCustomer}
                      className="ml-0.5 hover:text-blue-800 dark:hover:text-blue-200"
                      title="Unlink customer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Link Customer */}
            <div className="relative">
              <button
                onClick={() => setShowCustomerLink(!showCustomerLink)}
                className={`p-2 rounded-lg transition-colors ${showCustomerLink ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
                title="Link to customer"
              >
                <Link2 className="w-4.5 h-4.5" />
              </button>

              {showCustomerLink && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setShowCustomerLink(false); setCustomerSearch(''); }} />
                  <div className="absolute right-0 top-full mt-2 z-20 w-72 rounded-xl shadow-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Search customers..."
                          autoFocus
                          className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No customers found</p>
                      ) : (
                        filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleLinkCustomer(c.id)}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                              <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                              {c.company && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.company}</p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pop-out to separate window */}
            <button
              onClick={() => window.open('/copilot-window', 'CxTrackCoPilot', 'width=500,height=700,menubar=no,toolbar=no,location=no,status=no')}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
              title="Open in separate window"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Back to dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </button>
          </div>
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
          className="px-6"
        />

        {/* Quick Actions */}
        <div className="px-6 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickActions.map((qa, i) => (
              <QuickActionChip
                key={`${qa.label}-${i}`}
                icon={<QuickActionIcon name={qa.icon} />}
                label={qa.label}
                onClick={() => setInput(qa.prompt)}
              />
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
    </div>
  );
};

const QuickActionIcon: React.FC<{ name: QuickAction['icon'] }> = ({ name }) => {
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
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300"
  >
    {icon}
    {label}
  </button>
);

export default CoPilotPage;
