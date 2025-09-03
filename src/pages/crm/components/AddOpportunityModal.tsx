import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCustomerStore } from '../../../stores/customerStore';
import { usePipelineStore } from '../../../stores/pipelineStore';
import { useActivityStore } from '../../../stores/activitiesStore';

interface AddOpportunityModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({ onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      stage: "opportunity",
      customer_id: '',
      dollar_value: '',
      closing_probability: '',
      closing_date: ''
    }
  });
  const { customers, fetchCustomers } = useCustomerStore();
  const { createPipelineItem } = usePipelineStore();
  const { probabilities } = usePipelineStore();
  const { addActivity } = useActivityStore();

  const handleFormSubmit = async (data: any) => {
    try {

      createPipelineItem(data);

      await addActivity(`Opportunity created — $ ${Number(data.dollar_value).toLocaleString('en-US')} with closing probability of ${data.closing_probability} with closing date: ${data.closing_date}`, 'opportunity', data.customer_id);

      onSubmit(data);
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Add New Opportunity</h3>
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Dollar Value <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">$</span>
              </div>
              <input
                type="number"
                className="input w-full pl-8"
                step="0.01"
                min="0"
                {...register('dollar_value', {
                  required: 'Value is required',
                  min: { value: 0, message: 'Value must be positive' }
                })}
              />
            </div>
            {errors.dollar_value && (
              <p className="mt-1 text-sm text-red-400">{errors.dollar_value.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Probability
            </label>
            <select className="input w-full" {...register('closing_probability')}>
              {probabilities.map((probability) => (
                <option key={probability} value={probability}>
                  {probability}
                </option>
              ))}</select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Expected Close Date
            </label>
            <input
              type="date"
              className="input w-full"
              {...register('closing_date')}
            />
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
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOpportunityModal;