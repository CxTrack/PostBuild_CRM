import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { calComOAuthService } from '@/services/calcom.service';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type CallbackState = 'loading' | 'success' | 'error';

export default function CalComCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<CallbackState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [connectedEmail, setConnectedEmail] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const organizationId = searchParams.get('state');

    if (!code || !organizationId) {
      setState('error');
      setErrorMessage('Missing authorization code or organization ID. Please try connecting again from Calendar Settings.');
      return;
    }

    completeOAuth(code, organizationId);
  }, [searchParams]);

  const completeOAuth = async (code: string, organizationId: string) => {
    try {
      setState('loading');
      const result = await calComOAuthService.exchangeCode(code, organizationId);
      setState('success');
      if (result.email) setConnectedEmail(result.email);

      setTimeout(() => {
        navigate('/dashboard/settings', { replace: true, state: { tab: 'calendar', calcomConnected: true } });
      }, 2000);
    } catch (error: any) {
      setState('error');
      setErrorMessage(error.message || 'Failed to connect your Cal.com account. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full mx-4">
        {state === 'loading' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting your Cal.com account...
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Please wait while we complete the connection. This will only take a moment.
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Cal.com Connected Successfully
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {connectedEmail
                ? `Connected as ${connectedEmail}. Your AI voice agent can now check availability and book appointments.`
                : 'Your Cal.com account is now connected. Your AI voice agent can now manage calendar bookings.'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Redirecting to Settings...
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {errorMessage}
            </p>
            <Button
              onClick={() => navigate('/dashboard/settings', { replace: true })}
              variant="primary"
            >
              Back to Settings
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
