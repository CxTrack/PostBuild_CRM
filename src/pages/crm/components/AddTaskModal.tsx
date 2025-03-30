import React from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCalendarStore } from '../../../stores/calendarStore';

interface AddTaskModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onSubmit }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { addEvent } = useCalendarStore();

  const handleFormSubmit = async (data: any) => {
    try {
      // Create calendar event for the task
      await addEvent({
        title: data.title,
        description: data.description || '',
        start: new Date(data.dueDate),
        end: new Date(new Date(data.dueDate).getTime() + 60 * 60000), // 1 hour duration
        type: 'task'
      });
      
      // Submit the form data
      onSubmit(data);
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Add New Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input w-full"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="input w-full"
              {...register('dueDate', { required: 'Due date is required' })}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-400">{errors.dueDate.message as string}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Priority
            </label>
            <select className="input w-full" {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assigned To
            </label>
            <select className="input w-full" {...register('assignedTo')}>
              <option value="self">Myself</option>
              <option value="team">Team</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              className="input w-full"
              rows={3}
              {...register('description')}
            ></textarea>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;