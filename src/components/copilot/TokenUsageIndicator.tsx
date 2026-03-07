import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface TokenUsageData {
  tokensUsed: number;
  tokensAllocated: number;
  tokensRemaining: number;
}

export interface TokenUsageIndicatorProps {
  tokenUsage: TokenUsageData | null;
}

const TokenUsageIndicator: React.FC<TokenUsageIndicatorProps> = ({ tokenUsage }) => {
  const [tokensExpanded, setTokensExpanded] = useState(false);

  return (
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
  );
};

export default TokenUsageIndicator;
