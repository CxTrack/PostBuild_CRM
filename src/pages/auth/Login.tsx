import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { Eye, EyeOff, Loader } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { signIn, signInWithGoogle, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Clear any previous errors when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginAttempted(true);
      setRetryCount(prev => prev + 1);
      await signIn(data.email, data.password);
      toast.success('Access granted. Redirecting...', {
        style: {
          background: '#1a1a1a',
          color: '#FFD700',
          border: '1px solid rgba(255,215,0,0.2)'
        }
      });
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } catch (err) {
      if (retryCount >= 2) {
        toast.error('Having trouble logging in? Try using a different browser or clearing your cookies.');
      }
    }
  };

  // Detect iOS for specific messaging
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (err) {
      toast.error('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
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
              Access Your Workspace
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
              Sign in to your account to continue
            </p>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
              {isIOS && retryCount >= 1 && (
                <p className="mt-2 text-xs text-red-400/70">
                  iOS users: If you're having trouble, try enabling "Cross-Website Tracking" in Safari Settings → Privacy & Security.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                placeholder="name@business.com"
                autoComplete="email"
                autoCapitalize="none"
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

            <div className="space-y-1">
              <label htmlFor="password" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
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

            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#FFD700] focus:ring-[#FFD700]/30"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-white/40">
                  Remember me
                </label>
              </div>

              <Link
                to="/forgot-password"
                className="text-[#FFD700]/60 hover:text-[#FFD700] text-xs transition-colors"
                onClick={() => clearError()}
              >
                Forgot Password?
              </Link>
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
                  Verifying Identity...
                </span>
              ) : (
                'Access Dashboard'
              )}
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-white/[0.05]"></div>
              <span className="flex-shrink mx-4 text-white/20 text-[10px] uppercase tracking-widest font-medium">Or continue with</span>
              <div className="flex-grow border-t border-white/[0.05]"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              className="w-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white font-medium py-4 rounded-xl transition-all flex items-center justify-center gap-3 relative"
            >
              {googleLoading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                  <Loader className="animate-spin h-5 w-5 text-[#FFD700]" />
                </div>
              )}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/30">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FFD700]/70 hover:text-[#FFD700] font-medium transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>

        <p className="text-white/10 text-[10px] uppercase tracking-widest font-bold text-center mt-8">
          &copy; 2026 CxTrack Intelligent Systems. Proprietary Access Only.
        </p>
      </div>
    </main>
  );
};

export default Login;
