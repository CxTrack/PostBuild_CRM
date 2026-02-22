import { useState } from 'react';
import { Palette, Smartphone, Bell } from 'lucide-react';
import { SubTabs } from '@/components/ui/SubTabs';
import AppearanceSection from './AppearanceSection';
import MobileNavSection from './MobileNavSection';
import NotificationsTab from './NotificationsTab';

interface PreferencesTabProps {
  initialSubTab?: string;
}

export default function PreferencesTab({ initialSubTab }: PreferencesTabProps) {
  const [subTab, setSubTab] = useState(initialSubTab || 'theme');

  return (
    <div className="max-w-4xl space-y-6">
      <SubTabs
        tabs={[
          { id: 'theme', label: 'Theme', icon: Palette },
          { id: 'mobile', label: 'Mobile Navigation', icon: Smartphone },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />
      {subTab === 'theme' && <AppearanceSection />}
      {subTab === 'mobile' && <MobileNavSection />}
      {subTab === 'notifications' && <NotificationsTab />}
    </div>
  );
}
