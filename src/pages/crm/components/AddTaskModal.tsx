import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { useCalendarStore } from '../../../stores/calendarStore';
import { useCustomerStore } from '../../../stores/customerStore';
import { Task } from '../../../types/database.types';
import { useTaskStore } from '../../../stores/taskStore';
import { useActivityStore } from '../../../stores/activitiesStore';
import { formatDateTimeUTC } from '../../../utils/formatters';

interface AddTaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSubmit: (data: any, calendarEvent: any) => void;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ task, onClose, onSubmit }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const { addEvent, updateEvent } = useCalendarStore();
  const { customers, fetchCustomers } = useCustomerStore();
  const { createTask, updateTask } = useTaskStore();
  const { addActivity } = useActivityStore();

  useEffect(() => {
    fetchCustomers();
  }, []);

  // prefill form if editing a task
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        customer_id: task.customer_id,
        due_date: new Date(task.due_date).toISOString().slice(0, 16), // format for datetime-local
        priority: task.priority,
        //assignedTo: task.assigned_to,
        description: task.description ?? '',
      });
    } else {
      reset({});
    }
  }, [task, reset]);

  const handleFormSubmit = async (data: any) => {
    try {
      let calendar: any;

      if (task && task.calendar_id) {
        
        await updateTask(data, task.id);
        await addActivity(`Task ${data.title} completed — `, 'task', data.customer_id);

        calendar = await updateEvent(task.calendar_id, {
          title: data.title,
          description: data.description || '',
          start: new Date(data.due_date),
          end: new Date(new Date(data.due_date).getTime() + 60 * 60000),
          type: 'task',
        });
        
        await addActivity(`“${data.title}” rescheduled to date ${formatDateTimeUTC(data.due_date)}`, 'calender_event', data.customer_id);        
      } else {

        calendar = await addEvent({
          title: data.title,
          description: data.description || '',
          start: new Date(data.due_date),
          end: new Date(new Date(data.due_date).getTime() + 60 * 60000),
          type: 'task',
        });

        createTask(data, calendar.id);

        await addActivity(`Task created — “${data.title}”`, 'task', data.customer_id);
        await addActivity(`“${data.title}” scheduled for date ${formatDateTimeUTC(data.due_date)}`, 'calender_event', data.customer_id);
      }

      onSubmit(data, calendar);
    } catch (error) {
      console.error('Error creating calendar event:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            {task ? 'Update Task' : 'Add New Task'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Title */}
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
              <p className="mt-1 text-sm text-red-400">
                {errors.title.message as string}
              </p>
            )}
          </div>

          {/* Customer */}
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

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              className="input w-full"
              {...register('due_date', { required: 'Due date is required' })}
            />
            {errors.due_date && (
              <p className="mt-1 text-sm text-red-400">
                {errors.due_date.message as string}
              </p>
            )}
          </div>

          {/* Priority */}
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

          {/* Assigned To */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Assigned To
            </label>
            <select className="input w-full" {...register('assignedTo')}>
              <option value="self">Myself</option>            
            </select>
          </div> */}

          {/* Description */}
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

          {/* Buttons */}
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddTaskModal;