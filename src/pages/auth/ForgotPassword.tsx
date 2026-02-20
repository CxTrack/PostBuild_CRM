import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import { Mail, AlertTriangle } from 'lucide-react';

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
      toast.success('Password reset instructions sent to your email', {
        style: {
          background: '#1a1a1a',
          color: '#FFD700',
          border: '1px solid rgba(255,215,0,0.2)'
        }
      });
    } catch (err) {
      // Error handled silently
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
                src="/cxtrack-logo.png"
                alt="CxTrack"
                className="h-12 mb-6 opacity-90 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight text-center">
              Reset Password
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
              Enter your email to receive reset instructions
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          {emailSent ? (
            <div className="text-center">
              <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-6 mb-6">
                <Mail className="w-12 h-12 text-[#FFD700] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Check Your Email</h3>
                <p className="text-white/40 text-sm">
                  We've sent password reset instructions to your email address. Please check your inbox.
                </p>
              </div>

              <div className="bg-white/[0.03] border border-[#FFD700]/10 rounded-xl p-4 mb-6 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-[#FFD700]/60 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white/50 text-xs leading-relaxed">
                    <span className="text-white/70 font-medium">Can't find the email?</span> Check your <span className="text-[#FFD700]/70 font-medium">spam or junk folder</span>. Some email providers may flag the reset email. If you still don't see it, wait a minute and try again.
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] inline-block text-center"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@business.com"
                  autoComplete="email"
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400 ml-1">{errors.email.message}</p>
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
                    Sending Instructions...
                  </span>
                ) : (
                  'Send Reset Instructions'
                )}
              </button>

              <p className="text-center text-sm text-white/30 pt-4">
                Remember your password?{' '}
                <Link to="/login" className="text-[#FFD700]/70 hover:text-[#FFD700] font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>

        <p className="text-white/10 text-[10px] uppercase tracking-widest font-bold text-center mt-8">
          &copy; 2026 CxTrack Intelligent Systems. Proprietary Access Only.
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;
