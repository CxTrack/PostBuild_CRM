import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

/**
 * Handles Supabase auth callbacks (email confirmation, password recovery, magic links).
 * Supabase redirects here with tokens in the URL hash after verifying an email link.
 *
 * Flow:
 * 1. User clicks link in email (confirm signup, reset password, etc.)
 * 2. Supabase verifies token → redirects to this page with #access_token=...&type=...
 * 3. This component extracts tokens, sets the session, and redirects appropriately.
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extract tokens from URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check query params (some Supabase versions use query instead of hash)
        const queryParams = new URLSearchParams(window.location.search);
        const tokenHash = queryParams.get('token_hash');
        const queryType = queryParams.get('type');

        // Clean URL immediately
        window.history.replaceState({}, '', window.location.pathname);

        // Handle hash-based tokens (most common)
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw new Error('This verification link has expired. Please try again.');
          }

          // Validate the session is actually active
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            throw new Error('Failed to verify your session. Please try signing in.');
          }

          // Route based on callback type
          if (type === 'recovery') {
            // Password recovery — redirect to reset password form
            navigate('/reset-password', { replace: true });
            return;
          }

          // Email confirmation (type=signup or type=email)
          setStatus('success');
          setMessage('Email verified successfully!');
          toast.success('Email verified! Redirecting...');

          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('onboarding_completed, organization_id')
            .eq('id', user.id)
            .maybeSingle();

          setTimeout(() => {
            if (profile?.onboarding_completed && profile?.organization_id) {
              navigate('/dashboard', { replace: true });
            } else {
              navigate('/onboarding/profile', { replace: true });
            }
          }, 1500);
          return;
        }

        // Handle PKCE / token_hash-based verification (Supabase v2+ with PKCE)
        if (tokenHash && queryType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: queryType as any,
          });

          if (error) {
            throw new Error('This verification link has expired. Please try again.');
          }

          if (queryType === 'recovery') {
            navigate('/reset-password', { replace: true });
            return;
          }

          setStatus('success');
          setMessage('Email verified successfully!');
          toast.success('Email verified! Redirecting...');
          setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
          return;
        }

        // No tokens found — invalid callback
        throw new Error('Invalid verification link. Please request a new one.');

      } catch (err: any) {
        console.error('[AuthCallback] Error:', err);
        setStatus('error');
        setMessage(err.message || 'Verification failed. Please try again.');
        toast.error(err.message || 'Verification failed');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <main className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Logo */}
        <a href="https://easyaicrm.com">
          <img
            src="/cxtrack-logo.png"
            alt="CxTrack"
            className="h-10 mx-auto mb-8 opacity-90"
          />
        </a>

        {status === 'processing' && (
          <>
            <div className="w-10 h-10 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-gray-500 dark:text-white/50 text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{message}</h2>
            <p className="text-gray-500 dark:text-white/40 text-sm">Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-gray-500 dark:text-white/40 text-sm mb-4">{message}</p>
            <p className="text-gray-400 dark:text-white/30 text-xs">Redirecting to login...</p>
          </>
        )}
      </div>
    </main>
  );
};

export default AuthCallback;
