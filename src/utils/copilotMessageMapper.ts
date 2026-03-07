/**
 * Serialization utilities for CoPilot messages.
 * Maps between in-memory Message objects and database rows.
 */
import type { Message } from '@/contexts/CoPilotContext';
import type { ActionProposal, ActionResult, ChoiceOption, ChoicesConfig } from '@/types/copilot-actions.types';

/** Shape of a row in copilot_messages table */
export interface CopilotMessageRow {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  action_proposal: any | null;
  action_status: string | null;
  action_result: any | null;
  choices: any | null;
  choice_selected: string | null;
  choices_config: any | null;
  choices_selected: string[] | null;
  feedback_rating: string | null;
  is_acknowledgment: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

/** Payload for inserting a new message */
export interface CopilotMessageInsert {
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  action_proposal?: any;
  action_status?: string;
  action_result?: any;
  choices?: any;
  choice_selected?: string;
  choices_config?: any;
  choices_selected?: string[];
  feedback_rating?: string;
  is_acknowledgment?: boolean;
  metadata?: Record<string, any>;
}

/** Shape of a row in copilot_conversations table */
export interface CopilotConversation {
  id: string;
  user_id: string;
  organization_id: string;
  customer_id: string | null;
  title: string;
  context_type: 'general' | 'quarterback' | 'customer' | 'personalization';
  status: 'active' | 'archived';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  customer_name?: string;
  message_count?: number;
}

/**
 * Serialize an in-memory Message to a database insert payload.
 * Strips runtime-only fields (pendingAction, isAIGeneratedChoices, otherText).
 */
export function messageToRow(msg: Message, conversationId: string): CopilotMessageInsert {
  return {
    conversation_id: conversationId,
    role: msg.role,
    content: msg.content,
    action_proposal: msg.action ? serializeAction(msg.action) : undefined,
    action_status: msg.actionStatus || undefined,
    action_result: msg.actionResult ? {
      success: msg.actionResult.success,
      message: msg.actionResult.message,
      recordId: msg.actionResult.recordId,
      recordType: msg.actionResult.recordType,
    } : undefined,
    choices: msg.choices ? msg.choices.map(c => ({
      id: c.id,
      label: c.label,
      description: c.description,
      icon: c.icon,
    })) : undefined,
    choice_selected: msg.choiceSelected || undefined,
    choices_config: msg.choicesConfig ? {
      ...msg.choicesConfig,
      // Ensure options are serializable
      options: msg.choicesConfig.options?.map((o: any) => ({
        id: o.id,
        label: o.label,
        description: o.description,
        icon: o.icon,
      })),
    } : undefined,
    choices_selected: msg.choicesSelected || undefined,
    feedback_rating: msg.feedbackRating || undefined,
    is_acknowledgment: msg.isAcknowledgment || false,
    metadata: {
      ...(msg.otherText ? { otherText: msg.otherText } : {}),
      ...(msg.isAIGeneratedChoices ? { isAIGeneratedChoices: true } : {}),
      ...(msg.pendingAction ? { pendingAction: serializeAction(msg.pendingAction) } : {}),
    },
  };
}

/**
 * Deserialize a database row back into an in-memory Message.
 */
export function rowToMessage(row: CopilotMessageRow): Message {
  const metadata = row.metadata || {};

  return {
    id: row.id,
    role: row.role,
    content: row.content,
    timestamp: new Date(row.created_at),
    action: row.action_proposal ? deserializeAction(row.action_proposal) : undefined,
    actionStatus: (row.action_status as any) || undefined,
    actionResult: row.action_result ? {
      success: row.action_result.success,
      message: row.action_result.message,
      recordId: row.action_result.recordId,
      recordType: row.action_result.recordType,
    } : undefined,
    choices: row.choices ? row.choices.map((c: any) => ({
      id: c.id,
      label: c.label,
      description: c.description || '',
      icon: c.icon,
    })) : undefined,
    choiceSelected: row.choice_selected || undefined,
    choicesConfig: row.choices_config || undefined,
    choicesSelected: row.choices_selected || undefined,
    otherText: metadata.otherText || undefined,
    feedbackRating: (row.feedback_rating as 'positive' | 'negative') || undefined,
    pendingAction: metadata.pendingAction ? deserializeAction(metadata.pendingAction) : undefined,
    isAcknowledgment: row.is_acknowledgment || undefined,
    isAIGeneratedChoices: metadata.isAIGeneratedChoices || undefined,
  };
}

/** Serialize an ActionProposal to JSON-safe object */
function serializeAction(action: ActionProposal): any {
  return {
    actionType: action.actionType,
    label: action.label,
    fields: action.fields.map(f => ({
      key: f.key,
      label: f.label,
      value: f.value,
      type: f.type,
      required: f.required,
      options: f.options,
    })),
  };
}

/** Deserialize an ActionProposal from JSON */
function deserializeAction(data: any): ActionProposal {
  return {
    actionType: data.actionType,
    label: data.label,
    fields: (data.fields || []).map((f: any) => ({
      key: f.key,
      label: f.label,
      value: f.value,
      type: f.type || 'text',
      required: f.required ?? false,
      options: f.options,
    })),
  };
}
