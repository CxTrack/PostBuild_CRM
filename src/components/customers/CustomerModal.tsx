import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Mail, Building, Save, AlertCircle, MapPin, ChevronDown, ChevronUp, Camera, Loader2, CreditCard } from 'lucide-react';
import { useCustomerStore } from '@/stores/customerStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete, AddressComponents } from '@/components/ui/AddressAutocomplete';
import { CountrySelect } from '@/components/ui/CountrySelect';
import toast from 'react-hot-toast';
import { validateEmail, validatePhone, validateRequired } from '@/utils/validation';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { getAuthToken, getSupabaseUrl } from '@/utils/auth.utils';
import { compressImageForOCR } from '@/utils/image.utils';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any;
  prefill?: any;
  navigateToProfileAfterCreate?: boolean;
}

export default function CustomerModal({ isOpen, onClose, customer, prefill, navigateToProfileAfterCreate = false }: CustomerModalProps) {
  const navigate = useNavigate();
  const { createCustomer, updateCustomer, createChildContact } = useCustomerStore();
  const { currentOrganization, currentMembership, teamMembers } = useOrganizationStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [assignedTo, setAssignedTo] = useState('');

  const canAssign = currentMembership?.role === 'owner' || currentMembership?.role === 'admin' || currentMembership?.role === 'manager';

  const [formData, setFormData] = useState({
    customer_type: customer?.customer_type || 'personal',
    first_name: customer?.first_name || '',
    middle_name: customer?.middle_name || '',
    last_name: customer?.last_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    company: customer?.company || '',
    title: customer?.title || '',
    status: customer?.status || 'Active',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    postal_code: customer?.postal_code || '',
    country: customer?.country || '',
    card_image_url: customer?.card_image_url || '',
    membership_start: customer?.membership_start || '',
    membership_end: customer?.membership_end || '',
  });

  const industry = currentOrganization?.industry_template || null;

  const [showAddress, setShowAddress] = useState(
    Boolean(customer?.address || customer?.city || customer?.state || customer?.postal_code)
  );

  useEffect(() => {
    const source = customer || prefill;
    if (source) {
      setFormData({
        customer_type: source.company ? 'business' : (source.customer_type || 'personal'),
        first_name: source.first_name || '',
        middle_name: source.middle_name || '',
        last_name: source.last_name || '',
        email: source.email || '',
        phone: source.phone || '',
        company: source.company || '',
        title: source.title || '',
        status: source.status || 'Active',
        address: source.address || '',
        city: source.city || '',
        state: source.state || '',
        postal_code: source.postal_code || '',
        country: source.country || '',
        card_image_url: source.card_image_url || '',
        membership_start: source.membership_start || '',
        membership_end: source.membership_end || '',
      });
      setShowAddress(Boolean(source.address || source.city || source.state || source.postal_code));
    }
  }, [customer, prefill]);

  const handleScanCard = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile || !currentOrganization?.id) return;

    setIsScanning(true);
    setScanProgress('Uploading image...');
    setError('');

    try {
      const file = await compressImageForOCR(rawFile);
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${currentOrganization.id}/${timestamp}_${safeName}`;

      const supabaseUrl = getSupabaseUrl();
      const accessToken = await getAuthToken();
      if (!accessToken) throw new Error('Please sign in to scan business cards');

      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Upload via direct fetch (avoids Supabase JS AbortController issue)
      const uploadRes = await fetch(
        `${supabaseUrl}/storage/v1/object/business-cards/${path}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey,
            'Cache-Control': '3600',
          },
          body: file,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error('Upload failed: ' + (err.message || uploadRes.statusText));
      }

      // Create signed URL via direct fetch
      const signedUrlRes = await fetch(
        `${supabaseUrl}/storage/v1/object/sign/business-cards/${path}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresIn: 3600 }),
        }
      );

      const signedUrlData = signedUrlRes.ok ? await signedUrlRes.json() : null;
      const imageUrl = signedUrlData?.signedURL
        ? `${supabaseUrl}/storage/v1${signedUrlData.signedURL}`
        : path;

      setScanProgress('Scanning card with AI...');

      const ocrResponse = await fetch(`${supabaseUrl}/functions/v1/ocr-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ file_path: path, bucket: 'business-cards' }),
      });

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({}));
        if (errorData.error === 'token_limit_reached') {
          throw new Error('Out of AI tokens this month. Upgrade your plan for more.');
        }
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
          title: c.title || prev.title,
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
        const tokenInfo = ocrData.tokensUsed ? ` (${ocrData.tokensUsed} AI tokens used)` : '';
        toast.success(`Business card scanned — fields populated!${tokenInfo}`);
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
          phone: formatPhoneForStorage(formData.phone),
          title: formData.title || null,
          membership_start: formData.membership_start || null,
          membership_end: formData.membership_end || null,
        });
        toast.success('Customer updated successfully');
        onClose();
      } else {
        const newCustomer = await createCustomer({
          ...formData,
          phone: formatPhoneForStorage(formData.phone),
          title: formData.title || null,
          membership_start: formData.membership_start || null,
          membership_end: formData.membership_end || null,
          assigned_to: assignedTo || undefined,
        });

        if (!newCustomer) {
          throw new Error('Failed to create customer');
        }

        // Auto-create a linked personal record for the primary contact on a new business
        // Only for industries where business accounts have team contacts
        const TEAM_CONTACT_INDUSTRIES = [
          'general_business', 'distribution_logistics', 'contractors_home_services',
          'construction', 'agency', 'legal_services', 'real_estate', 'tax_accounting'
        ];
        const industryTemplate = currentOrganization?.industry_template || 'general_business';
        if (formData.customer_type === 'business' && TEAM_CONTACT_INDUSTRIES.includes(industryTemplate)) {
          try {
            await createChildContact(newCustomer.id, {
              first_name: formData.first_name,
              last_name: formData.last_name,
              email: formData.email,
              phone: formatPhoneForStorage(formData.phone),
              title: formData.title || null,
              is_primary: true,
            });
          } catch {
            // Non-blocking: business was still created even if child creation fails
          }
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
          title: '',
          status: 'Active',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          card_image_url: '',
        });
        setAssignedTo('');

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
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full sm:max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {customer ? 'Edit Customer' : 'New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form id="customer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Scan Business Card — shown for new customers */}
          {!customer?.id && (
            <div>
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
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Business Card Reference:</p>
              <img
                src={formData.card_image_url}
                alt="Business card"
                className="w-full max-h-32 object-contain rounded"
              />
            </div>
          )}

          {error && (
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'personal' })}
                className={`p-2.5 sm:p-4 border-2 rounded-lg text-left transition-all ${formData.customer_type === 'personal'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${formData.customer_type === 'personal'
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <User size={18} className={
                      formData.customer_type === 'personal'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Personal
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                      Individual client
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, customer_type: 'business' })}
                className={`p-2.5 sm:p-4 border-2 rounded-lg text-left transition-all ${formData.customer_type === 'business'
                  ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${formData.customer_type === 'business'
                    ? 'bg-blue-600 dark:bg-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                    <Building size={18} className={
                      formData.customer_type === 'business'
                        ? 'text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      Business
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
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

          <div className="hidden sm:block">
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
            <>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title / Role
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., President, Secretary, Manager"
                />
              </div>
            </>
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
              <option value="Active" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Active</option>
              <option value="Inactive" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Inactive</option>
              <option value="Lead" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Lead</option>
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
                    <CountrySelect
                      value={formData.country}
                      onChange={(value) => setFormData({ ...formData, country: value })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Membership dates — only for gyms/fitness industry */}
          {industry === 'gyms_fitness' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Membership Start
                </label>
                <input
                  type="date"
                  value={formData.membership_start}
                  onChange={(e) => setFormData({ ...formData, membership_start: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Membership End
                </label>
                <input
                  type="date"
                  value={formData.membership_end}
                  onChange={(e) => setFormData({ ...formData, membership_end: e.target.value })}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Assign To — only visible for owner/admin/manager, only on create */}
          {canAssign && !customer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assign To
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="" className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">Auto-assign to me</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id} className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {member.full_name || member.email}{member.full_name ? ` (${member.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="hidden sm:block pt-2 pb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <span className="mr-1">{'\u{1F4A1}'}</span>
              You can add more details (address, notes, etc.) from the customer profile page
            </p>
          </div>
        </form>

        {/* Fixed footer — outside form, uses form= attribute to submit */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-sm sm:text-base"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="customer-form"
            disabled={
              saving ||
              !formData.first_name ||
              !formData.last_name ||
              !formData.email ||
              (formData.customer_type === 'business' && !formData.company)
            }
            className="flex items-center px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <Save size={18} className="mr-1.5 sm:mr-2" />
            {saving ? 'Saving...' : customer ? 'Update' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
