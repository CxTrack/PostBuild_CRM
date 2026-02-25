import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, LogIn, UserPlus, User, Phone, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const SESSION_KEY = 'pending_invite_token';

// Read auth token directly from localStorage — bypasses Supabase JS AbortController.
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

type AcceptState = 'loading' | 'accepting' | 'success' | 'already_member' | 'error' | 'need_auth' | 'profile_setup';

interface AcceptResult {
  success: boolean;
  error?: string;
  already_member?: boolean;
  organization_name?: string;
  role?: string;
  organization_id?: string;
}

export const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();

  const [state, setState] = useState<AcceptState>('loading');
  const [result, setResult] = useState<AcceptResult | null>(null);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const token = searchParams.get('token');

  // Accept the invitation via RPC
  const acceptInvitation = async (inviteToken: string) => {
    setState('accepting');

    const authToken = getAuthToken();
    if (!authToken) {
      setState('need_auth');
      return;
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/accept_invitation`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_token: inviteToken }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `Server error (${res.status})`);
      }

      const data: AcceptResult = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to accept invitation');
        setState('error');
        return;
      }

      // Clear stored token
      sessionStorage.removeItem(SESSION_KEY);

      setResult(data);

      if (data.already_member) {
        setState('already_member');
      } else {
        // Check if user has a profile — if not, show mini profile form
        const needsProfile = await checkUserProfile(authToken);
        setState(needsProfile ? 'profile_setup' : 'success');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  };

  const checkUserProfile = async (authToken: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/user_profiles?user_id=eq.${user?.id}&select=full_name&limit=1`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      if (!res.ok) return false;
      const profiles = await res.json();
      // Needs profile if no record or no name set
      return !profiles?.length || !profiles[0].full_name;
    } catch {
      return false; // fail-open: skip profile form on error
    }
  };

  const saveProfile = async () => {
    if (!profileForm.firstName.trim()) {
      toast.error('Please enter your first name');
      return;
    }

    setSavingProfile(true);
    const authToken = getAuthToken();
    if (!authToken || !user) {
      toast.error('Session expired');
      setSavingProfile(false);
      return;
    }

    try {
      const fullName = `${profileForm.firstName.trim()} ${profileForm.lastName.trim()}`.trim();

      // Upsert user_profiles
      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${authToken}`,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          user_id: user.id,
          full_name: fullName,
          phone_number: profileForm.phone.trim() || null,
          onboarding_step: 'complete',
          onboarding_completed: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to save profile');

      toast.success('Profile saved!');
      setState('success');
    } catch (err) {
      console.error('[AcceptInvite] Profile save error:', err);
      toast.error('Failed to save profile. You can update it later in Settings.');
      setState('success'); // Let them through anyway
    } finally {
      setSavingProfile(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;

    // No token in URL
    if (!token) {
      // Check if we have a stored token from before auth
      const storedToken = sessionStorage.getItem(SESSION_KEY);
      if (storedToken && user) {
        acceptInvitation(storedToken);
        return;
      }
      setError('No invitation token provided');
      setState('error');
      return;
    }

    if (!user) {
      // Store token and show auth options
      sessionStorage.setItem(SESSION_KEY, token);
      setState('need_auth');
      return;
    }

    // User is logged in and we have a token — accept it
    acceptInvitation(token);
  }, [token, user, authLoading]);

  // After login/register, check for pending invite
  useEffect(() => {
    if (user && !authLoading) {
      const storedToken = sessionStorage.getItem(SESSION_KEY);
      if (storedToken && state === 'need_auth') {
        acceptInvitation(storedToken);
      }
    }
  }, [user, authLoading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            CxTrack
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Team Invitation</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Loading */}
          {(state === 'loading' || state === 'accepting') && (
            <div className="p-10 text-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                {state === 'loading' ? 'Verifying invitation...' : 'Joining organization...'}
              </p>
            </div>
          )}

          {/* Need Auth — user must log in or register first */}
          {state === 'need_auth' && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  You've been invited!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Sign in or create an account to join the team.
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  state={{ from: { pathname: '/accept-invite', search: `?token=${token}` } }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link
                  to="/register"
                  state={{ from: { pathname: '/accept-invite', search: `?token=${token}` } }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Link>
              </div>
            </div>
          )}

          {/* Mini Profile Form — shown for new users after invite acceptance */}
          {state === 'profile_setup' && result && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Welcome to {result.organization_name}!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Complete your profile to get started.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">First Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="First name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                        className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Last Name</label>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 ml-1">Phone (optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={savingProfile || !profileForm.firstName.trim()}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProfile ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Success */}
          {state === 'success' && result && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to {result.organization_name}!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                You've joined as <span className="font-semibold capitalize text-gray-700 dark:text-gray-200">{result.role}</span>
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Already a member */}
          {state === 'already_member' && result && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Already a member
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                You're already part of {result.organization_name}.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Error */}
          {state === 'error' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Invitation Failed
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                {error}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
                >
                  Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">
          CxTrack CRM &mdash; cxtrack.com
        </p>
      </div>
    </div>
  );
};
