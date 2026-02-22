import { useState } from 'react';
import { MessageSquare, Mail } from 'lucide-react';
import { SubTabs } from '@/components/ui/SubTabs';
import SMSSettingsTab from './SMSSettingsTab';
import EmailConnectionSettings from './EmailConnectionSettings';

interface CommunicationsTabProps {
  organizationId: string;
  industry: string;
  initialSubTab?: string;
}

export default function CommunicationsTab({ organizationId, industry, initialSubTab }: CommunicationsTabProps) {
  const [subTab, setSubTab] = useState(initialSubTab || 'sms');

  return (
    <div className="max-w-4xl space-y-6">
      <SubTabs
        tabs={[
          { id: 'sms', label: 'SMS & Messaging', icon: MessageSquare },
          { id: 'email', label: 'Email Connections', icon: Mail },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />
      {subTab === 'sms' && <SMSSettingsTab organizationId={organizationId} industry={industry} />}
      {subTab === 'email' && <EmailConnectionSettings />}
    </div>
  );
}
