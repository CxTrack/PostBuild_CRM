import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword, loading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>();
  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    clearError();
    try {
      // Get access token from URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');

      if (!accessToken) {
        throw new Error('Invalid or expired reset link');
      }

      await updatePassword(accessToken, data.password);
      toast.success('Password reset successfully', {
        style: {
          background: '#1a1a1a',
          color: '#FFD700',
          border: '1px solid rgba(255,215,0,0.2)'
        }
      });

      // Redirect to login after success
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMessage = error?.includes('Invalid') || error?.includes('expired')
        ? 'This password reset link has expired. Please request a new one.'
        : error || 'Failed to reset password. Please try again.';

      toast.error(errorMessage);

      // Redirect to forgot password for invalid/expired tokens
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
        setTimeout(() => navigate('/forgot-password'), 2000);
      }
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="group">
              <img
                src="/logo.svg"
                alt="CxTrack"
                className="h-12 mb-6 opacity-90 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight text-center">
              Reset Your Password
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="password" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-400 ml-1">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/30 hover:text-white/60 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400 ml-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>

        <p className="text-white/10 text-[10px] uppercase tracking-widest font-bold text-center mt-8">
          &copy; 2026 CxTrack Intelligent Systems. Proprietary Access Only.
        </p>
      </div>
    </main>
  );
};

export default ResetPassword;
