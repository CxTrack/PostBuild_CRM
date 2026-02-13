import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Zap, Globe, ShieldCheck, Check } from 'lucide-react';

const INDUSTRIES = [
  { value: "contractors_home_services", label: "Contractors & Home Services" },
  { value: "distribution_logistics", label: "Distribution & Logistics" },
  { value: "gyms_fitness", label: "Gyms & Fitness" },
  { value: "tax_accounting", label: "Tax & Accounting" },
  { value: "healthcare", label: "Healthcare" },
  { value: "real_estate", label: "Real Estate" },
  { value: "legal_services", label: "Legal Services" },
  { value: "software_development", label: "Software Development" },
  { value: "mortgage_broker", label: "Mortgage Broker" },
  { value: "general_business", label: "General Business" },
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

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLocation, setIsCheckingLocation] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    company: '',
    phone: '',
    countryCode: '+1',
    industry: 'general_business'
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Check user's location for GDPR
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const euCountries = [
          'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
          'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
          'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
        ];
        if (euCountries.includes(data.country_code)) {
          navigate('/gdpr');
        }
        setIsCheckingLocation(false);
      })
      .catch(() => setIsCheckingLocation(false));
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
            company: formData.company,
            industry: formData.industry,
            phone: `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // 2. Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: formData.company,
          industry_template: formData.industry,
          owner_id: authData.user.id
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 3. Create organization_members record
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: authData.user.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // 4. Update user_profiles with organization_id
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          organization_id: orgData.id,
          full_name: `${formData.firstName} ${formData.lastName}`,
          phone: `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`
        })
        .eq('user_id', authData.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Non-fatal, continue
      }

      setStatus({ type: 'success', message: 'Account created! Redirecting to dashboard...' });

      // Small delay then redirect
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account';
      setStatus({ type: 'error', message });
      setIsLoading(false);
    }
  };

  if (isCheckingLocation) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Checking regional availability...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FFD700]/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

        {/* Left Side: Value Proposition */}
        <div className="hidden lg:block">
          <span className="text-[#FFD700] text-xs font-bold tracking-[0.4em] uppercase mb-6 block">
            Quick Setup • Step 1 of 3
          </span>
          <h1 className="text-5xl xl:text-6xl font-black text-white mb-8 tracking-tighter leading-tight uppercase">
            Your AI-Powered
            <span className="text-[#FFD700] block">Future Starts Now</span>
          </h1>

          <div className="space-y-8 mt-12">
            {[
              {
                icon: <Zap className="text-[#FFD700]" size={24} />,
                title: "Industry-Tailored CRM",
                desc: "Your dashboard auto-configures with modules built for your specific industry."
              },
              {
                icon: <Globe className="text-[#FFD700]" size={24} />,
                title: "Full CRM Access",
                desc: "Manage leads, quotes, and invoices in one beautiful dashboard."
              },
              {
                icon: <ShieldCheck className="text-[#FFD700]" size={24} />,
                title: "No Credit Card Required",
                desc: "Start for free and stay for free. No hidden fees, no pressure."
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#FFD700]/10 border border-[#FFD700]/20 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed max-w-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="p-8 md:p-10 rounded-[40px] border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">Create Account</h2>
              <p className="text-white/40 text-sm">Tell us about your business to get started.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                  placeholder="john@company.com"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                  placeholder="Acme Corp"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Industry</label>
                <div className="relative">
                  <select
                    required
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors appearance-none cursor-pointer"
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

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 ml-1">Phone Number</label>
                <div className="flex gap-3">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="w-[100px] bg-white/5 border border-white/10 rounded-xl px-3 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors appearance-none cursor-pointer text-sm"
                  >
                    <option value="+1" className="bg-black">+1</option>
                    <option value="+44" className="bg-black">+44</option>
                    <option value="+61" className="bg-black">+61</option>
                  </select>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                    placeholder="(204) 555-1234"
                    maxLength={14}
                  />
                </div>
              </div>

              {status && (
                <div className={`p-4 rounded-xl text-xs font-bold text-center ${status.type === 'success'
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                  {status.message}
                </div>
              )}

              <button
                disabled={isLoading}
                type="submit"
                className={`w-full py-4 px-6 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all duration-300 flex items-center justify-center gap-2 ${isLoading
                    ? "bg-white/10 text-white/40"
                    : "bg-[#FFD700] text-black hover:shadow-[0_0_30px_rgba(255,215,0,0.3)]"
                  }`}
              >
                {isLoading ? "Creating Account..." : "Continue"}
                {!isLoading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">
                Already have an account?{" "}
                <Link to="/login" className="text-[#FFD700] hover:underline">Log In</Link>
              </p>
            </div>
          </div>

          {/* Mobile Trust Badges */}
          <div className="mt-8 flex justify-center gap-6 lg:hidden">
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase">
              <ShieldCheck size={14} /> No CC Required
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] font-bold uppercase">
              <Check size={14} /> Cancel Anytime
            </div>
          </div>
        </div>

      </div>
    </main>
  );
};

export default Register;
