import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  });

  useEffect(() => {
    const initProfile = async () => {
      // Always try to get fresh user data from auth (handles OAuth sign-in)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        const nameParts = fullName.split(' ');
        const authFirst = nameParts[0] || '';
        const authLast = nameParts.slice(1).join(' ') || '';

        // Check if we have existing onboarding data
        const leadData = sessionStorage.getItem('onboarding_lead');
        if (leadData) {
          const parsed = JSON.parse(leadData);
          // If profile already filled (has company), skip to select-service
          if (parsed.company) {
            navigate('/onboarding/select-service');
            return;
          }
        }

        // OAuth user data takes priority, then fallback to session storage
        const existingLead = leadData ? JSON.parse(leadData) : {};
        const first = authFirst || existingLead.firstName || '';
        const last = authLast || existingLead.lastName || '';

        const lead = {
          ...existingLead,
          userId: user.id,
          email: user.email || existingLead.email || '',
          firstName: first,
          lastName: last,
        };
        sessionStorage.setItem('onboarding_lead', JSON.stringify(lead));

        setFormData(prev => ({
          ...prev,
          firstName: first,
          lastName: last,
          ...(existingLead.phone ? { phone: existingLead.phone } : {}),
        }));
      } else {
        // No authenticated user — check session storage as fallback
        const leadData = sessionStorage.getItem('onboarding_lead');
        if (leadData) {
          const parsed = JSON.parse(leadData);
          if (parsed.company) {
            navigate('/onboarding/select-service');
            return;
          }
          if (parsed.firstName) setFormData(prev => ({ ...prev, firstName: parsed.firstName }));
          if (parsed.lastName) setFormData(prev => ({ ...prev, lastName: parsed.lastName }));
          if (parsed.phone) setFormData(prev => ({ ...prev, phone: parsed.phone }));
        } else {
          // No session and no lead data — send to register
          navigate('/register');
        }
      }
    };

    initProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setLoading(true);

    try {
      const leadData = JSON.parse(sessionStorage.getItem('onboarding_lead') || '{}');
      const updatedLead = {
        ...leadData,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        phone: formatPhoneForStorage(formData.phone),
      };
      sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

      // Update auth metadata with full name
      if (formData.firstName || formData.lastName) {
        await supabase.auth.updateUser({
          data: { full_name: `${formData.firstName} ${formData.lastName}`.trim() },
        });
      }

      navigate('/onboarding/select-service');
    } catch (error) {
      console.error('Profile save error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-md mx-auto">
        <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight text-center">
              Tell Us About You
            </h1>
            <p className="text-white/40 text-sm mt-2 text-center max-w-[280px]">
              A few quick details to personalize your experience.
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
                  autoFocus
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

            {/* Phone (Optional) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Phone <span className="text-white/30">(Optional)</span>
              </label>
              <PhoneInput
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/[0.05] border-white/[0.1] rounded-xl py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30 transition-all"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
