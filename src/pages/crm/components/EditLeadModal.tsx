import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, DollarSign, Calendar } from 'lucide-react';
import { Customer, PipelineItem } from '../../../types/database.types';
import { toast } from 'react-hot-toast';
import { useCustomerStore } from '../../../stores/customerStore';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';

const PHONE_REGEX = /^\d{10}$/;

interface EditLeadModalProps {
  pipelineItem: PipelineItem;
  onClose: () => void;
}

const formatPhoneNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  const truncated = digits.slice(0, 10);
  return truncated.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
};

interface OpportunityDetails {
  value: number;
  probability: number;
  expected_close: string;
}

const EditLeadModal: React.FC<EditLeadModalProps> = ({ pipelineItem, onClose }) => {
  const { updateCustomer } = useCustomerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneValue, setPhoneValue] = useState(lead.phone || '');
  const [showOpportunityFields, setShowOpportunityFields] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      first_name: lead.name.split(' ')[0],
      last_name: lead.name.split(' ').slice(1).join(' '),
      email: lead.email || '',
      company: lead.company || '',
      phone: lead.phone || '',
      type: lead.type || 'Individual',
      notes: lead.notes || '',
      pipeline_stage: lead.pipeline_stage || 'lead',
      value: '',
      probability: 50,
      expected_close: format(new Date().setDate(new Date().getDate() + 30), 'yyyy-MM-dd')
    }
  });

  const currentStage = watch('pipeline_stage');

  useEffect(() => {
    setShowOpportunityFields(currentStage === 'opportunity');
  }, [currentStage]);

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Get the current user's ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Validate opportunity fields if converting to opportunity
      if (data.pipeline_stage === 'opportunity') {
        if (!data.value || data.value <= 0) {
          throw new Error('Please enter a valid opportunity value');
        }
        if (!data.expected_close) {
          throw new Error('Please enter an expected close date');
        }
      }

      await updateCustomer(pipelineItem.id, {
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        company: data.company,
        type: data.type,
        notes: data.notes,
        pipeline_stage: data.pipeline_stage,
        ...(data.pipeline_stage === 'opportunity' && {
          opportunity_value: parseFloat(data.value),
          opportunity_probability: data.probability,
          opportunity_close_date: data.expected_close
        })
      });

      toast.success(
        data.pipeline_stage === 'opportunity' 
          ? 'Lead converted to opportunity successfully' 
          : 'Lead updated successfully'
      );
      onClose();
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error(error.message || 'Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Edit Lead</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="First Name"
                type="text"
                className="input w-full"
                {...register('first_name', { required: 'First name is required' })}
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-400">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                aria-label="Last Name"
                type="text"
                className="input w-full"
                {...register('last_name', { required: 'Last name is required' })}
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-400">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              className="input w-full"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Company
            </label>
            <input
              type="text"
              className="input w-full"
              {...register('company')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              aria-label="Phone Number"
              type="tel"
              className="input w-full"
              value={phoneValue}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '');
                const truncated = digits.slice(0, 10);
                const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                setPhoneValue(formatted);
                register('phone').onChange({
                  target: { value: truncated, name: 'phone' }
                });
              }}
              {...register('phone', {
                pattern: {
                  value: PHONE_REGEX,
                  message: 'Please enter a valid 10-digit phone number'
                }
              })}
              placeholder="(555) 555-5555"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pipeline Stage
            </label>
            <select 
              aria-label="Pipeline Stage"
              className="input w-full"
              {...register('pipeline_stage')}
            >
              <option value="lead">Lead</option>
              <option value="opportunity">Convert to Opportunity</option>
              {/* <option value="quote">Quote</option>
              <option value="invoice_pending">Invoice Pending</option>
              <option value="invoice_sent">Invoice Sent</option>
              <option value="closed_won">Closed Won</option>
              <option value="closed_lost">Closed Lost</option> */}
            </select>
          </div>

          {showOpportunityFields && (
            <div className="space-y-4 mt-4 p-4 bg-dark-700/50 rounded-lg border border-dark-600">
              <h4 className="text-sm font-medium text-white">Opportunity Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input pl-8"
                    placeholder="0.00"
                    {...register('value', {
                      required: showOpportunityFields ? 'Value is required' : false,
                      min: { value: 0, message: 'Value must be positive' }
                    })}
                  />
                </div>
                {errors.value && (
                  <p className="mt-1 text-sm text-red-400">{errors.value.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Probability (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="input"
                  {...register('probability', {
                    min: { value: 0, message: 'Minimum probability is 0%' },
                    max: { value: 100, message: 'Maximum probability is 100%' }
                  })}
                />
                {errors.probability && (
                  <p className="mt-1 text-sm text-red-400">{errors.probability.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Expected Close Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    className="input pl-8"
                    {...register('expected_close', {
                      required: showOpportunityFields ? 'Expected close date is required' : false
                    })}
                  />
                </div>
                {errors.expected_close && (
                  <p className="mt-1 text-sm text-red-400">{errors.expected_close.message}</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select 
              className="input w-full"
              {...register('type')}
            >
              <option value="Individual">Individual</option>
              <option value="Business">Business</option>
              <option value="Government">Government</option>
              <option value="Non-Profit">Non-Profit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              className="input w-full"
              rows={3}
              {...register('notes')}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary flex items-center space-x-2 relative"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="block w-5 h-5">
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    </span>
                  </span>
                  <span>Saving...</span>
                </span>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;