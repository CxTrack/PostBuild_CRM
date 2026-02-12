import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUp } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      toast.success('Account created! Please check your email to verify.', {
        style: {
          background: '#1a1a1a',
          color: '#FFD700',
          border: '1px solid rgba(255,215,0,0.2)'
        }
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
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
            <img
              src="/cxtrack-logo.png"
              alt="CxTrack"
              className="h-12 mb-6 opacity-90"
            />
            <h1 className="text-3xl font-bold text-white tracking-tight text-center">
              Create Your Account
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
              Get started with CxTrack
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="fullName" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                required
              />
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  required
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
            </div>

            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  required
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-white/30">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FFD700]/70 hover:text-[#FFD700] font-medium transition-colors">
              Sign in
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

export default Register;
