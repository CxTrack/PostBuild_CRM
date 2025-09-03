import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCustomerStore } from '../../../stores/customerStore';
import { toast } from 'react-hot-toast';
import { usePipelineStore } from '../../../stores/pipelineStore';
import { useActivityStore } from '../../../stores/activitiesStore';

interface AddLeadModalProps {
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { customers, fetchCustomers } = useCustomerStore();
  const { createPipelineItem } = usePipelineStore();
  const { addActivity } = useActivityStore();

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);

      createPipelineItem({
        closing_date: null,
        closing_probability: '',
        created_at: '',
        customer_id: data.customer_id || '',
        dollar_value: '',
        id: '',
        stage: 'lead',
        updated_at: '',
        customers: null,
        final_status: null
      });

      await addActivity(`A new lead was created`, 'lead', data.customer_id);

      toast.success('Lead created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast.error('Failed to create lead');
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

export default AddLeadModal;