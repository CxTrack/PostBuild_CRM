import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Eye, EyeOff, Loader2, Sun, Moon, Waves } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSafeErrorMessage } from '@/utils/errorHandler';
import { validateEmail, validateRequired } from '@/utils/validation';
import { checkOnboardingStatus } from '@/utils/onboarding';
import { supabase } from '@/lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'microsoft' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithGoogle, signInWithMicrosoft } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark' || theme === 'midnight' || theme === 'ocean';
  const isOcean = theme === 'ocean';
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        toast.error(emailValidation.error!);
        setLoading(false);
        return;
      }

      const passwordValidation = validateRequired(password, 'Password');
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.error!);
        setLoading(false);
        return;
      }

      await signIn(email, password);
      toast.success('Welcome back!', {
        style: isOcean
          ? { background: '#0E1F38', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }
          : isDark
            ? { background: '#1a1a1a', color: '#FFD700', border: '1px solid rgba(255,215,0,0.2)' }
            : { background: '#FFFFFF', color: '#B8860B', border: '1px solid rgba(184,134,11,0.2)' }
      });

      // Check if onboarding is complete before redirecting to dashboard
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const status = await checkOnboardingStatus(currentUser.id);
        if (status && !status.complete) {
          navigate('/onboarding/profile');
          return;
        }
      }
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(getSafeErrorMessage(error, 'auth'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setOauthLoading('google');
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
      setOauthLoading(null);
    }
  };

  const handleMicrosoftSignIn = async () => {
    try {
      setOauthLoading('microsoft');
      await signInWithMicrosoft();
    } catch (error) {
      console.error('Microsoft sign-in error:', error);
      toast.error('Failed to sign in with Microsoft');
      setOauthLoading(null);
    }
  };

  return (
    <main className={`min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden ${isOcean ? 'bg-[#0A1628]' : 'bg-white dark:bg-black'}`}>
      {/* Theme Toggle — ocean→Moon, midnight→Sun, light→Waves */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-20 p-2.5 rounded-xl bg-gray-100 dark:bg-white/[0.07] border border-gray-200 dark:border-white/[0.1] hover:bg-gray-200 dark:hover:bg-white/[0.12] transition-all text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80"
        aria-label="Toggle theme"
        title={`Current: ${theme}`}
      >
        {theme === 'ocean' ? <Moon size={18} /> : theme === 'midnight' ? <Sun size={18} /> : <Waves size={18} />}
      </button>

      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute top-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full ${isOcean ? 'bg-[#00D4FF]/5' : 'bg-[#B8860B]/5 dark:bg-[#FFD700]/5'}`} />
        <div className={`absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full ${isOcean ? 'bg-[#2DD4BF]/5' : 'bg-[#B8860B]/5 dark:bg-[#FFD700]/5'}`} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo top-left */}
        <div className="mb-8">
          <a href="https://cxtrack.com">
            <img
              src="/cxtrack-logo.png"
              alt="CxTrack"
              className="h-10 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
            />
          </a>
        </div>

        <div className="bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-xl dark:shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back
            </h1>
            <p className="text-gray-500 dark:text-white/40 text-sm mt-2">
              Sign in to your workspace
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-white/[0.07] hover:bg-gray-100 dark:hover:bg-white/[0.12] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3.5 text-gray-900 dark:text-white font-medium transition-all disabled:opacity-50"
            >
              {oauthLoading === 'google' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#4285F4" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#34A853" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-gray-50 dark:bg-white/[0.07] hover:bg-gray-100 dark:hover:bg-white/[0.12] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3.5 text-gray-900 dark:text-white font-medium transition-all disabled:opacity-50"
            >
              {oauthLoading === 'microsoft' ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
                </svg>
              )}
              Continue with Microsoft
            </button>
          </div>

          {/* OR Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.1]" />
            <span className="text-gray-400 dark:text-white/30 text-xs font-bold uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-white/[0.1]" />
          </div>

          {/* Email + Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className={`text-[10px] uppercase tracking-widest font-bold ml-1 ${isOcean ? 'text-[#00D4FF]/70' : 'text-[#FFD700]/70'}`}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3.5 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${isOcean ? 'focus:ring-[#00D4FF]/30' : 'focus:ring-[#FFD700]/30'}`}
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className={`text-[10px] uppercase tracking-widest font-bold ml-1 ${isOcean ? 'text-[#00D4FF]/70' : 'text-[#FFD700]/70'}`}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/[0.1] rounded-xl px-4 py-3.5 pr-12 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 transition-all ${isOcean ? 'focus:ring-[#00D4FF]/30' : 'focus:ring-[#FFD700]/30'}`}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/60 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end px-1 pt-1">
              <Link
                to="/forgot-password"
                className={`text-xs transition-colors ${isOcean ? 'text-[#00D4FF]/60 hover:text-[#00D4FF]' : 'text-[#B8860B] dark:text-[#FFD700]/60 hover:text-[#FFD700]'}`}
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-black font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-50 mt-2 flex items-center justify-center gap-2 ${isOcean ? 'bg-[#00D4FF] hover:bg-[#00D4FF]/90 dark:shadow-[0_0_20px_rgba(0,212,255,0.2)]' : 'bg-[#FFD700] hover:bg-[#FFD700]/90 dark:shadow-[0_0_20px_rgba(255,215,0,0.2)]'}`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-400 dark:text-white/30">
            Don't have an account?{' '}
            <Link to="/register" className={`font-medium transition-colors ${isOcean ? 'text-[#00D4FF]/70 hover:text-[#00D4FF]' : 'text-[#B8860B] dark:text-[#FFD700]/70 hover:text-[#FFD700]'}`}>
              Sign up
            </Link>
          </p>
        </div>

        {/* Bottom footer */}
        <div className="flex items-center justify-center mt-8 px-2">
          <p className="text-gray-300 dark:text-white/10 text-[10px] uppercase tracking-widest font-bold">
            &copy; 2026 CxTrack
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
