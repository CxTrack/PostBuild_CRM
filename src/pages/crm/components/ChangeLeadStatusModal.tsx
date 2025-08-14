import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, DollarSign, Calendar } from 'lucide-react';
import { PipelineItem } from '../../../types/database.types';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { usePipelineStore } from '../../../stores/pipelineStore';

//const PHONE_REGEX = /^\d{10}$/;

interface ChangeLeadStatusModalProps {
  pipelineItem: PipelineItem;
  onClose: () => void;
}

// const formatPhoneNumber = (phone: string) => {
//   const digits = phone.replace(/\D/g, '');
//   const truncated = digits.slice(0, 10);
//   return truncated.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
// };

const ChangeLeadStatusModal: React.FC<ChangeLeadStatusModalProps> = ({ pipelineItem, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOpportunityFields, setShowOpportunityFields] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const { probabilities, updatePipelineItem } = usePipelineStore();

  const currentStage = watch('pipeline_stage');

  useEffect(() => {
    setShowOpportunityFields(currentStage === 'opportunity');
  }, [currentStage]);

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

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

      pipelineItem.stage = data.pipeline_stage;
      pipelineItem.closing_date = data.expected_close;
      pipelineItem.closing_probability = data.closing_probability;
      pipelineItem.dollar_value = data.value;
      
      await updatePipelineItem(pipelineItem);

      toast.success(
        data.pipeline_stage === 'opportunity'
          ? 'Lead converted to opportunity successfully'
          : 'Lead updated successfully'
      );
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update lead');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Add New Lead</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Choose customer:
            </label>
            <select className="input w-full" {...register('customer_id')}>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
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
            className="btn btn-primary"
          >
            {isSubmitting ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Adding...</span>
              </span>
            ) : (
              'Add Lead'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};

export default ChangeLeadStatusModal;