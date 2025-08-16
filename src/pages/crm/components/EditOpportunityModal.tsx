import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, DollarSign, Calendar } from 'lucide-react';
import { PipelineItem } from '../../../types/database.types';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import { usePipelineStore } from '../../../stores/pipelineStore';

interface EditOpportunityModalProps {
  pipelineItem: PipelineItem;
  onClose: () => void;
}

const EditOpportunityModal: React.FC<EditOpportunityModalProps> = ({ pipelineItem, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { probabilities, updatePipelineItem } = usePipelineStore();

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      value: pipelineItem.dollar_value || '',
      stage: 'opportunity',
      closing_probability: pipelineItem.closing_probability || '',
      expected_close: pipelineItem.closing_date
        ? format(new Date(pipelineItem.closing_date), 'yyyy-MM-dd')
        : ''
    }
  });

  const handleFormSubmit = async (pipeline: any) => {
    try {
      setIsSubmitting(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      if (!pipeline.value || pipeline.value <= 0) {
        throw new Error('Please enter a valid opportunity value');
      }
      if (!pipeline.expected_close) {
        throw new Error('Please enter an expected close date');
      }

      pipelineItem.stage = pipeline.stage;
      pipelineItem.closing_date = pipeline.expected_close;
      pipelineItem.closing_probability = pipeline.closing_probability;
      pipelineItem.dollar_value = pipeline.value;

      await updatePipelineItem(pipelineItem);

      toast.success('Opportunity has been updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Details:</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

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
                    value: pipelineItem.dollar_value,
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
              <select className="input w-full" {...register('closing_probability')}>
                {probabilities.map((probability) => (
                  <option key={probability} value={probability}>
                    {probability}
                  </option>
                ))}</select>
              {errors.value && (
                <p className="mt-1 text-sm text-red-400">{errors.value.message}</p>
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
                    value: pipelineItem.closing_date!,
                  })}
                />
              </div>
              {errors.expected_close && (
                <p className="mt-1 text-sm text-red-400">{errors.expected_close.message}</p>
              )}
            </div>
          </div>


          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              className="input w-full"
              rows={3}
              {...register('notes')}
            ></textarea>
          </div> */}

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

export default EditOpportunityModal;