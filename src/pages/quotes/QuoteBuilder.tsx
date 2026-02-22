import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useCustomerStore } from '@/stores/customerStore';
import { useProductStore } from '@/stores/productStore';
import { quoteService, QuoteLineItem, QuoteFormData, RealEstateProposalFields } from '@/services/quote.service';
import { settingsService } from '@/services/settings.service';
import { pdfService } from '@/services/pdf.service';
import { Plus, Minus, Trash2, GripVertical, Save, X, Loader2, Package, Briefcase, Check, Home, MapPin, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ProductSelector from '@/components/products/ProductSelector';
import ShareDropdown, { ShareOption } from '@/components/share/ShareDropdown';
import ShareModal from '@/components/share/ShareModal';
import QuickAddCustomerModal from '@/components/shared/QuickAddCustomerModal';
import CreationSuccessModal from '@/components/shared/CreationSuccessModal';
import { User, ArrowLeft } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { getSafeErrorMessage } from '@/utils/errorHandler';
import { getCustomerFullName } from '@/utils/customer.utils';
import { usePageLabels } from '@/hooks/usePageLabels';
import { getQuoteFieldLabels, getInvoiceFieldLabels } from '@/config/modules.config';
import { PAYMENT_TERMS_OPTIONS, calculateDueDate } from '@/config/paymentTerms';

export default function QuoteBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentOrganization, demoMode, getOrganizationId } = useOrganizationStore();
  const labels = usePageLabels('quotes');
  const { customers, fetchCustomers } = useCustomerStore();
  const { products, fetchProducts, createProduct } = useProductStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalTab, setShareModalTab] = useState<'email' | 'link' | 'pdf' | 'sms'>('link');
  const [savedQuote, setSavedQuote] = useState<any>(null);
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [catalogPromptItem, setCatalogPromptItem] = useState<{ index: number; name: string } | null>(null);
  const { user } = useAuthContext();
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);
  const [orgTaxRate, setOrgTaxRate] = useState<number>(0);
  const [orgTaxLabel, setOrgTaxLabel] = useState<string>('Tax');
  const [quoteTaxRate, setQuoteTaxRate] = useState<number>(0);

  const [formData, setFormData] = useState<QuoteFormData>({
    customer_id: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: null,
    quote_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [],
    subtotal: 0,
    discount_amount: 0,
    discount_percentage: 0,
    tax_amount: 0,
    total_amount: 0,
    payment_terms: '',
    notes: '',
    terms: '',
    status: 'draft',
    custom_fields: {},
  });

  // Check if industry is real estate for showing property-specific fields
  const isRealEstate = currentOrganization?.industry_template === 'real_estate';

  // Get industry-specific field labels for the Quote Details section
  const fieldLabels = getQuoteFieldLabels(currentOrganization?.industry_template || 'general_business');
  const customerFieldLabels = getInvoiceFieldLabels(currentOrganization?.industry_template || 'general_business');

  // Helper to update real estate property fields
  const updatePropertyField = <K extends keyof RealEstateProposalFields>(
    field: K,
    value: RealEstateProposalFields[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [field]: value,
      },
    }));
  };

  // Get property fields from custom_fields
  const propertyFields = (formData.custom_fields || {}) as RealEstateProposalFields;

  // Calculate commission when listing price or rate changes
  const calculateCommission = (listingPrice?: number, commissionRate?: number) => {
    if (listingPrice && commissionRate) {
      const commissionAmount = (listingPrice * commissionRate) / 100;
      updatePropertyField('commission_amount', commissionAmount);
    }
  };

  useEffect(() => {
    if (currentOrganization) {
      fetchCustomers();
      fetchProducts();
      loadSettings();
      if (id) {
        loadQuote();
      }
    }
  }, [currentOrganization, id]);

  useEffect(() => {
    const customerId = searchParams.get('customer');
    if (customerId && customers.length > 0 && !formData.customer_id) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customer_id: customer.id,
          customer_name: getCustomerFullName(customer),
          customer_email: customer.email || '',
          customer_phone: customer.phone || '',
          customer_address: {
            street: customer.address,
            city: customer.city,
            state: customer.state,
            postal_code: customer.postal_code,
            country: customer.country,
          },
        }));
      }
    }
  }, [searchParams, customers, formData.customer_id]);

  const loadSettings = async () => {
    if (!currentOrganization) return;
    try {
      const [settings, orgInfo] = await Promise.all([
        settingsService.getBusinessSettings(currentOrganization.id),
        settingsService.getOrganizationForPDFWithTemplate(currentOrganization.id, 'quote')
      ]);
      setOrganizationInfo(orgInfo);
      if (settings) {
        if (settings.default_payment_terms) {
          setFormData(prev => ({ ...prev, payment_terms: settings.default_payment_terms }));
        }
        if (settings.default_tax_rate) {
          setOrgTaxRate(settings.default_tax_rate);
          setOrgTaxLabel(settings.tax_label || 'Tax');
          if (!id) {
            setQuoteTaxRate(settings.default_tax_rate);
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const loadQuote = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const organizationId = getOrganizationId();
      const quote = await quoteService.getQuote(id, organizationId);
      if (quote) {
        setFormData({
          customer_id: quote.customer_id,
          customer_name: quote.customer_name,
          customer_email: quote.customer_email || '',
          customer_phone: quote.customer_phone || '',
          customer_address: quote.customer_address,
          quote_date: quote.quote_date,
          expiry_date: quote.expiry_date || '',
          items: quote.items,
          subtotal: quote.subtotal,
          discount_amount: quote.discount_amount || 0,
          discount_percentage: quote.discount_percentage || 0,
          tax_amount: quote.tax_amount,
          total_amount: quote.total_amount,
          payment_terms: quote.payment_terms || '',
          notes: quote.notes || '',
          terms: quote.terms || '',
          status: quote.status,
          custom_fields: (quote as any).custom_fields || {},
        });
        setSavedQuote(quote);
      }
    } catch (error) {
      toast.error('Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: getCustomerFullName(customer),
        customer_email: customer.email || '',
        customer_phone: customer.phone || '',
        customer_address: {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          postal_code: customer.postal_code,
          country: customer.country,
        },
      }));
    }
  };

  const handleCustomerCreated = (newCustomer: any) => {
    setFormData(prev => ({
      ...prev,
      customer_id: newCustomer.id,
      customer_name: getCustomerFullName(newCustomer),
      customer_email: newCustomer.email || '',
      customer_phone: newCustomer.phone || '',
      customer_address: {
        street: newCustomer.address,
        city: newCustomer.city,
        state: newCustomer.state || newCustomer.province,
        postal_code: newCustomer.postal_code,
        country: newCustomer.country,
      },
    }));
    fetchCustomers();
  };

  const addLineItem = () => {
    const newItem: QuoteLineItem = {
      product_type: undefined,
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_amount: 0,
      tax_rate: 0,
      line_total: 0,
      sort_order: formData.items.length,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const addProductFromCatalog = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const newItem: QuoteLineItem = {
      product_id: product.id,
      product_type: product.product_type,
      product_name: product.name,
      description: product.description || '',
      quantity: 1,
      unit_price: product.price,
      discount_amount: 0,
      tax_rate: product.tax_rate || 0,
      line_total: product.price,
      sort_order: formData.items.length,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    calculateTotals([...formData.items, newItem]);
    setShowProductCatalog(false);
  };

  const handleItemBlur = (index: number) => {
    const item = formData.items[index];

    if (!item.product_type) return;
    if (!item.product_name || !item.product_name.trim()) return;
    if (!item.unit_price || item.unit_price <= 0) return;
    if (item.product_id) return;

    // Check if a product with this name already exists in the catalog
    const existsInCatalog = products.some(
      p => p.name.toLowerCase() === item.product_name.trim().toLowerCase()
    );
    if (existsInCatalog) return;

    // Show prompt asking if user wants to save to catalog
    setCatalogPromptItem({ index, name: item.product_name.trim() });
  };

  const handleSaveToCatalog = async () => {
    if (!catalogPromptItem) return;
    const item = formData.items[catalogPromptItem.index];
    if (!item) {
      setCatalogPromptItem(null);
      return;
    }

    try {
      const organizationId = getOrganizationId();
      const newProduct = await createProduct({
        organization_id: organizationId,
        name: item.product_name.trim(),
        description: item.description?.trim() || '',
        product_type: item.product_type,
        price: item.unit_price,
        sku: '',
        is_active: true,
        pricing_model: 'one_time',
        tax_rate: item.tax_rate || 0,
        is_taxable: (item.tax_rate || 0) > 0,
        track_inventory: item.product_type === 'product',
        quantity_on_hand: 0,
        requires_approval: false,
      });

      if (newProduct) {
        updateLineItem(catalogPromptItem.index, 'product_id', newProduct.id);
        toast.success(`"${item.product_name}" added to your catalog`);
      }
    } catch (error: any) {
      toast.error(getSafeErrorMessage(error, 'create'));
    } finally {
      setCatalogPromptItem(null);
    }
  };

  const updateLineItem = (index: number, field: keyof QuoteLineItem, value: any) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const item = updatedItems[index];
      updatedItems[index].line_total = item.quantity * item.unit_price;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const removeLineItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: updatedItems }));
    calculateTotals(updatedItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const items = [...formData.items];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);

    const reorderedItems = items.map((item, i) => ({ ...item, sort_order: i }));
    setFormData(prev => ({ ...prev, items: reorderedItems }));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const calculateTotals = (items: QuoteLineItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = items.reduce((sum, item) => {
      const taxRate = item.tax_rate || 0;
      return sum + (item.line_total * (taxRate / 100));
    }, 0);
    const total = subtotal + taxAmount - (formData.discount_amount || 0);

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total,
    }));
  };

  const handleSaveDraft = async () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    try {
      setSaving(true);

      if (id) {
        const organizationId = getOrganizationId();
        await quoteService.updateQuote(id, { ...formData, status: 'draft' }, organizationId);
        const quote = await quoteService.getQuote(id, organizationId);
        setSavedQuote(quote);
        toast.success('Quote saved as draft');
      } else {
        const organizationId = getOrganizationId();
        if (!user) {
          toast.error('You must be logged in to save a quote');
          return;
        }
        const quote = await quoteService.createQuote(
          organizationId,
          user.id,
          { ...formData, status: 'draft' }
        );
        setSavedQuote(quote);
        toast.success('Quote saved as draft');
        window.history.replaceState(null, '', `/quotes/builder/${quote.id}`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to save quote. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    if (formData.total_amount <= 0) {
      toast.error('Quote total must be greater than zero');
      return;
    }

    try {
      setSaving(true);

      if (id) {
        const organizationId = getOrganizationId();
        await quoteService.updateQuote(id, { ...formData, status: 'sent' }, organizationId);
        const quote = await quoteService.getQuote(id, organizationId);
        setSavedQuote(quote);
        toast.success('Quote finalized successfully');
      } else {
        const organizationId = getOrganizationId();
        if (!user) {
          toast.error('You must be logged in to create a quote');
          return;
        }
        const quote = await quoteService.createQuote(
          organizationId,
          user.id,
          { ...formData, status: 'sent' }
        );
        setSavedQuote(quote);
        toast.success('Quote created successfully');
        setShowSuccessModal(true);
        window.history.replaceState(null, '', `/quotes/builder/${quote.id}`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to create quote. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleShareOption = async (option: ShareOption) => {
    if (!savedQuote) {
      toast.error('Please create the quote first');
      return;
    }

    if (option === 'pdf') {
      if (!currentOrganization) {
        toast.error('Organization not available');
        return;
      }
      try {

        const organizationInfo = await settingsService.getOrganizationForPDFWithTemplate(currentOrganization.id, 'quote');

        await pdfService.generateQuotePDF(savedQuote, organizationInfo);
        toast.success('Quote PDF downloaded');
      } catch (error) {
        toast.error('Failed to generate PDF');
      }
      return;
    }

    setShareModalTab(option);
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-[1920px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {id ? `Edit ${labels.entitySingular}` : `New ${labels.entitySingular}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Build a professional {labels.entitySingular} for your {customerFieldLabels.customerLabel.toLowerCase()}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </Button>
            <ShareDropdown
              onSelect={handleShareOption}
              disabled={!savedQuote}
              buttonText="Share"
              variant="secondary"
            />
            {demoMode && (
              <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 text-sm font-medium rounded-lg border border-amber-300 dark:border-amber-700">
                Demo Mode
              </div>
            )}
            <Button
              onClick={handleCreate}
              disabled={
                saving ||
                !formData.customer_id ||
                formData.items.length === 0 ||
                formData.total_amount <= 0
              }
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {id ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                id ? `Update ${labels.entitySingular}` : `Create ${labels.entitySingular}`
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Seller/Customer Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {customerFieldLabels.customerLabel}
              </h2>
              <div className="flex gap-2">
                <select
                  value={formData.customer_id}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">{customerFieldLabels.customerPlaceholder}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      {getCustomerFullName(customer)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowQuickAddCustomer(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap font-medium"
                >
                  <Plus size={18} />
                  Quick Add
                </button>
              </div>
            </div>

            {/* Real Estate Property Details Section */}
            {isRealEstate && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Home size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Property Details</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Information about the listing</p>
                  </div>
                </div>

                {/* Property Address */}
                <div className="space-y-4">
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin size={18} className="text-gray-400 mt-2.5" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Property Address
                        </label>
                        <Input
                          type="text"
                          value={propertyFields.property_address || ''}
                          onChange={(e) => updatePropertyField('property_address', e.target.value)}
                          placeholder="123 Main Street"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          City
                        </label>
                        <Input
                          type="text"
                          value={propertyFields.property_city || ''}
                          onChange={(e) => updatePropertyField('property_city', e.target.value)}
                          placeholder="City"
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State
                          </label>
                          <Input
                            type="text"
                            value={propertyFields.property_state || ''}
                            onChange={(e) => updatePropertyField('property_state', e.target.value)}
                            placeholder="CA"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            ZIP
                          </label>
                          <Input
                            type="text"
                            value={propertyFields.property_zip || ''}
                            onChange={(e) => updatePropertyField('property_zip', e.target.value)}
                            placeholder="90210"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Type & Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Property Type
                      </label>
                      <select
                        value={propertyFields.property_type || ''}
                        onChange={(e) => updatePropertyField('property_type', e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="single_family">Single Family</option>
                        <option value="condo">Condo</option>
                        <option value="townhouse">Townhouse</option>
                        <option value="multi_family">Multi-Family</option>
                        <option value="land">Land</option>
                        <option value="commercial">Commercial</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bedrooms
                      </label>
                      <Input
                        type="number"
                        value={propertyFields.bedrooms || ''}
                        onChange={(e) => updatePropertyField('bedrooms', parseInt(e.target.value) || undefined)}
                        placeholder="3"
                        className="text-sm"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bathrooms
                      </label>
                      <Input
                        type="number"
                        value={propertyFields.bathrooms || ''}
                        onChange={(e) => updatePropertyField('bathrooms', parseFloat(e.target.value) || undefined)}
                        placeholder="2"
                        className="text-sm"
                        min="0"
                        step="0.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Square Feet
                      </label>
                      <Input
                        type="number"
                        value={propertyFields.square_feet || ''}
                        onChange={(e) => updatePropertyField('square_feet', parseInt(e.target.value) || undefined)}
                        placeholder="2,000"
                        className="text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Pricing & Commission */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <DollarSign size={14} />
                        Listing Price
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          value={propertyFields.listing_price || ''}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || undefined;
                            updatePropertyField('listing_price', price);
                            calculateCommission(price, propertyFields.commission_rate);
                          }}
                          placeholder="500,000"
                          className="text-sm pl-7"
                          min="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                        <Percent size={14} />
                        Commission Rate
                      </label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={propertyFields.commission_rate || ''}
                          onChange={(e) => {
                            const rate = parseFloat(e.target.value) || undefined;
                            updatePropertyField('commission_rate', rate);
                            calculateCommission(propertyFields.listing_price, rate);
                          }}
                          placeholder="6"
                          className="text-sm pr-8"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimated Commission
                      </label>
                      <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 font-semibold">
                        ${propertyFields.commission_amount?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>

                  {/* Listing Terms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Listing Type
                      </label>
                      <select
                        value={propertyFields.listing_type || ''}
                        onChange={(e) => updatePropertyField('listing_type', e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select...</option>
                        <option value="exclusive">Exclusive Right to Sell</option>
                        <option value="open">Open Listing</option>
                        <option value="net">Net Listing</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Listing Duration (months)
                      </label>
                      <Input
                        type="number"
                        value={propertyFields.listing_duration || ''}
                        onChange={(e) => updatePropertyField('listing_duration', parseInt(e.target.value) || undefined)}
                        placeholder="6"
                        className="text-sm"
                        min="1"
                        max="24"
                      />
                    </div>
                  </div>

                  {/* Property Highlights */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Property Highlights
                    </label>
                    <textarea
                      value={propertyFields.property_highlights || ''}
                      onChange={(e) => updatePropertyField('property_highlights', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white text-sm"
                      placeholder="Describe the key selling points of this property..."
                    />
                  </div>

                  {/* Marketing Plan */}
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Marketing Plan
                    </label>
                    <textarea
                      value={propertyFields.marketing_plan || ''}
                      onChange={(e) => updatePropertyField('marketing_plan', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white text-sm"
                      placeholder="Outline your marketing strategy: professional photos, virtual tour, open houses, online listings, print materials, etc."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Services & Fees Section (replaces Line Items for non-real estate, or supplementary for real estate) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRealEstate ? 'Additional Services & Fees' : 'Line Items'}
                </h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowProductCatalog(!showProductCatalog)}>
                    <Plus className="w-4 h-4 mr-2" />
                    From Catalog
                  </Button>
                  <Button size="sm" onClick={addLineItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </div>

              <ProductSelector
                isOpen={showProductCatalog}
                onClose={() => setShowProductCatalog(false)}
                onSelect={(product) => addProductFromCatalog(product.id)}
                organizationId={currentOrganization?.id}
              />

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-gray-200 dark:border-gray-700 relative group"
                  >
                    <div className="absolute left-2 top-6 cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>

                    <div className="ml-8 space-y-3">
                      {/* Row 1: Type Selector */}
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Type: *
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateLineItem(index, 'product_type', 'product')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${item.product_type === 'product'
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                              }`}
                          >
                            <Package size={18} />
                            <span className="font-medium">Product</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateLineItem(index, 'product_type', 'service')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${item.product_type === 'service'
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                              }`}
                          >
                            <Briefcase size={18} />
                            <span className="font-medium">Service</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowProductCatalog(true)}
                          className="ml-auto px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium text-sm"
                        >
                          From Catalog
                        </button>
                      </div>

                      {/* Row 2: Main Fields */}
                      <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Item Name *
                          </label>
                          <Input
                            type="text"
                            value={item.product_name}
                            onChange={(e) => updateLineItem(index, 'product_name', e.target.value)}
                            onBlur={() => handleItemBlur(index)}
                            placeholder={item.product_type === 'product' ? 'Product name' : item.product_type === 'service' ? 'Service name' : 'Select type first'}
                            className="text-sm"
                            disabled={!item.product_type}
                          />
                          {!item.product_type && item.product_name === '' && (
                            <p className="text-xs text-red-600 mt-1">
                              → Select type first
                            </p>
                          )}
                        </div>

                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Qty *
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = Math.max(1, item.quantity - 1);
                                updateLineItem(index, 'quantity', newQty);
                              }}
                              disabled={!item.product_type || item.quantity <= 1}
                              className={`
                              p-2 rounded-lg transition-colors flex-shrink-0
                              ${!item.product_type || item.quantity <= 1
                                  ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }
                            `}
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = Math.max(1, parseFloat(e.target.value) || 1);
                                updateLineItem(index, 'quantity', newQty);
                              }}
                              placeholder="1"
                              className={`
                              w-16 px-2 py-2 rounded-lg border-2 text-sm text-center font-semibold
                              bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600
                              text-gray-900 dark:text-white
                              focus:border-blue-500 focus:outline-none
                              [appearance:textfield]
                              [&::-webkit-outer-spin-button]:appearance-none
                              [&::-webkit-inner-spin-button]:appearance-none
                              disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                              min="1"
                              step="1"
                              disabled={!item.product_type}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newQty = item.quantity + 1;
                                updateLineItem(index, 'quantity', newQty);
                              }}
                              disabled={!item.product_type}
                              className={`
                              p-2 rounded-lg transition-colors flex-shrink-0
                              ${!item.product_type
                                  ? 'opacity-30 cursor-not-allowed bg-gray-100 dark:bg-gray-800'
                                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                                }
                            `}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="col-span-3">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unit Price *
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              onBlur={() => handleItemBlur(index)}
                              placeholder="0.00"
                              className="w-full px-2 py-2 rounded-lg border-2 text-sm text-right pl-7 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min="0"
                              step="0.01"
                              disabled={!item.product_type}
                            />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Total
                          </label>
                          <div className="flex items-center justify-end h-[42px]">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${item.line_total.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="col-span-1 flex items-end justify-end pb-2">
                          <button
                            onClick={() => removeLineItem(index)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 rounded transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Row 3: Description */}
                      <div>
                        <Input
                          type="text"
                          value={item.description || ''}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="text-sm"
                          disabled={!item.product_type}
                        />
                      </div>

                      {/* Save Indicator */}
                      {item.product_id && (
                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                          <Check size={14} />
                          <span>Saved to catalog</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {formData.items.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No items added yet. Click "Add Item" to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Internal)
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder={customerFieldLabels.notesPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={formData.terms || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Terms and conditions..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Logo & Branding Preview */}
            {organizationInfo?.logo_url && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3">
                <img
                  src={organizationInfo.logo_url}
                  alt="Company logo"
                  className="w-10 h-10 object-contain rounded"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{organizationInfo.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Logo will appear on PDF</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{fieldLabels.sectionTitle}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {fieldLabels.dateLabel}
                  </label>
                  <Input
                    type="date"
                    value={formData.quote_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, quote_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {fieldLabels.expiryLabel}
                  </label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>
                {fieldLabels.showTermsField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {fieldLabels.termsLabel}
                    </label>
                    <select
                      value={PAYMENT_TERMS_OPTIONS.find(o => o.key === formData.payment_terms) ? formData.payment_terms : (formData.payment_terms ? 'custom' : '')}
                      onChange={(e) => {
                        const selectedKey = e.target.value;
                        setFormData(prev => ({ ...prev, payment_terms: selectedKey }));
                      }}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    >
                      <option value="">Select payment terms...</option>
                      {PAYMENT_TERMS_OPTIONS.map(option => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </select>
                    {formData.payment_terms === 'custom' && (
                      <Input
                        type="text"
                        value={formData.payment_terms === 'custom' ? '' : formData.payment_terms}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: e.target.value || 'custom' }))}
                        placeholder={fieldLabels.termsPlaceholder}
                        className="mt-2"
                      />
                    )}
                    {formData.payment_terms && PAYMENT_TERMS_OPTIONS.find(o => o.key === formData.payment_terms) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {PAYMENT_TERMS_OPTIONS.find(o => o.key === formData.payment_terms)?.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formData.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discount</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.discount_amount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, discount_amount: discount }));
                        calculateTotals(formData.items);
                      }}
                      className="w-24 px-2 py-2 rounded-lg border-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400">{orgTaxLabel || 'Tax'}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={quoteTaxRate}
                        onChange={(e) => {
                          const rate = parseFloat(e.target.value) || 0;
                          setQuoteTaxRate(rate);
                          const updatedItems = formData.items.map(item => ({ ...item, tax_rate: rate }));
                          setFormData(prev => ({ ...prev, items: updatedItems }));
                          calculateTotals(updatedItems);
                        }}
                        className="w-20 px-2 py-2 rounded-lg border-2 text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="0"
                      />
                      <span className="text-gray-400 text-xs">%</span>
                    </div>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${formData.tax_amount.toFixed(2)}
                  </span>
                </div>
                {!id && quoteTaxRate === 0 && orgTaxRate === 0 && (
                  <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      No default tax rate configured.{' '}
                      <button type="button" onClick={() => navigate('/settings')} className="underline hover:no-underline font-medium">
                        Set it in Business Settings
                      </button>{' '}
                      to auto-apply on new documents.
                    </p>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                    <span className="text-lg font-bold text-blue-600">
                      ${formData.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-8" />

        {savedQuote && currentOrganization && user && organizationInfo && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            documentType="quote"
            document={savedQuote}
            organizationId={currentOrganization.id}
            userId={user.id}
            organizationInfo={organizationInfo}
            initialTab={shareModalTab}
          />
        )}

        <QuickAddCustomerModal
          isOpen={showQuickAddCustomer}
          onClose={() => setShowQuickAddCustomer(false)}
          onCustomerCreated={handleCustomerCreated}
        />

        <CreationSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Quote Created!"
          subtitle="Your quote has been saved successfully"
          itemName={formData.customer_name}
          itemNumber={savedQuote?.quote_number}
          actions={[
            {
              label: 'Back to All Quotes',
              path: '/quotes',
              icon: <ArrowLeft className="w-4 h-4" />,
              variant: 'primary'
            },
            {
              label: 'View Customer Profile',
              path: `/dashboard/customers/${formData.customer_id}`,
              icon: <User className="w-4 h-4" />,
              variant: 'secondary'
            }
          ]}
        />

        {/* Save to Catalog Prompt */}
        {catalogPromptItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save to Catalog?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">For quick access next time</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                <span className="font-medium text-gray-900 dark:text-white">"{catalogPromptItem.name}"</span> isn't in your catalog yet. Would you like to save it for quick access on future proposals?
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCatalogPromptItem(null)}
                >
                  No Thanks
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveToCatalog}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Save to Catalog
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
