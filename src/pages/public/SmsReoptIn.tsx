import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, CheckCircle, XCircle, Loader2, Clock } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

type PageState = 'loading' | 'confirm' | 'success' | 'error' | 'expired' | 'already_used';

export const SmsReoptIn: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>('confirm');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    if (!token) {
      setState('error');
      setErrorMsg('Invalid link.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/process-reopt-confirmation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (res.status === 410 || (data.error && data.error.includes('expired'))) {
        setState('expired');
      } else if (data.error && (data.error.includes('already') || data.error.includes('no longer valid'))) {
        setState('already_used');
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
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 bg-gray-100">
          {state === 'success' ? (
            <CheckCircle className="w-7 h-7 text-green-600" />
          ) : state === 'expired' ? (
            <Clock className="w-7 h-7 text-orange-500" />
          ) : state === 'error' || state === 'already_used' ? (
            <XCircle className="w-7 h-7 text-red-500" />
          ) : (
            <MessageSquare className="w-7 h-7 text-blue-600" />
          )}
        </div>

        {state === 'confirm' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-3">SMS Permission Request</h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              A business is requesting your permission to send you SMS messages again. By clicking below, you agree to receive SMS communications from them.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs text-blue-700 leading-relaxed">
                You previously opted out of SMS from this business. They have requested you be re-added. By confirming, you consent to receive SMS messages. You can opt out again at any time by replying STOP.
              </p>
            </div>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {submitting ? 'Processing...' : 'Yes, I Agree to Receive SMS'}
            </button>
            <p className="mt-4 text-gray-400 text-xs">
              If you did not request this or do not wish to receive SMS, simply close this page.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your consent has been recorded. SMS will be re-enabled for your account once reviewed and approved. You can opt out again at any time by replying STOP to any message.
            </p>
          </>
        )}

        {state === 'expired' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              This re-opt-in link has expired (links are valid for 7 days). Please contact the business to request a new link.
            </p>
          </>
        )}

        {state === 'already_used' && (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Already Processed</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              This link has already been used or is no longer valid. If you have questions, please contact the business directly.
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

export default SmsReoptIn;
