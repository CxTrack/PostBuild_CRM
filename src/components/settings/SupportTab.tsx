import { useState } from 'react';
import { Shield, HelpCircle } from 'lucide-react';
import { SubTabs } from '@/components/ui/SubTabs';
import SecurityTab from './SecurityTab';
import HelpCenterTab from './HelpCenterTab';

interface SupportTabProps {
  initialSubTab?: string;
}

export default function SupportTab({ initialSubTab }: SupportTabProps) {
  const [subTab, setSubTab] = useState(initialSubTab || 'security');

  return (
    <div className="max-w-4xl space-y-6">
      <SubTabs
        tabs={[
          { id: 'security', label: 'Security', icon: Shield },
          { id: 'help', label: 'Help Center', icon: HelpCircle },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />
      {subTab === 'security' && <SecurityTab />}
      {subTab === 'help' && <HelpCenterTab />}
    </div>
  );
}
