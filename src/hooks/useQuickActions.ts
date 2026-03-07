import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useCustomerStore } from '@/stores/customerStore';

export interface QuickAction {
  label: string;
  prompt: string;
  icon: 'MessageSquare' | 'Zap' | 'Info' | 'User' | 'TrendingUp' | 'FileText' | 'Phone' | 'Mail' | 'Calendar' | 'BarChart3' | 'CheckSquare' | 'Package';
}

/**
 * Returns context-aware quick action buttons for the CoPilot.
 *
 * Logic:
 * - If a customer is linked, show customer-specific actions
 * - If on a specific CRM page, show page-relevant actions
 * - Default: show general CRM starters
 */
export function useQuickActions(): QuickAction[] {
  const { conversationCustomerId, messages, currentContext } = useCoPilot();
  const location = useLocation();
  const customers = useCustomerStore(s => s.customers);

  return useMemo(() => {
    const linkedCustomer = conversationCustomerId
      ? customers.find(c => c.id === conversationCustomerId)
      : null;

    // Customer-linked conversation
    if (linkedCustomer) {
      const name = linkedCustomer.name || 'this customer';
      return [
        {
          label: `Draft email to ${name}`,
          prompt: `Draft a professional follow-up email to ${name}`,
          icon: 'Mail' as const,
        },
        {
          label: `${name}'s history`,
          prompt: `Summarize the relationship history and key interactions with ${name}`,
          icon: 'User' as const,
        },
        {
          label: `Check invoices`,
          prompt: `What is the invoice and payment status for ${name}?`,
          icon: 'FileText' as const,
        },
      ];
    }

    // Page-specific actions (when no customer is linked)
    const page = currentContext?.page?.toLowerCase() || '';
    const path = location.pathname.toLowerCase();

    if (page.includes('pipeline') || path.includes('pipeline')) {
      return [
        { label: 'Pipeline overview', prompt: 'Give me a summary of my current pipeline stages and deal values', icon: 'TrendingUp' as const },
        { label: 'Stale deals', prompt: 'Which deals have been sitting in the same stage for too long?', icon: 'Zap' as const },
        { label: 'Win rate', prompt: 'What is my pipeline conversion and win rate this month?', icon: 'BarChart3' as const },
      ];
    }

    if (page.includes('task') || path.includes('tasks')) {
      return [
        { label: 'Overdue tasks', prompt: 'Show me all overdue tasks and suggest which to prioritize', icon: 'CheckSquare' as const },
        { label: 'Today\'s tasks', prompt: 'What tasks are due today and what should I focus on first?', icon: 'Zap' as const },
        { label: 'Task summary', prompt: 'Give me a summary of task completion rates this week', icon: 'BarChart3' as const },
      ];
    }

    if (page.includes('customer') || path.includes('customers')) {
      return [
        { label: 'At-risk customers', prompt: 'Which customers show churn risk signals right now?', icon: 'Zap' as const },
        { label: 'Top customers', prompt: 'Who are my highest-value customers by revenue?', icon: 'TrendingUp' as const },
        { label: 'Follow-up needed', prompt: 'Which customers haven\'t been contacted in over 30 days?', icon: 'Phone' as const },
      ];
    }

    if (page.includes('invoice') || page.includes('financial') || path.includes('financials')) {
      return [
        { label: 'Overdue invoices', prompt: 'Show me all overdue invoices and their aging', icon: 'FileText' as const },
        { label: 'Revenue summary', prompt: 'What is my revenue summary for this month compared to last month?', icon: 'BarChart3' as const },
        { label: 'Collection priority', prompt: 'Which overdue invoices should I prioritize for collection?', icon: 'Zap' as const },
      ];
    }

    if (page.includes('call') || path.includes('calls')) {
      return [
        { label: 'Recent calls', prompt: 'Summarize my recent call activity and outcomes', icon: 'Phone' as const },
        { label: 'Follow-up calls', prompt: 'Which customers need a follow-up call based on recent interactions?', icon: 'Zap' as const },
        { label: 'Call insights', prompt: 'What trends do you see in my call history and sentiment?', icon: 'BarChart3' as const },
      ];
    }

    if (page.includes('inventory') || path.includes('inventory')) {
      return [
        { label: 'Low stock alerts', prompt: 'Which products are running low on stock and need reordering?', icon: 'Package' as const },
        { label: 'Inventory value', prompt: 'What is my total inventory value breakdown by category?', icon: 'BarChart3' as const },
        { label: 'Reorder suggestions', prompt: 'Suggest reorder quantities based on recent sales velocity', icon: 'Zap' as const },
      ];
    }

    // Active conversation with messages (suggest follow-ups based on last topic)
    if (messages.length > 2) {
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
      const content = lastAssistant?.content?.toLowerCase() || '';

      if (content.includes('email') || content.includes('draft')) {
        return [
          { label: 'Refine draft', prompt: 'Make it more concise and professional', icon: 'Mail' as const },
          { label: 'Change tone', prompt: 'Rewrite with a warmer, more personal tone', icon: 'MessageSquare' as const },
          { label: 'New topic', prompt: 'What else can you help me with?', icon: 'Info' as const },
        ];
      }

      if (content.includes('report') || content.includes('summary') || content.includes('analysis')) {
        return [
          { label: 'Dig deeper', prompt: 'Can you break this down in more detail?', icon: 'BarChart3' as const },
          { label: 'Action items', prompt: 'Based on this analysis, what actions should I take?', icon: 'CheckSquare' as const },
          { label: 'New topic', prompt: 'What else can you help me with?', icon: 'Info' as const },
        ];
      }
    }

    // Default starters for new conversations
    return [
      { label: 'Review my day', prompt: 'Give me a quick overview of what needs my attention today', icon: 'Zap' as const },
      { label: 'Pipeline check', prompt: 'How is my sales pipeline looking? Any deals need attention?', icon: 'TrendingUp' as const },
      { label: 'Help', prompt: 'What can you help me with?', icon: 'Info' as const },
    ];
  }, [conversationCustomerId, customers, currentContext?.page, location.pathname, messages]);
}
