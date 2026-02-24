import { useState } from 'react';
import { MessageSquare, Mail, FileText } from 'lucide-react';
import { SubTabs } from '@/components/ui/SubTabs';
import SMSSettingsTab from './SMSSettingsTab';
import EmailConnectionSettings from './EmailConnectionSettings';
import EmailTemplatesSection from './EmailTemplatesSection';

interface CommunicationsTabProps {
  organizationId: string;
  industry: string;
  initialSubTab?: string;
}

export default function CommunicationsTab({ organizationId, industry, initialSubTab }: CommunicationsTabProps) {
  const [subTab, setSubTab] = useState(initialSubTab || 'sms');

  return (
    <div className="space-y-6">
      <SubTabs
        tabs={[
          { id: 'sms', label: 'SMS & Messaging', icon: MessageSquare },
          { id: 'email', label: 'Email Connections', icon: Mail },
          { id: 'email-templates', label: 'Email Templates', icon: FileText },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />
      {subTab === 'sms' && <SMSSettingsTab organizationId={organizationId} industry={industry} />}
      {subTab === 'email' && <EmailConnectionSettings />}
      {subTab === 'email-templates' && <EmailTemplatesSection />}
    </div>
  );
}
