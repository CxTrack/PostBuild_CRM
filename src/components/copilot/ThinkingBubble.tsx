import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain } from 'lucide-react';

interface ThinkingBubbleProps {
  content: string;
  isLoading: boolean;
  timestamp: Date;
}

/**
 * Collapsible "thinking" indicator for system-generated CoPilot messages.
 * Replaces the raw purple text wall with a clean expandable bubble.
 *
 * - While loading: "CoPilot is thinking..." with animated dots
 * - After response: "CoPilot processed your request" with chevron
 * - Click to expand/collapse the raw context sent to the AI
 */
const ThinkingBubble: React.FC<ThinkingBubbleProps> = ({ content, isLoading, timestamp }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors cursor-pointer max-w-[85%]"
      >
        <Brain className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />

        {isLoading ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">
              CoPilot is thinking
            </span>
            <div className="flex gap-0.5 ml-0.5">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        ) : (
          <span className="text-sm text-purple-600 dark:text-purple-400">
            CoPilot processed your request
          </span>
        )}

        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-purple-400 dark:text-purple-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-purple-400 dark:text-purple-500 flex-shrink-0" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-1.5 max-w-[85%] px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </p>
          <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
            {new Date(timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default ThinkingBubble;
