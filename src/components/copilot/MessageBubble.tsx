import React from 'react';
import type { Message } from '@/contexts/CoPilotContext';
import ActionCard from '@/components/copilot/ActionCard';
import ChoiceCard from '@/components/copilot/ChoiceCard';
import FeedbackButtons from '@/components/copilot/FeedbackButtons';
import ThinkingBubble from '@/components/copilot/ThinkingBubble';

export interface MessageBubbleProps {
  message: Message;
  /** True when this system-generated message is the active thinking message (shows animated dots) */
  isLoading?: boolean;
  previousUserMessage?: string;
  contextPage?: string;
  onConfirmAction?: (messageId: string, editedFields: Record<string, any>) => void;
  onCancelAction?: (messageId: string) => void;
  onChoiceSelect?: (messageId: string, choiceId: string) => void;
  onPersonalizationAnswer?: (messageId: string, selectedIds: string[], otherText?: string) => void;
  onFeedbackGiven?: (messageId: string, rating: 'positive' | 'negative') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isLoading = false,
  previousUserMessage,
  contextPage,
  onConfirmAction,
  onCancelAction,
  onChoiceSelect,
  onPersonalizationAnswer,
  onFeedbackGiven,
}) => {
  const isUser = message.role === 'user';

  // System-generated user messages render as collapsible thinking bubble
  if (isUser && message.isSystemGenerated) {
    return <ThinkingBubble content={message.content} isLoading={isLoading} timestamp={message.timestamp} />;
  }

  // Render markdown-like bold text (**text**) in assistant messages
  // For user messages, strip structured prefixes before display
  const renderContent = (text: string) => {
    if (isUser) {
      return text.replace(/^\[PERSONALIZATION_ANSWER\]\s*/, '');
    }
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
      {/* Feedback buttons for assistant messages (skip for acknowledgment bubbles) */}
      {!isUser && onFeedbackGiven && !message.isAcknowledgment && (
        <FeedbackButtons
          messageId={message.id}
          messageContent={message.content}
          userMessage={previousUserMessage}
          contextPage={contextPage}
          feedbackRating={message.feedbackRating}
          onFeedbackGiven={onFeedbackGiven}
        />
      )}
      {/* Choice Card - Quarterback options (legacy single-select) */}
      {message.choices && !message.choicesConfig && onChoiceSelect && (
        <div className="max-w-[85%] w-full">
          <ChoiceCard
            choices={message.choices}
            selectedChoice={message.choiceSelected}
            onSelect={(choiceId) => onChoiceSelect(message.id, choiceId)}
          />
        </div>
      )}
      {/* Choice Card - Personalization interview (multi-select) */}
      {message.choicesConfig && onPersonalizationAnswer && (
        <div className="max-w-[85%] w-full">
          <ChoiceCard
            choicesConfig={message.choicesConfig}
            choicesSelected={message.choicesSelected}
            otherText={message.otherText}
            onMultiSelect={(ids, other) => onPersonalizationAnswer(message.id, ids, other)}
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

export default MessageBubble;
