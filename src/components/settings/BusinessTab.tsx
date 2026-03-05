import React, { useState } from 'react';
import { Building2, FileText } from 'lucide-react';
import { SubTabs } from '@/components/ui/SubTabs';
import BusinessInfoSection from './BusinessInfoSection';
import TemplatesSection from './TemplatesSection';
import { BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';

interface BusinessTabProps {
  settings: BusinessSettingsType;
  setSettings: (s: BusinessSettingsType) => void;
  organizationName: string;
  logoInputRef: React.RefObject<HTMLInputElement>;
  uploadingLogo: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveLogo: () => void;
  quoteTemplates: DocumentTemplate[];
  invoiceTemplates: DocumentTemplate[];
  handleSelectTemplate: (id: string, type: 'quote' | 'invoice') => void;
  getTemplateThumbnail: (name: string) => JSX.Element;
  initialSubTab?: string;
}

export default function BusinessTab({
  settings,
  setSettings,
  organizationName,
  logoInputRef,
  uploadingLogo,
  handleLogoUpload,
  handleRemoveLogo,
  quoteTemplates,
  invoiceTemplates,
  handleSelectTemplate,
  getTemplateThumbnail,
  initialSubTab,
}: BusinessTabProps) {
  const [subTab, setSubTab] = useState(initialSubTab || 'info');

  return (
    <div className="space-y-6">
      <SubTabs
        tabs={[
          { id: 'info', label: 'Business Info', icon: Building2 },
          { id: 'templates', label: 'Documents & Templates', icon: FileText },
        ]}
        activeTab={subTab}
        onChange={setSubTab}
      />
      {subTab === 'info' && (
        <BusinessInfoSection
          settings={settings}
          setSettings={setSettings}
          organizationName={organizationName}
          logoInputRef={logoInputRef}
          uploadingLogo={uploadingLogo}
          handleLogoUpload={handleLogoUpload}
          handleRemoveLogo={handleRemoveLogo}
        />
      )}
      {subTab === 'templates' && (
        <TemplatesSection
          settings={settings}
          setSettings={setSettings}
          quoteTemplates={quoteTemplates}
          invoiceTemplates={invoiceTemplates}
          handleSelectTemplate={handleSelectTemplate}
          getTemplateThumbnail={getTemplateThumbnail}
        />
      )}
    </div>
  );
}
