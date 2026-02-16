import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Building, Save, AlertCircle, MapPin, ChevronDown, ChevronUp, Camera, Loader2, CreditCard } from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { validateEmail, validatePhone, validateRequired } from '@/utils/validation';
import { formatPhoneForStorage } from '@/utils/phone.utils';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  navigateToProfileAfterCreate?: boolean;
}

export default function CustomerModal({ isOpen, onClose, customer, navigateToProfileAfterCreate = false }: CustomerModalProps) {
  const navigate = useNavigate();
  const { createCustomer, updateCustomer } = useCustomerStore();
  const { currentOrganization } = useOrganizationStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    customer_type: customer?.customer_type || 'personal',
    first_name: customer?.first_name || '',
    middle_name: customer?.middle_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    status: customer?.status || 'Active',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || '',
    card_image_url: customer?.card_image_url || '',
  });

  const [showAddress, setShowAddress] = useState(
    Boolean(customer?.address || customer?.city || customer?.state || customer?.postal_code)
  );

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_type: customer.customer_type || 'personal',
        first_name: customer.first_name || '',
        middle_name: customer.middle_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        status: customer.status || 'Active',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postal_code: customer.postal_code || '',
        country: customer.country || '',
        card_image_url: customer.card_image_url || '',
      });
      setShowAddress(Boolean(customer.address || customer.city || customer.state || customer.postal_code));
    }
  }, [customer]);

  const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentOrganization?.id) return;

    setIsScanning(true);
    setScanProgress('Uploading image...');
    setError('');

    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${currentOrganization.id}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-cards')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

      const { data: signedUrlData } = await supabase.storage
        .from('business-cards')
        .createSignedUrl(path, 3600);

      const imageUrl = signedUrlData?.signedUrl || path;

      setScanProgress('Scanning card...');
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      const ocrResponse = await fetch(`${supabaseUrl}/functions/v1/ocr-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ file_path: path, bucket: 'business-cards' }),
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'OCR processing failed');
      }

      const ocrData = await ocrResponse.json();

      if (ocrData.success && ocrData.contact) {
        const c = ocrData.contact;
        setFormData(prev => ({
          ...prev,
          first_name: c.first_name || prev.first_name,
          last_name: c.last_name || prev.last_name,
          email: c.email || prev.email,
          phone: c.phone || prev.phone,
          company: c.company || prev.company,
          customer_type: c.company ? 'business' : prev.customer_type,
          address: c.address || prev.address,
          city: c.city || prev.city,
          state: c.state || prev.state,
          postal_code: c.postal_code || prev.postal_code,
          country: c.country || prev.country,
          card_image_url: imageUrl,
        }));
        if (c.address || c.city || c.state || c.postal_code) {
          setShowAddress(true);
        }
        toast.success('Business card scanned — fields populated!');
      } else {
        throw new Error(ocrData.error || 'Could not extract contact info');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to scan business card');
      toast.error(err.message || 'Scan failed');
    } finally {
      setIsScanning(false);
      setScanProgress('');
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    if (formData.customer_type === 'business' && !formData.company) {
      setError('Company Name is required for business customers');
      return;
    }

    setSaving(true);

    try {
      // Validate required fields
      const firstNameValidation = validateRequired(formData.first_name, 'First Name');
      if (!firstNameValidation.isValid) {
        toast.error(firstNameValidation.error!);
        setSaving(false);
        return;
      }

      const lastNameValidation = validateRequired(formData.last_name, 'Last Name');
      if (!lastNameValidation.isValid) {
        toast.error(lastNameValidation.error!);
        setSaving(false);
        return;
      }

      const emailReqValidation = validateRequired(formData.email, 'Email');
      if (!emailReqValidation.isValid) {
        toast.error(emailReqValidation.error!);
        setSaving(false);
        return;
      }

      // Validate email format
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        toast.error(emailValidation.error!);
        setSaving(false);
        return;
      }

      // Validate phone if provided
      const phoneValidation = validatePhone(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error!);
        setSaving(false);
        return;
      }

      if (customer) {
        await updateCustomer(customer.id, {
          ...formData,
          phone: formatPhoneForStorage(formData.phone)
        });
        toast.success('Customer updated successfully');
        onClose();
      } else {
        const newCustomer = await createCustomer({
          ...formData,
          phone: formatPhoneForStorage(formData.phone)
        });

        if (!newCustomer) {
          throw new Error('Failed to create customer');
        }

        toast.success('Customer created successfully');

        setFormData({
          customer_type: 'personal',
          first_name: '',
          middle_name: '',
          last_name: '',
          email: '',
          phone: '',
          company: '',
          status: 'Active',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          card_image_url: '',
        });

        onClose();

        if (navigateToProfileAfterCreate && newCustomer.id) {
          navigate(`/dashboard/customers/${newCustomer.id}`);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save customer. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {customer ? 'Edit Customer' : 'New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Scan Business Card — shown for new customers */}
        {!customer?.id && (
          <div className="mx-6 mt-4">
            <button
              type="button"
              onClick={() => scanInputRef.current?.click()}
              disabled={isScanning}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium text-sm transition-all disabled:opacity-60"
            >
              {isScanning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {scanProgress}
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span className="hidden sm:inline">Scan Business Card</span>
                  <span className="sm:hidden">Scan Card to Auto-Fill</span>
                </>
              )}
            </button>
            <input
              ref={scanInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleScanCard}
              className="hidden"
            />
          </div>
        )}

        {formData.card_image_url && (
          <div className="mx-6 mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Business Card Reference:</p>
            <img
              src={formData.card_image_url}
              alt="Business card"
              className="w-full max-h-32 object-contain rounded"
            />
          </div>
        )}

        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-400">{error}</p>
                {error.toLowerCase().includes('already exists') && (
                  <p className="text-xs text-red-700 dark:text-red-500 mt-1">
                    Please check the Customers page or use a different email address.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'personal' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${formData.customer_type === 'personal'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.customer_type === 'personal'
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <User size={20} className={
                      formData.customer_type === 'personal'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Personal
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Individual client
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'business' })}
                className={`p-4 border-2 rounded-lg text-left transition-all ${formData.customer_type === 'business'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${formData.customer_type === 'business'
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <Building size={20} className={
                      formData.customer_type === 'business'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Business
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Company/org
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="John"
              />
            </div>

            <div className="col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Middle Name
            </label>
            <input
              type="text"
              value={formData.middle_name}
              onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Optional"
            />
          </div>

          {formData.customer_type === 'business' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Acme Corp"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone
            </label>
            <div>
              <PhoneInput
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Lead">Lead</option>
            </select>
          </div>

          {/* Address Section - Collapsible */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAddress(!showAddress)}
              className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
            >
              <MapPin size={14} className="mr-1" />
              {showAddress ? 'Hide Address' : 'Add Address'}
              {showAddress ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
            </button>

            {showAddress && (
              <div className="mt-3 space-y-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address
                  </label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    onAddressSelect={(components: AddressComponents) => {
                      setFormData(prev => ({
                        ...prev,
                        address: components.address,
                        city: components.city,
                        state: components.state,
                        postal_code: components.postal_code,
                        country: components.country,
                      }));
                    }}
                    placeholder="Start typing an address..."
                    className=""
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="State"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Postal / ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      placeholder="Postal code"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 pb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="mr-1">{'\u{1F4A1}'}</span>
              You can add more details (address, notes, etc.) from the customer profile page
            </p>
          </div>
        </form>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={
              saving ||
              !formData.first_name ||
              !formData.last_name ||
              !formData.email ||
              (formData.customer_type === 'business' && !formData.company)
            }
            className="flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {saving ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
