import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Save, Package, DollarSign, Tag,
  Upload, X, AlertCircle, Home, Percent, Clock, Shield
} from 'lucide-react';
import { useProductStore } from '@/stores/productStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';
import type { ProductType, PricingModel, RecurringInterval } from '@/types/app.types';
import CreationSuccessModal from '@/components/shared/CreationSuccessModal';
import { Plus } from 'lucide-react';

const LOAN_TYPES = [
  { value: 'conventional', label: 'Conventional', desc: 'Standard mortgage not backed by government' },
  { value: 'fha', label: 'FHA', desc: 'Federal Housing Administration insured' },
  { value: 'va', label: 'VA', desc: 'Veterans Affairs guaranteed' },
  { value: 'usda', label: 'USDA', desc: 'Rural development guaranteed' },
  { value: 'jumbo', label: 'Jumbo', desc: 'Exceeds conforming loan limits' },
  { value: 'heloc', label: 'HELOC', desc: 'Home equity line of credit' },
  { value: 'construction', label: 'Construction', desc: 'New build or renovation financing' },
  { value: 'reverse', label: 'Reverse', desc: 'Reverse mortgage for 62+' },
  { value: 'bridge', label: 'Bridge', desc: 'Short-term between purchases' },
  { value: 'private', label: 'Private', desc: 'Private/alternative lender' },
  { value: 'variable', label: 'Variable Rate', desc: 'Adjustable rate mortgage (ARM)' },
];

const RATE_TYPES = [
  { value: 'fixed', label: 'Fixed', desc: 'Rate stays the same for the full term' },
  { value: 'variable', label: 'Variable', desc: 'Rate adjusts based on market conditions' },
  { value: 'hybrid', label: 'Hybrid', desc: 'Fixed for initial period, then adjustable' },
];

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { createProduct, updateProduct, getProductById, fetchProducts } = useProductStore();
  const { currentOrganization } = useOrganizationStore();

  const isEdit = Boolean(id);
  const isDuplicate = Boolean(location.state?.duplicate);
  const isMortgage = currentOrganization?.industry_template === 'mortgage_broker';

  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    product_type: 'product' as ProductType,
    category: '',
    price: 0,
    cost: 0,
    pricing_model: 'one_time' as PricingModel,
    recurring_interval: 'monthly' as RecurringInterval | undefined,
    recurring_interval_count: 1,
    usage_unit: '',
    tax_rate: 0,
    is_taxable: true,
    track_inventory: false,
    quantity_on_hand: 0,
    low_stock_threshold: 10,
    reorder_quantity: 50,
    weight: undefined as number | undefined,
    dimensions: '',
    estimated_duration: undefined as number | undefined,
    duration_unit: 'hours',
    deliverables: '',
    discount_type: 'fixed',
    image_url: '',
    is_active: true,
    is_featured: false,
    requires_approval: false,
    // Loan fields
    loan_type: '',
    interest_rate_type: 'fixed',
    min_rate: undefined as number | undefined,
    max_rate: undefined as number | undefined,
    min_term_months: undefined as number | undefined,
    max_term_months: undefined as number | undefined,
    min_amount: undefined as number | undefined,
    max_amount: undefined as number | undefined,
    down_payment_min_pct: undefined as number | undefined,
    insurance_required: false,
    notes: '',
  });

  useEffect(() => {
    if (isEdit && id) {
      // Make sure products are loaded
      if (!getProductById(id)) {
        fetchProducts(currentOrganization?.id);
      }
    }
  }, [id, isEdit, currentOrganization?.id, fetchProducts, getProductById]);

  useEffect(() => {
    if (isEdit && id) {
      const product = getProductById(id);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          sku: product.sku || '',
          product_type: product.product_type,
          category: product.category || '',
          price: product.price,
          cost: product.cost || 0,
          pricing_model: product.pricing_model,
          recurring_interval: product.recurring_interval,
          recurring_interval_count: product.recurring_interval_count || 1,
          usage_unit: product.usage_unit || '',
          tax_rate: product.tax_rate,
          is_taxable: product.is_taxable,
          track_inventory: product.track_inventory,
          quantity_on_hand: product.quantity_on_hand,
          low_stock_threshold: product.low_stock_threshold || 10,
          reorder_quantity: 50,
          weight: product.weight,
          dimensions: product.dimensions || '',
          estimated_duration: product.estimated_duration,
          duration_unit: product.duration_unit || 'hours',
          deliverables: product.deliverables || '',
          discount_type: product.discount_type || 'fixed',
          image_url: product.image_url || '',
          is_active: product.is_active,
          is_featured: false,
          requires_approval: product.requires_approval,
          loan_type: product.loan_type || '',
          interest_rate_type: product.interest_rate_type || 'fixed',
          min_rate: product.min_rate,
          max_rate: product.max_rate,
          min_term_months: product.min_term_months,
          max_term_months: product.max_term_months,
          min_amount: product.min_amount,
          max_amount: product.max_amount,
          down_payment_min_pct: product.down_payment_min_pct,
          insurance_required: product.insurance_required || false,
          notes: product.notes || '',
        });
      }
    } else if (isDuplicate && location.state?.duplicate) {
      const duplicate = location.state.duplicate;
      setFormData({
        ...duplicate,
        name: `${duplicate.name} (Copy)`,
        sku: '',
      });
    }
  }, [id, isEdit, isDuplicate, getProductById, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(isMortgage ? 'Loan product name is required' : 'Product name is required');
      return;
    }

    if (isMortgage && !formData.loan_type) {
      toast.error('Please select a loan type');
      return;
    }

    setSaving(true);

    try {
      // Strip fields that don't exist in the DB schema
      const { is_featured, reorder_quantity, ...cleanFormData } = formData;

      const productData = {
        ...cleanFormData,
        organization_id: currentOrganization?.id || '',
        // For mortgage, auto-set product_type to 'service' (loan products are services)
        product_type: isMortgage ? 'service' as ProductType : cleanFormData.product_type,
        // For mortgage, category is the loan type label
        category: isMortgage ? (LOAN_TYPES.find(t => t.value === cleanFormData.loan_type)?.label || cleanFormData.category) : cleanFormData.category,
      };

      if (isEdit && id) {
        await updateProduct(id, productData);
        toast.success(isMortgage ? 'Loan product updated' : 'Product updated successfully');
        navigate(-1);
      } else {
        const newProduct = await createProduct(productData);
        if (newProduct) {
          setCreatedProduct(newProduct);
          toast.success(isMortgage ? 'Loan product created' : 'Product created successfully');
          setShowSuccessModal(true);
        } else {
          navigate(-1);
        }
      }
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, image_url: url });
    }
  };

  const isLowStock = formData.track_inventory &&
    formData.quantity_on_hand !== null &&
    formData.low_stock_threshold !== null &&
    formData.quantity_on_hand <= formData.low_stock_threshold;

  const inputClasses = 'w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm';
  const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  const entityLabel = isMortgage ? 'Loan Product' : 'Product';

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEdit ? `Edit ${entityLabel}` : isDuplicate ? `Duplicate ${entityLabel}` : `New ${entityLabel}`}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {isMortgage
                  ? (isEdit ? 'Update loan product details' : 'Configure a new mortgage loan product for your catalog')
                  : (isEdit ? 'Update product information' : 'Add a new product or service to your catalog')
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : isEdit ? `Update ${entityLabel}` : `Create ${entityLabel}`}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

          {/* ====== MORTGAGE BROKER LOAN FORM ====== */}
          {isMortgage ? (
            <>
              {/* Loan Type Selection */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Home size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Loan Type
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {LOAN_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, loan_type: type.value, name: formData.name || type.label })}
                      className={`p-3 border-2 rounded-xl text-left transition-all ${formData.loan_type === type.value
                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{type.label}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{type.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Name & Description */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Package size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Product Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Product Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputClasses}
                      placeholder="e.g., 5-Year Fixed Conventional, FHA 30-Year"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={`${inputClasses} resize-none`}
                      placeholder="Key features, eligibility requirements, or selling points for this loan product"
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Internal Code / SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className={inputClasses}
                      placeholder="e.g., CONV-30F-2024"
                    />
                  </div>
                </div>
              </div>

              {/* Interest Rate Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Percent size={20} className="mr-2 text-green-600 dark:text-green-400" />
                  Interest Rate
                </h2>
                <div className="space-y-4">
                  {/* Rate Type */}
                  <div>
                    <label className={labelClasses}>Rate Type</label>
                    <div className="grid grid-cols-3 gap-3">
                      {RATE_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, interest_rate_type: type.value })}
                          className={`p-3 border-2 rounded-xl text-left transition-all ${formData.interest_rate_type === type.value
                            ? 'border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{type.label}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rate Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Min Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="30"
                          value={formData.min_rate ?? ''}
                          onChange={(e) => setFormData({ ...formData, min_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={inputClasses}
                          placeholder="e.g., 4.99"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Max Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="30"
                          value={formData.max_rate ?? ''}
                          onChange={(e) => setFormData({ ...formData, max_rate: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={inputClasses}
                          placeholder="e.g., 6.49"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {formData.min_rate != null && formData.max_rate != null && formData.min_rate > 0 && formData.max_rate > 0 && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
                      Rate range: <span className="font-bold">{formData.min_rate}%</span> &ndash; <span className="font-bold">{formData.max_rate}%</span> ({formData.interest_rate_type})
                    </div>
                  )}
                </div>
              </div>

              {/* Loan Terms & Limits */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Clock size={20} className="mr-2 text-purple-600 dark:text-purple-400" />
                  Terms & Limits
                </h2>
                <div className="space-y-4">
                  {/* Term Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Min Term (months)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_term_months ?? ''}
                        onChange={(e) => setFormData({ ...formData, min_term_months: e.target.value ? parseInt(e.target.value) : undefined })}
                        className={inputClasses}
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Max Term (months)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_term_months ?? ''}
                        onChange={(e) => setFormData({ ...formData, max_term_months: e.target.value ? parseInt(e.target.value) : undefined })}
                        className={inputClasses}
                        placeholder="e.g., 360"
                      />
                    </div>
                  </div>

                  {/* Amount Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Min Loan Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={formData.min_amount ?? ''}
                          onChange={(e) => setFormData({ ...formData, min_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={`${inputClasses} pl-8`}
                          placeholder="e.g., 50000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClasses}>Max Loan Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">$</span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={formData.max_amount ?? ''}
                          onChange={(e) => setFormData({ ...formData, max_amount: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={`${inputClasses} pl-8`}
                          placeholder="e.g., 1000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Down Payment & Insurance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClasses}>Min Down Payment (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="100"
                          value={formData.down_payment_min_pct ?? ''}
                          onChange={(e) => setFormData({ ...formData, down_payment_min_pct: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className={inputClasses}
                          placeholder="e.g., 5"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg w-full cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.insurance_required}
                          onChange={(e) => setFormData({ ...formData, insurance_required: e.target.checked })}
                          className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            <Shield size={14} className="text-blue-500" />
                            Mortgage Insurance Required
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">CMHC / Private MI</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Tag size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Notes & Status
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Internal Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className={`${inputClasses} resize-none`}
                      placeholder="Internal notes about this loan product (not shown to borrowers)"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Active</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Available for selection when creating new applications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ====== GENERIC PRODUCT FORM (non-mortgage) ====== */
            <>
              {/* Basic Information */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Package size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Basic Information
                </h2>

                <div className="space-y-4">
                  {/* Product Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'product', label: 'Product', desc: 'Physical or digital goods' },
                        { value: 'service', label: 'Service', desc: 'Time-based or project work' },
                        { value: 'bundle', label: 'Bundle', desc: 'Package of products/services' },
                      ].map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, product_type: type.value as ProductType })}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${formData.product_type === type.value
                            ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                        >
                          <p className="font-medium text-gray-900 dark:text-white mb-1">{type.label}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{type.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={inputClasses}
                      placeholder="e.g., Website Design, Consulting Service, Software License"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className={`${inputClasses} resize-none`}
                      placeholder="Detailed description of your product or service"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={inputClasses}
                      placeholder="e.g., Consulting, Design"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Image
                    </label>
                    <div className="flex items-start space-x-4">
                      {formData.image_url ? (
                        <div className="relative">
                          <img
                            src={formData.image_url}
                            alt="Product"
                            className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image_url: '' })}
                            className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                          <Package size={32} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          type="file"
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          <Upload size={18} className="mr-2" />
                          Upload Image
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Recommended: 800x800px, JPG or PNG
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product-Specific Fields */}
              {formData.product_type === 'product' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Package size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                    Product Details
                  </h2>

                  <div className="space-y-4">
                    {/* SKU */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        SKU
                      </label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className={inputClasses}
                        placeholder="SKU-001"
                      />
                    </div>

                    {/* Inventory Tracking Toggle */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center mb-3">
                        <input
                          type="checkbox"
                          id="track_inventory_inline"
                          checked={formData.track_inventory}
                          onChange={(e) => setFormData({ ...formData, track_inventory: e.target.checked })}
                          className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <label htmlFor="track_inventory_inline" className="ml-3">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Track inventory for this product
                          </span>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Monitor stock levels and get low stock alerts
                          </p>
                        </label>
                      </div>

                      {formData.track_inventory && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Current Stock
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.quantity_on_hand}
                              onChange={(e) => setFormData({ ...formData, quantity_on_hand: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Low Stock Alert
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.low_stock_threshold}
                              onChange={(e) => setFormData({ ...formData, low_stock_threshold: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Reorder Qty
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={formData.reorder_quantity}
                              onChange={(e) => setFormData({ ...formData, reorder_quantity: parseInt(e.target.value) || 0 })}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Shipping Weight & Dimensions */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weight (optional)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            value={formData.weight || ''}
                            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
                            className={inputClasses}
                            placeholder="0.00"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            lbs
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Dimensions (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.dimensions || ''}
                          onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                          className={inputClasses}
                          placeholder="e.g., 10x8x4 in"
                        />
                      </div>
                    </div>

                    {isLowStock && (
                      <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertCircle size={20} className="text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-200">
                            Low Stock Alert
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                            Current stock ({formData.quantity_on_hand}) is at or below the threshold ({formData.low_stock_threshold}). Consider reordering {formData.reorder_quantity} units.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Service-Specific Fields */}
              {formData.product_type === 'service' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Package size={20} className="mr-2 text-purple-600 dark:text-purple-400" />
                    Service Details
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pricing Model *
                      </label>
                      <select
                        value={formData.pricing_model}
                        onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value as PricingModel })}
                        className={inputClasses}
                      >
                        <option value="one_time">One-time (Project-based)</option>
                        <option value="usage_based">Usage-based (Hourly/Per Unit)</option>
                        <option value="recurring">Recurring (Subscription)</option>
                      </select>
                    </div>

                    {formData.pricing_model === 'usage_based' && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Usage Unit *
                        </label>
                        <input
                          type="text"
                          value={formData.usage_unit}
                          onChange={(e) => setFormData({ ...formData, usage_unit: e.target.value })}
                          className={inputClasses}
                          placeholder="e.g., hour, day, project, unit"
                        />
                      </div>
                    )}

                    {formData.pricing_model === 'recurring' && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Billing Interval *
                            </label>
                            <select
                              value={formData.recurring_interval || 'monthly'}
                              onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value as RecurringInterval })}
                              className={inputClasses}
                            >
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                              Interval Count
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.recurring_interval_count}
                              onChange={(e) => setFormData({ ...formData, recurring_interval_count: parseInt(e.target.value) || 1 })}
                              className={inputClasses}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Estimated Duration (optional)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          step="0.5"
                          value={formData.estimated_duration || ''}
                          onChange={(e) => setFormData({ ...formData, estimated_duration: parseFloat(e.target.value) || undefined })}
                          className={inputClasses}
                          placeholder="e.g., 2.5"
                        />
                        <select
                          value={formData.duration_unit || 'hours'}
                          onChange={(e) => setFormData({ ...formData, duration_unit: e.target.value })}
                          className={inputClasses}
                        >
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deliverables (optional)
                      </label>
                      <textarea
                        value={formData.deliverables || ''}
                        onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                        rows={3}
                        className={`${inputClasses} resize-none`}
                        placeholder="What's included in this service?"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bundle-Specific Fields */}
              {formData.product_type === 'bundle' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                    <Package size={20} className="mr-2 text-pink-600 dark:text-pink-400" />
                    Bundle Configuration
                  </h2>

                  <div className="space-y-4">
                    <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-6 border border-pink-200 dark:border-pink-800">
                      <div className="text-center">
                        <Package size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Bundle items feature coming soon
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bundle Discount Strategy
                      </label>
                      <select
                        value={formData.discount_type || 'fixed'}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        className={inputClasses}
                      >
                        <option value="fixed">Fixed amount off</option>
                        <option value="percentage">Percentage off</option>
                        <option value="custom">Custom bundle price</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <DollarSign size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Pricing
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          className={`${inputClasses} pl-8`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Cost (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.cost || ''}
                          onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                          className={`${inputClasses} pl-8`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        For margin calculations
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_taxable"
                        checked={formData.is_taxable}
                        onChange={(e) => setFormData({ ...formData, is_taxable: e.target.checked })}
                        className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="is_taxable" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Taxable
                      </label>
                    </div>

                    {formData.is_taxable && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Tax Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={formData.tax_rate}
                          onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                          className={inputClasses}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status & Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Tag size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Status & Visibility
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Active</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Product is visible and can be added to quotes/invoices
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
      <CreationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={isMortgage ? 'Loan Product Created!' : `${formData.product_type === 'service' ? 'Service' : 'Product'} Created!`}
        subtitle={isMortgage ? 'Your loan product has been added to the catalog' : `Your ${formData.product_type} has been added to the catalog`}
        itemName={createdProduct?.name || formData.name}
        actions={[
          {
            label: isMortgage ? 'Back to Loan Products' : 'Back to Catalog',
            path: '/dashboard/products',
            icon: <ArrowLeft className="w-4 h-4" />,
            variant: 'primary'
          },
          {
            label: 'Add Another',
            path: '/dashboard/products/new',
            icon: <Plus className="w-4 h-4" />,
            variant: 'secondary'
          }
        ]}
      />
    </div>
  );
}
