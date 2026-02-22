import React from 'react';
import { Building2, Upload, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import { BusinessSettings as BusinessSettingsType } from '@/services/settings.service';

interface BusinessInfoSectionProps {
  settings: BusinessSettingsType;
  setSettings: (s: BusinessSettingsType) => void;
  organizationName: string;
  logoInputRef: React.RefObject<HTMLInputElement>;
  uploadingLogo: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveLogo: () => void;
}

export default function BusinessInfoSection({
  settings,
  setSettings,
  organizationName,
  logoInputRef,
  uploadingLogo,
  handleLogoUpload,
  handleRemoveLogo,
}: BusinessInfoSectionProps) {
  return (
    <div className="space-y-6">
      {/* Brand Identity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Brand Identity</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Logo</label>
            <div className="flex items-center gap-4">
              {settings.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700" />
              ) : (
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 inline mr-2" />
                  )}
                  {settings.logo_url ? 'Change Logo' : 'Upload Logo'}
                </button>
                {settings.logo_url && (
                  <button
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Remove Logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primary_color || '#6366f1'}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <Input
                  type="text"
                  value={settings.primary_color || '#6366f1'}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Contact Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Name</label>
            <Input
              type="text"
              value={settings.business_name ?? (organizationName || '')}
              onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
              placeholder="Your business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Email</label>
            <Input
              type="email"
              value={settings.business_email || ''}
              onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Business Phone</label>
            <PhoneInput
              value={settings.business_phone || ''}
              onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Website</label>
            <Input
              type="url"
              value={settings.business_website || ''}
              onChange={(e) => setSettings({ ...settings, business_website: e.target.value })}
              placeholder="https://www.company.com"
            />
          </div>
        </div>
      </div>

      {/* Business Address */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Business Address</h2>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <AddressAutocomplete
              label="Street Address"
              value={settings.business_address || ''}
              onChange={(value) => setSettings({ ...settings, business_address: value })}
              onAddressSelect={(components: AddressComponents) => {
                setSettings({
                  ...settings,
                  business_address: components.address,
                  business_city: components.city,
                  business_state: components.state,
                  business_postal_code: components.postal_code,
                  business_country: components.country,
                });
              }}
              placeholder="Start typing an address..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
              <Input
                type="text"
                value={settings.business_city || ''}
                onChange={(e) => setSettings({ ...settings, business_city: e.target.value })}
                placeholder="Toronto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State/Province</label>
              <Input
                type="text"
                value={settings.business_state || ''}
                onChange={(e) => setSettings({ ...settings, business_state: e.target.value })}
                placeholder="ON"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Postal Code</label>
              <Input
                type="text"
                value={settings.business_postal_code || ''}
                onChange={(e) => setSettings({ ...settings, business_postal_code: e.target.value })}
                placeholder="M5H 2N2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
              <select
                value={settings.business_country || 'Canada'}
                onChange={(e) => setSettings({ ...settings, business_country: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Canada">Canada</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="New Zealand">New Zealand</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Spain">Spain</option>
                <option value="Italy">Italy</option>
                <option value="Netherlands">Netherlands</option>
                <option value="Belgium">Belgium</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Mexico">Mexico</option>
                <option value="Brazil">Brazil</option>
                <option value="Japan">Japan</option>
                <option value="South Korea">South Korea</option>
                <option value="Singapore">Singapore</option>
                <option value="India">India</option>
                <option value="Ireland">Ireland</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
