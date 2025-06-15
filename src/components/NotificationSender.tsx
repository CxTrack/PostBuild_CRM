import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';

interface NotificationData {
  title: string;
  message: string;
}

const NotificationSender: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { notifyAll } = useNotificationStore();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<NotificationData>({
    defaultValues: {
      title: '',
      message: '',
    }
  });

  const onSubmit = async (data: NotificationData) => {
    setLoading(true);
    try {
      const notificationData = {
        ...data,
        title: data.title.trim(),
        message: data.message.trim(),
      };

      await notifyAll(notificationData.title, notificationData.message);
      toast.success('Notification has been sent to all users.');
      reset(); // reset form after success

    } catch (err) {
      console.error('Error sending notification:', err);
      toast.error('Failed to send notification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/customers" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">
          Send Notification
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card bg-dark-800 border border-dark-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Notification Details</h2>

          {/* Title */}
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className="input w-full"
              placeholder="Title"
              {...register('title', { required: 'Title is required' })}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Message */}
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              className="input w-full"
              placeholder="Enter message"
              rows={4}
              {...register('message', { required: 'Message is required' })}
            />
            {errors.message && (
              <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="btn btn-primary flex items-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Send Notification</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSender;
