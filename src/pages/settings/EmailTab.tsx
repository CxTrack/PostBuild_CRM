import React, { useState, useEffect } from 'react';
import { Mail, Key, Server, Hash, Save, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { emailService } from '../../services/emailService';

interface EmailSettingsFormData {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

const EmailTab: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<EmailSettingsFormData>();

  // Keep track of form submission status
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSaving]);

  useEffect(() => {
    const loadEmailSettings = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const settings = await emailService.getEmailSettings(user.id);
        if (settings) {
          // Pre-fill the form with existing settings
          Object.entries(settings).forEach(([key, value]) => {
            const input = document.querySelector(`[name="${key}"]`) as HTMLInputElement;
            if (input) input.value = value;
          });
        }
      } catch (error) {
        console.error('Error loading email settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEmailSettings();
  }, [user]);

  const onSubmit = async (data: EmailSettingsFormData) => {
    if (!user) return;

    setIsSaving(true);
    try {
      await emailService.saveEmailSettings(user.id, data);
      toast.success('Email settings saved successfully');
    } catch (error) {
      console.error('Error saving email settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save email settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!user) return;

    setTestLoading(true);
    try {
      // Get form values
      const values = getValues();

      // Validate required fields
      if (!values.smtp_host || !values.smtp_port || !values.smtp_username || 
          !values.smtp_password || !values.from_email || !values.from_name) {
        toast.error('Please fill in all required email settings fields');
        return;
      }
    
      // Test email settings
      await emailService.testEmailSettings(user.id, values);
      toast.success('Test email sent successfully');
    } catch (error) {
      console.error('Error testing email settings:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to test email settings. Please verify your settings and try again.';
      toast.error(errorMessage);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white mb-4">Email Settings</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Server Settings */}
          <div className="card bg-dark-800 border border-dark-700">
            <h3 className="text-md font-medium text-white mb-4">SMTP Server Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-300 mb-1">
                  SMTP Host
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Server size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="smtp_host"
                    type="text"
                    className={`input pl-10 ${errors.smtp_host ? 'border-red-500' : ''}`}
                    placeholder="smtp.example.com"
                    {...register('smtp_host', { required: 'SMTP host is required' })}
                  />
                </div>
                {errors.smtp_host && (
                  <p className="mt-1 text-sm text-red-400">{errors.smtp_host.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-300 mb-1">
                  SMTP Port
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="smtp_port"
                    type="number"
                    className={`input pl-10 ${errors.smtp_port ? 'border-red-500' : ''}`}
                    placeholder="587"
                    {...register('smtp_port', { 
                      required: 'SMTP port is required',
                      min: { value: 1, message: 'Port must be greater than 0' },
                      max: { value: 65535, message: 'Port must be less than 65536' }
                    })}
                  />
                </div>
                {errors.smtp_port && (
                  <p className="mt-1 text-sm text-red-400">{errors.smtp_port.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="smtp_username" className="block text-sm font-medium text-gray-300 mb-1">
                  SMTP Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="smtp_username"
                    type="text"
                    className={`input pl-10 ${errors.smtp_username ? 'border-red-500' : ''}`}
                    placeholder="username@example.com"
                    {...register('smtp_username', { required: 'SMTP username is required' })}
                  />
                </div>
                {errors.smtp_username && (
                  <p className="mt-1 text-sm text-red-400">{errors.smtp_username.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-300 mb-1">
                  SMTP Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="smtp_password"
                    type="password"
                    className={`input pl-10 ${errors.smtp_password ? 'border-red-500' : ''}`}
                    placeholder="••••••••"
                    {...register('smtp_password', { required: 'SMTP password is required' })}
                  />
                </div>
                {errors.smtp_password && (
                  <p className="mt-1 text-sm text-red-400">{errors.smtp_password.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="card bg-dark-800 border border-dark-700">
            <h3 className="text-md font-medium text-white mb-4">Sender Information</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="from_email" className="block text-sm font-medium text-gray-300 mb-1">
                  From Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-gray-400" />
                  </div>
                  <input
                    id="from_email"
                    type="email"
                    className={`input pl-10 ${errors.from_email ? 'border-red-500' : ''}`}
                    placeholder="noreply@yourdomain.com"
                    {...register('from_email', { 
                      required: 'From email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.from_email && (
                  <p className="mt-1 text-sm text-red-400">{errors.from_email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="from_name" className="block text-sm font-medium text-gray-300 mb-1">
                  From Name
                </label>
                <input
                  id="from_name"
                  type="text"
                  className={`input ${errors.from_name ? 'border-red-500' : ''}`}
                  placeholder="Your Company Name"
                  {...register('from_name', { required: 'From name is required' })}
                />
                {errors.from_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.from_name.message}</p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testLoading}
                  className="btn btn-secondary w-full"
                >
                  {testLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                      Testing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Send size={16} className="mr-2" />
                      Send Test Email
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="btn btn-primary flex items-center space-x-2"
            disabled={loading || isSaving}
          >
            {(loading || isSaving) ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailTab;