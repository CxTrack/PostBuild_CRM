import React, { useState, useMemo } from 'react';
import { X, Save, Plus, Zap, Repeat, DollarSign, CalendarDays } from 'lucide-react';
import { useDealStore } from '@/stores/dealStore';
import { useCustomerStore } from '@/stores/customerStore';
import { usePipelineConfigStore } from '@/stores/pipelineConfigStore';
import { usePageLabels } from '@/hooks/usePageLabels';
import { Card, Button } from '@/components/theme/ThemeComponents';
import toast from 'react-hot-toast';

interface QuickAddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerModal?: () => void;
}

const QuickAddDealModal: React.FC<QuickAddDealModalProps> = ({ isOpen, onClose, onOpenCustomerModal }) => {
  const { createDeal } = useDealStore();
  const { customers } = useCustomerStore();
  const { stages } = usePipelineConfigStore();
  const labels = usePageLabels('pipeline');

  const [formData, setFormData] = useState({
    title: '',
    customer_id: '',
    value: '',
    stage: '',
    expected_close_date: '',
    notes: '',
    revenue_type: 'one_time' as 'one_time' | 'recurring' | 'hybrid',
    recurring_interval: 'monthly' as 'monthly' | 'quarterly' | 'annual',
    setup_fee: '',
    recurring_amount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const availableStages = useMemo(() => {
    if (stages.length > 0) {
      return stages.filter(s => !s.is_terminal).map(s => ({
        key: s.stage_key,
        label: s.stage_label,
      }));
    }
    return [
      { key: 'lead', label: 'Lead' },
      { key: 'qualified', label: 'Qualified' },
      { key: 'proposal', label: 'Proposal' },
      { key: 'negotiation', label: 'Negotiation' },
    ];
  }, [stages]);

  // Computed total value for hybrid mode
  const computedTotalValue = useMemo(() => {
    if (formData.revenue_type === 'hybrid') {
      const setup = parseFloat(formData.setup_fee || '0');
      const recurring = parseFloat(formData.recurring_amount || '0');
      const factor = formData.recurring_interval === 'monthly' ? 12 : formData.recurring_interval === 'quarterly' ? 4 : 1;
      return setup + (recurring * factor);
    }
    return parseFloat(formData.value || '0');
  }, [formData.revenue_type, formData.setup_fee, formData.recurring_amount, formData.recurring_interval, formData.value]);

  // Set default stage on mount
  React.useEffect(() => {
    if (availableStages.length > 0 && !formData.stage) {
      setFormData(prev => ({ ...prev, stage: availableStages[0].key }));
    }
  }, [availableStages]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.customer_id) {
      toast.error('Please select a customer');
      return;
    }

    // Validate based on revenue type
    if (formData.revenue_type === 'hybrid') {
      if (!formData.recurring_amount || parseFloat(formData.recurring_amount) <= 0) {
        toast.error('Please enter a recurring amount');
        return;
      }
    } else {
      if (!formData.value || parseFloat(formData.value) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const dealValue = formData.revenue_type === 'hybrid' ? computedTotalValue : parseFloat(formData.value);

      const dealData: Record<string, any> = {
        title: formData.title.trim(),
        customer_id: formData.customer_id,
        value: dealValue,
        stage: formData.stage || 'lead',
        expected_close_date: formData.expected_close_date || undefined,
        description: formData.notes || undefined,
        revenue_type: formData.revenue_type,
      };

      if (formData.revenue_type === 'recurring') {
        dealData.recurring_interval = formData.recurring_interval;
        dealData.recurring_amount = parseFloat(formData.value);
      } else if (formData.revenue_type === 'hybrid') {
        dealData.recurring_interval = formData.recurring_interval;
        dealData.setup_fee = parseFloat(formData.setup_fee || '0');
        dealData.recurring_amount = parseFloat(formData.recurring_amount);
      }

      await createDeal(dealData);

      // Reset form
      setFormData({
        title: '',
        customer_id: '',
        value: '',
        stage: availableStages[0]?.key || 'lead',
        expected_close_date: '',
        notes: '',
        revenue_type: 'one_time',
        recurring_interval: 'monthly',
        setup_fee: '',
        recurring_amount: '',
      });
      onClose();
    } catch {
      // Error handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = 'w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all dark:text-white text-sm';

  const revenueTypes = [
    { key: 'one_time' as const, label: 'One-time', icon: DollarSign },
    { key: 'recurring' as const, label: 'Recurring', icon: Repeat },
    { key: 'hybrid' as const, label: 'Setup + Recurring', icon: CalendarDays },
  ];

  const intervalSuffix = formData.recurring_interval === 'monthly' ? '/mo' : formData.recurring_interval === 'quarterly' ? '/qtr' : '/yr';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-primary-600 to-primary-700">
          <h2 className="text-lg font-bold text-white flex items-center">
            <Zap size={20} className="mr-2" />
            Quick Add {labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title with Suggestions */}
          <div className={`relative ${showSuggestions ? 'z-40' : ''}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={inputClasses}
              placeholder={labels.titlePlaceholder || `e.g. "New ${labels.entitySingular}"`}
              autoFocus
              autoComplete="off"
            />
            {showSuggestions && labels.titleSuggestions && labels.titleSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {labels.titleSuggestions
                  .filter(s => !formData.title || s.toLowerCase().includes(formData.title.toLowerCase()))
                  .map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setFormData({ ...formData, title: suggestion });
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Customer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {labels.columns?.customer || 'Customer'} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className={`flex-1 ${inputClasses}`}
              >
                <option value="">Select a {labels.entitySingular}...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || `${customer.first_name} ${customer.last_name}`}
                  </option>
                ))}
              </select>
              {onOpenCustomerModal && (
                <button
                  type="button"
                  onClick={onOpenCustomerModal}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Add new customer"
                >
                  <Plus size={18} className="text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Revenue Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Revenue Model
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {revenueTypes.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, revenue_type: key })}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    formData.revenue_type === key
                      ? 'bg-white dark:bg-gray-700 text-primary-700 dark:text-primary-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon size={12} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Value / Hybrid Fields */}
          {formData.revenue_type === 'hybrid' ? (
            <>
              {/* Setup Fee + Recurring Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Setup Fee
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.setup_fee}
                      onChange={(e) => setFormData({ ...formData, setup_fee: e.target.value })}
                      className={`${inputClasses} pl-7`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recurring <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.recurring_amount}
                      onChange={(e) => setFormData({ ...formData, recurring_amount: e.target.value })}
                      className={`${inputClasses} pl-7 pr-12`}
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xs font-medium">
                      {intervalSuffix}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interval selector + computed total */}
              <div className="flex items-center justify-between gap-3">
                <select
                  value={formData.recurring_interval}
                  onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value as any })}
                  className={`${inputClasses} w-auto flex-shrink-0`}
                  style={{ maxWidth: '140px' }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Year 1 Total</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">${computedTotalValue.toLocaleString()}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className={`${inputClasses} pl-7`}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formData.revenue_type === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Billing Interval
                  </label>
                  <select
                    value={formData.recurring_interval}
                    onChange={(e) => setFormData({ ...formData, recurring_interval: e.target.value as any })}
                    className={inputClasses}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                  </select>
                </div>
              )}

              {formData.revenue_type === 'one_time' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stage <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    className={inputClasses}
                  >
                    {availableStages.map(stage => (
                      <option key={stage.key} value={stage.key}>
                        {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Stage (for recurring/hybrid - shown separately) */}
          {formData.revenue_type !== 'one_time' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stage <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className={inputClasses}
              >
                {availableStages.map(stage => (
                  <option key={stage.key} value={stage.key}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Expected Close Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Expected Close Date <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              className={inputClasses}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={inputClasses}
              placeholder="Any additional details..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="flex items-center">
              <Save size={16} className="mr-2" />
              {isSubmitting ? 'Creating...' : `Add ${labels.entitySingular.charAt(0).toUpperCase() + labels.entitySingular.slice(1)}`}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default QuickAddDealModal;
