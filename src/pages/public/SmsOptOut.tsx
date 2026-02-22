import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MessageSquare, CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

type PageState = 'loading' | 'confirm' | 'success' | 'already_opted_out' | 'error';

export const SmsOptOut: React.FC = () => {
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const organizationId = searchParams.get('organization_id');

  const [state, setState] = useState<PageState>('confirm');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orgName, setOrgName] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!customerId || !organizationId) {
      setState('error');
      setErrorMsg('Invalid link. Please contact the sender for a new opt-out link.');
      return;
    }

    // Load names for display
    const loadNames = async () => {
      try {
        const [custRes, orgRes] = await Promise.all([
          fetch(`${supabaseUrl}/rest/v1/customers?id=eq.${customerId}&select=first_name,last_name`, {
            headers: { 'apikey': supabaseAnonKey },
          }),
          fetch(`${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}&select=name`, {
            headers: { 'apikey': supabaseAnonKey },
          }),
        ]);

        if (custRes.ok) {
          const [cust] = await custRes.json();
          if (cust) setCustomerName([cust.first_name, cust.last_name].filter(Boolean).join(' '));
        }
        if (orgRes.ok) {
          const [org] = await orgRes.json();
          if (org) setOrgName(org.name);
        }
      } catch { /* non-blocking */ }
    };

    loadNames();
  }, [customerId, organizationId]);

  const handleOptOut = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/sms-opt-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          customer_id: customerId,
          organization_id: organizationId,
          method: 'link',
        }),
      });

      const data = await res.json();
      if (data.already_opted_out) {
        setState('already_opted_out');
      } else if (data.success) {
        setState('success');
      } else {
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 bg-gray-100">
          {state === 'success' ? (
            <CheckCircle className="w-7 h-7 text-green-600" />
          ) : state === 'already_opted_out' ? (
            <CheckCircle className="w-7 h-7 text-blue-600" />
          ) : state === 'error' ? (
            <XCircle className="w-7 h-7 text-red-500" />
          ) : (
            <MessageSquare className="w-7 h-7 text-gray-600" />
          )}
        </div>

        {state === 'confirm' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Opt Out of SMS Messages</h1>
            {customerName && <p className="text-gray-500 text-sm mb-1">Hi {customerName},</p>}
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              {orgName ? (
                <>Clicking below will stop <strong>{orgName}</strong> from sending you SMS messages.</>
              ) : (
                'Clicking below will stop this business from sending you SMS messages.'
              )}
              {' '}You can always ask them to re-enable SMS in the future.
            </p>
            <button
              onClick={handleOptOut}
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Opt Out of SMS'}
            </button>
            <button
              onClick={() => window.close()}
              className="mt-3 w-full text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors"
            >
              Cancel - Keep receiving SMS
            </button>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">You've Been Opted Out</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              You will no longer receive SMS messages{orgName ? ` from ${orgName}` : ''}. This took effect immediately.
            </p>
          </>
        )}

        {state === 'already_opted_out' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Already Opted Out</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              You have already opted out of SMS messages{orgName ? ` from ${orgName}` : ''}. No action needed.
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">{errorMsg}</p>
            <button
              onClick={() => setState('confirm')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Try Again
            </button>
          </>
        )}

        <p className="text-gray-400 text-xs mt-8">Powered by CxTrack &bull; Ontario, Canada</p>
      </div>
    </div>
  );
};

export default SmsOptOut;
