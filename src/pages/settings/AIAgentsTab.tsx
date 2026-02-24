import { useState } from 'react';
import { Mic, MessageSquare, Brain } from 'lucide-react';
import VoiceAgentSetup from './VoiceAgentSetup';
import SmsAgentSetup from './SmsAgentSetup';
import CoPilotContextTab from '@/components/settings/CoPilotContextTab';

interface AIAgentsTabProps {
  initialSubTab?: string;
}

type AIAgentSubTab = 'voice' | 'sms' | 'copilot';

const SUB_TABS: { id: AIAgentSubTab; label: string; icon: any }[] = [
  { id: 'voice', label: 'Voice Agent', icon: Mic },
  { id: 'sms', label: 'SMS Agent', icon: MessageSquare },
  { id: 'copilot', label: 'CoPilot Context', icon: Brain },
];

export default function AIAgentsTab({ initialSubTab }: AIAgentsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<AIAgentSubTab>(
    (initialSubTab as AIAgentSubTab) || 'voice'
  );

  return (
    <div className="space-y-5">
      {/* Sub-tab navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-1">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeSubTab === tab.id
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {activeSubTab === 'voice' && <VoiceAgentSetup />}
      {activeSubTab === 'sms' && <SmsAgentSetup />}
      {activeSubTab === 'copilot' && <CoPilotContextTab />}
    </div>
  );
}
