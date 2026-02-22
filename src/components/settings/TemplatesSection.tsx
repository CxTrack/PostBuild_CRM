import { Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { PAYMENT_TERMS_OPTIONS } from '@/config/paymentTerms';

interface TemplatesSectionProps {
  settings: BusinessSettingsType;
  setSettings: (s: BusinessSettingsType) => void;
  quoteTemplates: DocumentTemplate[];
  invoiceTemplates: DocumentTemplate[];
  handleSelectTemplate: (id: string, type: 'quote' | 'invoice') => void;
  getTemplateThumbnail: (name: string) => JSX.Element;
}

export default function TemplatesSection({
  settings,
  setSettings,
  quoteTemplates,
  invoiceTemplates,
  handleSelectTemplate,
  getTemplateThumbnail,
}: TemplatesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Document Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Document Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quote Prefix</label>
            <Input
              type="text"
              value={settings.quote_prefix}
              onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
              placeholder="QT"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: QT-0001</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Invoice Prefix</label>
            <Input
              type="text"
              value={settings.invoice_prefix}
              onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
              placeholder="INV"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Example: INV-0001</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Default Payment Terms</label>
            <select
              value={PAYMENT_TERMS_OPTIONS.find(o => o.key === settings.default_payment_terms) ? settings.default_payment_terms : (settings.default_payment_terms ? 'custom' : '')}
              onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select default terms...</option>
              {PAYMENT_TERMS_OPTIONS.map(option => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applied to new invoices and quotes by default</p>
          </div>
        </div>
      </div>

      {/* Quote Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quote Templates</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Select a default template for your quotes</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quoteTemplates.map((template) => (
            <div
              key={template.id}
              className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${settings.default_quote_template_id === template.id
                ? 'ring-2 ring-blue-600 shadow-lg'
                : 'hover:shadow-lg hover:scale-105'
              }`}
              onClick={() => handleSelectTemplate(template.id, 'quote')}
            >
              <div className="h-48">{getTemplateThumbnail(template.name)}</div>
              {settings.default_quote_template_id === template.id && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{template.layout_type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Invoice Templates</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Select a default template for your invoices</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {invoiceTemplates.map((template) => (
            <div
              key={template.id}
              className={`relative cursor-pointer rounded-xl overflow-hidden transition-all group ${settings.default_invoice_template_id === template.id
                ? 'ring-2 ring-blue-600 shadow-lg'
                : 'hover:shadow-lg hover:scale-105'
              }`}
              onClick={() => handleSelectTemplate(template.id, 'invoice')}
            >
              <div className="h-48">{getTemplateThumbnail(template.name)}</div>
              {settings.default_invoice_template_id === template.id && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1.5 shadow-lg">
                  <Check className="w-4 h-4" />
                </div>
              )}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{template.layout_type}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
