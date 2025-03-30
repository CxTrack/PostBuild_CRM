import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Calendar } from 'lucide-react';
import { useCalendarStore } from '../../../stores/calendarStore';
import { useCustomerStore } from '../../../stores/customerStore';
import { toast } from 'react-hot-toast';

interface AddLeadModalProps {
  onClose: () => void;
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({ onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [phoneValue, setPhoneValue] = useState('');
  const { addEvent } = useCalendarStore();
  const { createCustomer } = useCustomerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      // Create the customer/lead
      const newCustomer = await createCustomer({
        name: `${data.first_name} ${data.last_name}`,
        email: data.email,
        phone: data.phone,
        company: data.company,
        type: 'Individual',
        status: 'Active',
        notes: data.notes
      });

      // Create calendar event for follow-up
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 3); // 3 days follow-up
      
      await addEvent({
        title: `Follow up with ${newCustomer.name}`,
        description: `Follow up with new lead from ${newCustomer.company || 'N/A'}\n\nNotes: ${newCustomer.notes || 'None'}`,
        start: followUpDate,
        end: new Date(followUpDate.getTime() + 30 * 60000), // 30 min duration
        type: 'task'
      });
      
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
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
                  type="text"
                  className="input w-full"
                  {...register('last_name', { required: 'Last name is required' })}
                />
                {errors.last_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.last_name.message}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              className="input w-full"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message as string}</p>
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
              type="tel"
              className="input w-full"
              value={phoneValue}
              onChange={(e) => {
                // Only allow digits
                const digits = e.target.value.replace(/\D/g, '');
                // Limit to 10 digits
                const truncated = digits.slice(0, 10);
                // Format as (XXX) XXX-XXXX
                const formatted = truncated.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                setPhoneValue(formatted);
                // Store raw digits in form
                register('phone').onChange({
                  target: { value: truncated, name: 'phone' }
                });
              }}
              placeholder="(555) 555-5555"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Source
            </label>
            <select className="input w-full" {...register('source')}>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social">Social Media</option>
              <option value="other">Other</option>
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