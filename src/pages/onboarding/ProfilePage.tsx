import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatPhoneForStorage } from '@/utils/phone.utils';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { updateOnboardingStep, ONBOARDING_STEP_ROUTES } from '@/utils/onboarding';

function getAuthToken(): string | null {
  try {
    const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
  });

  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const initProfile = async () => {
      // Process OAuth tokens from URL hash/query params if present
      // This page is the OAuth redirect target -- tokens arrive here after Google/Microsoft sign-in
      // With detectSessionInUrl: false, the Supabase SDK won't process them automatically
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
      const providerToken = urlParams.get('provider_token') || hashParams.get('provider_token');
      const providerRefreshToken = urlParams.get('provider_refresh_token') || hashParams.get('provider_refresh_token');

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        // Capture Microsoft provider tokens for auto email connection via Graph API
        if (providerToken) {
          sessionStorage.setItem('microsoft_provider_tokens', JSON.stringify({
            provider_token: providerToken,
            provider_refresh_token: providerRefreshToken || '',
            timestamp: Date.now(),
          }));
        }

        // Clean tokens from URL to prevent reprocessing on refresh
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Now get fresh user data from auth (session is established if tokens were present)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata || {};
        const fullName = meta.full_name || meta.name || '';
        const nameParts = fullName.split(' ');
        const authFirst = nameParts[0] || '';
        const authLast = nameParts.slice(1).join(' ') || '';

        // Check if we have existing onboarding data in sessionStorage
        const leadData = sessionStorage.getItem('onboarding_lead');
        if (leadData) {
          const parsed = JSON.parse(leadData);
          // If profile already filled (has company), skip to select-service
          if (parsed.company) {
            navigate('/onboarding/select-service');
            return;
          }
        }

        // Resume logic: if no sessionStorage but user has DB onboarding state, resume from last step
        if (!leadData) {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('onboarding_step, full_name, business_name, phone_verified')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.onboarding_step && profile.onboarding_step !== 'profile' && profile.onboarding_step !== 'onboarding_status') {
              // User has progressed past profile before - reconstruct minimal sessionStorage and redirect
              const resumeLead = {
                userId: user.id,
                email: user.email || '',
                firstName: authFirst || profile.full_name?.split(' ')[0] || '',
                lastName: authLast || profile.full_name?.split(' ').slice(1).join(' ') || '',
                company: profile.business_name || '',
                phoneVerified: profile.phone_verified || false,
              };
              sessionStorage.setItem('onboarding_lead', JSON.stringify(resumeLead));

              const resumeRoute = ONBOARDING_STEP_ROUTES[profile.onboarding_step];
              if (resumeRoute && resumeRoute !== '/onboarding/profile') {
                console.log(`[Onboarding] Resuming from step: ${profile.onboarding_step}`);
                navigate(resumeRoute);
                return;
              }
            }
          } catch (err) {
            console.warn('[Onboarding] Resume check failed:', err);
            // Continue with normal profile setup flow
          }
        }

        // Track that we're on the profile step
        updateOnboardingStep('profile');

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
        // No authenticated user -- check session storage as fallback
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
          // No session and no lead data -- send to register
          navigate('/register');
        }
      }
    };

    initProfile();
  }, [navigate]);

  const sendOtpCode = async () => {
    setOtpSending(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`${supabaseUrl}/functions/v1/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey || '',
        },
        body: JSON.stringify({
          action: 'send',
          phone: formData.phone,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send code');
      setOtpSent(true);
      toast.success('Verification code sent to your phone');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send verification code. Please try again.');
      console.error('[OTP] Send error:', err);
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtpCode = async () => {
    if (otpCode.length < 4) {
      toast.error('Please enter the verification code');
      return;
    }
    setOtpVerifying(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token');
      const res = await fetch(`${supabaseUrl}/functions/v1/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey || '',
        },
        body: JSON.stringify({
          action: 'check',
          phone: formData.phone,
          code: otpCode,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.verified) {
        toast.error(data.error || 'Invalid code. Please try again.');
        return;
      }

      // Verified -- save data and proceed
      const leadData = JSON.parse(sessionStorage.getItem('onboarding_lead') || '{}');
      const updatedLead = {
        ...leadData,
        firstName: formData.firstName,
        lastName: formData.lastName,
        company: formData.company,
        phone: formatPhoneForStorage(formData.phone),
        phoneVerified: true,
      };
      sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

      // Update auth metadata with full name
      if (formData.firstName || formData.lastName) {
        await supabase.auth.updateUser({
          data: { full_name: `${formData.firstName} ${formData.lastName}`.trim() },
        });
      }

      toast.success('Phone verified!');
      navigate('/onboarding/select-service');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please try again.');
      console.error('[OTP] Verify error:', err);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    // Phone is mandatory
    const digits = formData.phone.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Show OTP modal and send code
      setShowOtpModal(true);
      await sendOtpCode();
    } catch {
      // Error already handled in sendOtpCode
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

            {/* Phone (Required) */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[#FFD700]/70 ml-1">
                Phone Number
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

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-[#FFD700]/10 rounded-full flex items-center justify-center mx-auto">
                <Phone size={24} className="text-[#FFD700]" />
              </div>
              <h2 className="text-xl font-black text-white">Verify Your Phone</h2>
              <p className="text-white/50 text-sm">
                {otpSent
                  ? `Enter the code we sent to ${formData.phone}`
                  : 'Sending verification code...'}
              </p>
            </div>

            {otpSent && (
              <div className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#FFD700]/30"
                  autoFocus
                />
                <button
                  onClick={verifyOtpCode}
                  disabled={otpVerifying || otpCode.length < 4}
                  className="w-full bg-[#FFD700] hover:bg-[#FFD700]/90 text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {otpVerifying ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
                <button
                  onClick={sendOtpCode}
                  disabled={otpSending}
                  className="w-full text-white/40 hover:text-[#FFD700] text-xs font-bold uppercase tracking-widest transition-colors py-2"
                >
                  {otpSending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            )}

            {!otpSent && (
              <div className="flex items-center justify-center py-4">
                <svg className="animate-spin h-8 w-8 text-[#FFD700]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}

            <button
              onClick={() => { setShowOtpModal(false); setOtpCode(''); setOtpSent(false); }}
              className="text-white/20 hover:text-white/60 text-xs w-full text-center transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
