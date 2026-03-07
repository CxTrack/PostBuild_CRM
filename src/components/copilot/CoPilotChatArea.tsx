import React, { useRef, useEffect } from 'react';
import type { Message } from '@/contexts/CoPilotContext';
import MessageBubble from '@/components/copilot/MessageBubble';
import CoPilotEmptyState from '@/components/copilot/CoPilotEmptyState';

export interface CoPilotChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  pAcknowledgmentLoading: boolean;
  contextPage?: string;
  onConfirmAction: (messageId: string, editedFields: Record<string, any>) => void;
  onCancelAction: (messageId: string) => void;
  onChoiceSelect: (messageId: string, choiceId: string) => void;
  onPersonalizationAnswer: (messageId: string, selectedIds: string[], otherText?: string) => void;
  onFeedbackGiven: (messageId: string, rating: 'positive' | 'negative') => void;
  /** Optional extra className for the scroll container */
  className?: string;
}

const CoPilotChatArea: React.FC<CoPilotChatAreaProps> = ({
  messages,
  isLoading,
  pAcknowledgmentLoading,
  contextPage,
  onConfirmAction,
  onCancelAction,
  onChoiceSelect,
  onPersonalizationAnswer,
  onFeedbackGiven,
  className = '',
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}>
      {messages.length === 0 ? (
        <CoPilotEmptyState />
      ) : (
        messages.map((message, idx) => {
          // Find the previous user message for feedback context
          const prevUserMsg = message.role === 'assistant'
            ? messages.slice(0, idx).reverse().find(m => m.role === 'user')?.content
            : undefined;
          // System-generated messages show thinking animation only on the last one while loading
          const isLastMessage = idx === messages.length - 1;
          const isThinking = isLastMessage && !!message.isSystemGenerated && isLoading;
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isLoading={isThinking}
              previousUserMessage={prevUserMsg}
              contextPage={contextPage}
              onConfirmAction={onConfirmAction}
              onCancelAction={onCancelAction}
              onChoiceSelect={onChoiceSelect}
              onPersonalizationAnswer={onPersonalizationAnswer}
              onFeedbackGiven={onFeedbackGiven}
            />
          );
        })
      )}

      {/* Standalone thinking dots: suppress when ThinkingBubble already shows animated dots */}
      {(() => {
        const lastMsg = messages[messages.length - 1];
        const showStandalone = (isLoading && !lastMsg?.isSystemGenerated) || pAcknowledgmentLoading;
        if (!showStandalone) return null;
        return (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="text-sm ml-2">{pAcknowledgmentLoading ? 'Processing...' : 'CoPilot is thinking...'}</span>
          </div>
        );
      })()}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default CoPilotChatArea;
