import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const { resetPassword, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearError();
    try {
      await resetPassword(data.email);
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (err) {
      console.error('Password reset error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header with back button */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo.svg" alt="CxTrack Logo" className="h-8 w-8 logo-glow" />
              <span className="brand-logo text-xl font-bold text-white brand-text">CxTrack</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <Link to="/" className="flex items-center space-x-3 mb-8">
              <img src="/logo.svg" alt="CxTrack Logo" className="h-12 w-12 logo-glow" />
              <span className="brand-logo text-3xl font-bold text-white brand-text">CxTrack</span>
            </Link>
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Enter your email to receive reset instructions</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="bg-primary-900/50 border border-primary-800 rounded-lg p-6 text-center">
              <Mail className="w-12 h-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-gray-400 mb-6">
                We've sent password reset instructions to your email address. Please check your inbox.
              </p>
              <Link to="/login" className="btn btn-primary w-full">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="input w-full bg-dark-800 border-dark-700"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Reset Instructions...
                  </span>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>

              <p className="text-center text-sm text-gray-400">
                Remember your password?{' '}
                <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;