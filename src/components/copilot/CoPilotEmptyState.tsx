import React from 'react';
import { Sparkles, UserCog } from 'lucide-react';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useEffectiveUser } from '@/hooks/useEffectiveUser';

const SuggestedPrompt: React.FC<{ text: string }> = ({ text }) => {
  const { sendMessage } = useCoPilot();

  return (
    <button
      onClick={() => sendMessage(text)}
      className="block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300"
    >
      &ldquo;{text}&rdquo;
    </button>
  );
};

const CoPilotEmptyState: React.FC = () => {
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

export default CoPilotEmptyState;
