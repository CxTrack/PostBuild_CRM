import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

const INDUSTRIES = [
  { value: 'contractors_home_services', label: 'Contractors & Home Services' },
  { value: 'distribution_logistics', label: 'Distribution & Logistics' },
  { value: 'gyms_fitness', label: 'Gyms & Fitness' },
  { value: 'tax_accounting', label: 'Tax & Accounting' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'legal_services', label: 'Legal Services' },
  { value: 'software_development', label: 'Software Development' },
  { value: 'mortgage_broker', label: 'Mortgage Broker' },
  { value: 'construction', label: 'Construction' },
  { value: 'general_business', label: 'General Business' },
];

const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    let formatted = '';
    if (match[1]) formatted = `(${match[1]}`;
    if (match[1]?.length === 3) formatted += ') ';
    if (match[2]) formatted += match[2];
    if (match[2]?.length === 3) formatted += '-';
    if (match[3]) formatted += match[3];
    return formatted;
  }
  return value;
};

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    industry: 'general_business',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const userId = authData.user.id;

      // 2. Create organization with 30-day trial (enterprise tier)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.company || `${formData.firstName}'s Business`,
          slug: formData.company?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `org-${userId.slice(0, 8)}`,
          industry_template: formData.industry,
          subscription_tier: 'enterprise', // 30-day trial with full access
          primary_color: '#FFD700',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          business_hours: { start: '09:00', end: '17:00' },
          enabled_modules: ['dashboard', 'crm', 'calendar', 'quotes', 'invoices', 'tasks', 'pipeline', 'calls'],
          max_users: 10,
          metadata: {
            trial_started_at: new Date().toISOString(),
            signup_source: 'crm_register'
          },
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create organization_members record
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: userId,
          role: 'owner',
          permissions: {},
          calendar_delegation: [],
          can_view_team_calendars: true,
        });

      if (memberError) throw memberError;

      // 4. Update user_profiles with organization_id and full_name
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: formData.phone || null,
          default_org_id: orgData.id,
        })
        .eq('id', userId);

      if (profileError) {
        console.warn('Profile update warning:', profileError);
        // Non-fatal - profile might be created by trigger
      }

      toast.success('Account created! Redirecting to dashboard...', {
        style: {
          background: '#1a1a1a',
          color: '#FFD700',
          border: '1px solid rgba(255,215,0,0.2)'
        }
      });

      // Small delay for toast visibility, then navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error: unknown) {
      console.error('Signup error:', error);
      const message = error instanceof Error ? error.message : 'Failed to create account';
      toast.error(message);
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
            <Link to="/">
              <img
                src="/logo.svg"
                alt="CxTrack"
                className="h-12 mb-6 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white tracking-tight text-center">
              Create Your Account
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
              Start your 30-day free trial with full access
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Work Email
              </label>
              <input
                type="email"
                placeholder="john@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                  required
                  minLength={8}
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

            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Company Name
              </label>
              <input
                type="text"
                placeholder="Acme Corp"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                required
              />
            </div>

            {/* Industry */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Industry
              </label>
              <div className="relative">
                <select
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all appearance-none cursor-pointer"
                  required
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind.value} value={ind.value} className="bg-black text-white">
                      {ind.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Phone (Optional) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Phone <span className="text-white/30">(Optional)</span>
              </label>
              <input
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
                maxLength={14}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Creating Account...
                </>
              ) : (
                <>
                  Start Free Trial
                  <ArrowRight size={18} />
                </>
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
          © 2026 CxTrack Intelligent Systems. Proprietary Access Only.
        </p>
      </div>
    </main>
  );
};

export default Register;
