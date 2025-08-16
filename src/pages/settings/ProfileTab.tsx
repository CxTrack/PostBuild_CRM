import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useProfileStore } from '../../stores/profileStore';
import { useAuthStore } from '../../stores/authStore';
import { Save } from 'lucide-react';
import { formatPhoneNumber } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../../components/ConfirmationModal';

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
  const { profile, updateProfile, loading: profileLoading, error } = useProfileStore();
  const { user } = useAuthStore();
  const [phoneValue, setPhoneValue] = useState('');
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<ProfileFormData>();

  const [newPassword, setNewPassword] = useState('');
  const [passwordResetTrigger, setPasswordResetTrigger] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const navigate = useNavigate();

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      reset(profile);
      setPhoneValue(formatPhoneNumber(profile.phone || ''));
    }
  }, [profile, reset]);

  // Profile form submit
  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile');
    }
  };

  // Open password reset confirmation
  const handleResetPasswordClick = () => {
    if (!newPassword.trim()) return;
    setPasswordResetTrigger(true);
  };

  // Reset password
  const resetPassword = async () => {
    setPasswordResetTrigger(false);
    setPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setPasswordMessage(error.message);
        toast.error('Failed to change password.');
      } else {
        toast.success('Password updated! You will be logged out.');
        await supabase.auth.signOut();
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      toast.error('Unexpected error while changing password.');
    } finally {
      setPasswordLoading(false);
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

      {/* Profile Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="card bg-dark-800 border border-dark-700">
            <h3 className="text-md font-medium text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  className="input bg-dark-700 text-gray-400"
                  value={user?.email || ''}
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Company Name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Your company name"
                  {...register('company')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={phoneValue}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhoneValue(formatPhoneNumber(digits));
                    setValue('phone', digits);
                  }}
                  placeholder="(555) 555-5555"
                />
              </div>
            </div>
          </div>

          {/* Address Info */}
          <div className="card bg-dark-800 border border-dark-700">
            <h3 className="text-md font-medium text-white mb-4">Address Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123 Business St"
                  {...register('address')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                  <input type="text" className="input" placeholder="City" {...register('city')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">State/Province</label>
                  <input type="text" className="input" placeholder="State" {...register('state')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">ZIP/Postal Code</label>
                  <input type="text" className="input" placeholder="ZIP Code" {...register('zipcode')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                  <select className="input" {...register('country')}>
                    <option value="CA">Canada</option>
                    <option value="US">United States</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary flex items-center space-x-2"
            disabled={profileLoading}
          >
            {profileLoading ? (
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

      {/* Change Password Section */}
      <h3 className="text-md font-medium text-white mb-4">Account Settings</h3>
      <div className="card bg-dark-800 border border-dark-700">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          <p>Change password</p>
          <span className="text-red-500 italic text-xs">
            *For security reasons, you will be automatically logged out once your password has been successfully changed.
          </span>
        </label>

        <form className="p-4 flex items-center gap-3" onSubmit={(e) => e.preventDefault()}>
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input bg-dark-700 text-gray-400 flex-1"
            disabled={passwordLoading}
          />
          <button
            type="button"
            disabled={!newPassword.trim() || passwordLoading}
            className={`btn btn-primary flex items-center space-x-2 whitespace-nowrap ${
              !newPassword.trim() || passwordLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={handleResetPasswordClick}
          >
            {passwordLoading ? "Processing..." : "Change Password"}
          </button>
        </form>

        {passwordMessage && <p className="px-4 mt-2 text-sm text-red-400">{passwordMessage}</p>}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={passwordResetTrigger}
          onClose={() => setPasswordResetTrigger(false)}
          onConfirm={resetPassword}
          title="Change Password?"
          message="Are you sure you want to change your password? You will be logged out."
          confirmButtonText="Yes"
          cancelButtonText="No"
          isDanger={true}
        />
      </div>
    </div>
  );
};

export default ProfileTab;
