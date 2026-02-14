import { useState, useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { settingsService, BusinessSettings as BusinessSettingsType, DocumentTemplate } from '@/services/settings.service';
import { Building2, Mail, Phone, MapPin, Globe, CreditCard, FileText, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { validateEmail, validatePhone } from '@/utils/validation';
import toast from 'react-hot-toast';

export default function BusinessSettings() {
  const { currentOrganization } = useOrganizationStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<BusinessSettingsType | null>(null);
  const [quoteTemplates, setQuoteTemplates] = useState<DocumentTemplate[]>([]);
  const [invoiceTemplates, setInvoiceTemplates] = useState<DocumentTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'business' | 'templates' | 'payment'>('business');

  useEffect(() => {
    if (currentOrganization) {
      loadSettings();
    }
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const [settingsData, quoteTemps, invoiceTemps] = await Promise.all([
        settingsService.getBusinessSettings(currentOrganization.id),
        settingsService.getTemplates(currentOrganization.id, 'quote'),
        settingsService.getTemplates(currentOrganization.id, 'invoice'),
      ]);

      if (settingsData) {
        setSettings(settingsData);
      }

      if (quoteTemps.length === 0 && invoiceTemps.length === 0) {
        await settingsService.initializeDefaultTemplates(currentOrganization.id);
        const [newQuoteTemps, newInvoiceTemps] = await Promise.all([
          settingsService.getTemplates(currentOrganization.id, 'quote'),
          settingsService.getTemplates(currentOrganization.id, 'invoice'),
        ]);
        setQuoteTemplates(newQuoteTemps);
        setInvoiceTemplates(newInvoiceTemps);
      } else {
        setQuoteTemplates(quoteTemps);
        setInvoiceTemplates(invoiceTemps);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBusinessInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization || !settings) return;

    // Validate
    const emailResult = validateEmail(settings.business_email);
    if (!emailResult.isValid) {
      toast.error(emailResult.error || 'Invalid email');
      return;
    }
    const phoneResult = validatePhone(settings.business_phone);
    if (!phoneResult.isValid) {
      toast.error(phoneResult.error || 'Invalid phone');
      return;
    }

    try {
      setSaving(true);
      await settingsService.updateBusinessSettings(currentOrganization.id, {
        ...settings,
        business_phone: formatPhoneForStorage(settings.business_phone),
      });
      toast.success('Business information updated successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectTemplate = async (templateId: string, type: 'quote' | 'invoice') => {
    if (!currentOrganization) return;

    try {
      const fieldName = type === 'quote' ? 'default_quote_template_id' : 'default_invoice_template_id';
      await settingsService.updateBusinessSettings(currentOrganization.id, {
        [fieldName]: templateId,
      });

      setSettings(prev => prev ? { ...prev, [fieldName]: templateId } : null);
      toast.success(`Default ${type} template updated`);
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Business Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure your business information and document templates
        </p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('business')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'business'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Business Info
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Templates
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'payment'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Payment Settings
        </button>
      </div>

      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusinessInfo} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Business Email
              </label>
              <Input
                type="email"
                value={settings.business_email || ''}
                onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Business Phone
              </label>
              <PhoneInput
                value={settings.business_phone || ''}
                onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Street Address
              </label>
              <Input
                type="text"
                value={settings.business_address || ''}
                onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                placeholder="123 Business Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                City
              </label>
              <Input
                type="text"
                value={settings.business_city || ''}
                onChange={(e) => setSettings({ ...settings, business_city: e.target.value })}
                placeholder="San Francisco"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State/Province
              </label>
              <Input
                type="text"
                value={settings.business_state || ''}
                onChange={(e) => setSettings({ ...settings, business_state: e.target.value })}
                placeholder="CA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Postal Code
              </label>
              <Input
                type="text"
                value={settings.business_postal_code || ''}
                onChange={(e) => setSettings({ ...settings, business_postal_code: e.target.value })}
                placeholder="94102"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country
              </label>
              <Input
                type="text"
                value={settings.business_country || ''}
                onChange={(e) => setSettings({ ...settings, business_country: e.target.value })}
                placeholder="United States"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Website
              </label>
              <Input
                type="url"
                value={settings.business_website || ''}
                onChange={(e) => setSettings({ ...settings, business_website: e.target.value })}
                placeholder="https://www.company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quote Prefix
              </label>
              <Input
                type="text"
                value={settings.quote_prefix}
                onChange={(e) => setSettings({ ...settings, quote_prefix: e.target.value })}
                placeholder="QT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Invoice Prefix
              </label>
              <Input
                type="text"
                value={settings.invoice_prefix}
                onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                placeholder="INV"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Payment Terms
              </label>
              <Input
                type="text"
                value={settings.default_payment_terms}
                onChange={(e) => setSettings({ ...settings, default_payment_terms: e.target.value })}
                placeholder="Net 30"
              />
            </div>
          </div>

          {/* Tax & Identification */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Tax & Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Business Tax ID
                </label>
                <Input
                  type="text"
                  value={settings.business_tax_id || ''}
                  onChange={(e) => setSettings({ ...settings, business_tax_id: e.target.value })}
                  placeholder="GST/HST Number, EIN, or VAT Number"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Canada: GST/HST registration number &bull; US: EIN &bull; Displayed on invoices
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Tax Rate (%)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={settings.default_tax_rate ?? 0}
                    onChange={(e) => setSettings({ ...settings, default_tax_rate: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    max="100"
                    step="0.01"
                    className="flex-1"
                  />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const [rate, label] = e.target.value.split('|');
                        setSettings({ ...settings, default_tax_rate: parseFloat(rate), tax_label: label });
                      }
                    }}
                    className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300"
                  >
                    <option value="">Presets...</option>
                    <optgroup label="Canada">
                      <option value="13|HST">HST 13% (Ontario)</option>
                      <option value="15|HST">HST 15% (Atlantic)</option>
                      <option value="5|GST">GST 5%</option>
                      <option value="12|GST+PST">GST+PST 12% (BC)</option>
                      <option value="11|GST+PST">GST+PST 11% (SK)</option>
                      <option value="14.975|GST+QST">GST+QST 14.975% (QC)</option>
                    </optgroup>
                    <optgroup label="United States">
                      <option value="0|Sales Tax">No Sales Tax</option>
                      <option value="6|Sales Tax">Sales Tax 6%</option>
                      <option value="7|Sales Tax">Sales Tax 7%</option>
                      <option value="8|Sales Tax">Sales Tax 8%</option>
                      <option value="8.875|Sales Tax">Sales Tax 8.875% (NYC)</option>
                      <option value="10|Sales Tax">Sales Tax 10%</option>
                    </optgroup>
                  </select>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Applied to new invoices and quotes by default. Can be overridden per document.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tax Display Label
                </label>
                <Input
                  type="text"
                  value={settings.tax_label || 'Tax'}
                  onChange={(e) => setSettings({ ...settings, tax_label: e.target.value })}
                  placeholder="Tax"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Shown on invoices/quotes (e.g. "HST", "GST", "Sales Tax", "VAT")
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quote Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quoteTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 cursor-pointer transition-all ${
                    settings.default_quote_template_id === template.id
                      ? 'ring-2 ring-blue-600'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectTemplate(template.id, 'quote')}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-3 flex items-center justify-center relative">
                    {settings.default_quote_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{template.layout_type} Layout</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Invoice Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {invoiceTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 cursor-pointer transition-all ${
                    settings.default_invoice_template_id === template.id
                      ? 'ring-2 ring-blue-600'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleSelectTemplate(template.id, 'invoice')}
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg mb-3 flex items-center justify-center relative">
                    {settings.default_invoice_template_id === template.id && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                    <FileText className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{template.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{template.layout_type} Layout</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Stripe Integration</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Connect your Stripe account to accept online payments for invoices
            </p>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Stripe integration will be configured via Stripe Connect in a future update. Your API keys are managed securely server-side.
          </p>
        </div>
      )}
    </div>
  );
}
