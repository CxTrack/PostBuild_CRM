import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { Eye, EyeOff, LogIn, ArrowLeft, Mail, Loader } from 'lucide-react';

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
      toast.success('Logged in successfully');
      setTimeout(() => {
        navigate('/dashboard');
      }, 300);
    } catch (err) {
      console.error('Login error in component:', err);
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
      console.error('Google sign in error:', err);
      toast.error('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      {/* Header with back button */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-md mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
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
            <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-gray-400">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-6">
              {error}
              {isIOS && retryCount >= 1 && (
                <p className="mt-2 text-sm">
                  iOS users: If you're having trouble, try enabling "Cross-Website Tracking" in Safari Settings → Privacy & Security.
                </p>
              )}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                className="input w-full bg-dark-800 border-dark-700"
                placeholder="you@example.com"
                autoComplete="email"
                autoCapitalize="none"
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
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input w-full pr-10 bg-dark-800 border-dark-700"
                  placeholder="••••••••"
                  autoComplete="current-password"
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <Link 
                  to="/forgot-password" 
                  className="text-primary-400 hover:text-primary-300 flex items-center"
                  onClick={() => clearError()}
                >
                  <Mail size={14} className="mr-1" />
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center py-3"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn size={18} className="mr-2" />
                  Sign In
                </span>
              )}
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-dark-950 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setGoogleLoading(true);
                    await signInWithGoogle();
                  } catch (err) {
                    console.error('Google sign in error:', err);
                    toast.error('Failed to sign in with Google');
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                disabled={loading || googleLoading} 
                className="btn btn-secondary flex items-center justify-center space-x-2 py-2.5 relative w-full max-w-xs"
              >
                {googleLoading && (
                  <div className="absolute inset-0 bg-dark-800/50 flex items-center justify-center">
                    <Loader className="animate-spin h-5 w-5" />
                  </div>
                )}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335"/>
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4"/>
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.70492L1.27498 6.60992C0.46498 8.22992 0 10.0599 0 11.9999C0 13.9399 0.46498 15.7699 1.28498 17.3899L5.26498 14.2949Z" fill="#FBBC05"/>
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.855 13.6204 19.325 12.0004 19.325C8.8704 19.325 6.21537 17.215 5.2654 14.295L1.2754 17.385C3.25537 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853"/>
                </svg>
                <span>Google</span>
              </button>
            </div>
          </form>
          
          <p className="mt-8 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;