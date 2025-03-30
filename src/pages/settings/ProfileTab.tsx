import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useProfileStore } from '../../stores/profileStore';
import { useAuthStore } from '../../stores/authStore';
import { Save } from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatters';

interface ProfileFormData {
  company: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
}

const ProfileTab: React.FC = () => {
  const { profile, updateProfile, loading, error } = useProfileStore();
  const { user } = useAuthStore();
  const [phoneValue, setPhoneValue] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>();

  useEffect(() => {
    if (profile) {
      reset(profile);
      setPhoneValue(formatPhoneNumber(profile.phone));
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white mb-4">Profile Settings</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="card bg-dark-800 border border-dark-700">
            <h3 className="text-md font-medium text-white mb-4">Basic Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="input bg-dark-700 text-gray-400"
                  value={user?.email || ''}
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your company name"
                  {...register('company')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Phone
                </label>
                <input 
                  type="tel" 
                  className="input" 
                  value={phoneValue}
                  onChange={(e) => {
                    // Only allow digits
                    const digits = e.target.value.replace(/\D/g, '');
                    // Limit to 10 digits
                    const truncated = digits.slice(0, 10);
                    setPhoneValue(formatPhoneNumber(truncated));
                    // Store raw digits in form
                    register('phone').onChange({
                      target: { value: truncated, name: 'phone' }
                    });
                  }}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="card bg-dark-800 border border-dark-700">
            <h3 className="text-md font-medium text-white mb-4">Address Information</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="123 Business St"
                  {...register('address')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="City"
                    {...register('city')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    State/Province
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="State"
                    {...register('state')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    ZIP/Postal Code
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ZIP Code"
                    {...register('zipcode')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Country
                  </label>
                  <select
                    className="input"
                    {...register('country')}
                  >
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                  </select>
                </div>
              </div>
            </div>
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
                <span>Saving...</span>
              </>
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
  );
};

export default ProfileTab;