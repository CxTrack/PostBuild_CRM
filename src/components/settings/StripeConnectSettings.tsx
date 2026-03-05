import { useState, useEffect } from 'react';
import { stripeConnectService, StripeConnectStatus } from '@/services/stripeConnect.service';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface StripeConnectSettingsProps {
  organizationId?: string;
}

export default function StripeConnectSettings({ organizationId }: StripeConnectSettingsProps) {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    if (organizationId) {
      loadStatus();
    }
  }, [organizationId]);

  const loadStatus = async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await stripeConnectService.getAccountStatus(organizationId);
      setStatus(data);
    } catch (error: any) {
      console.error('Failed to load Stripe status:', error);
      // Default to disconnected state on error
      setStatus({
        connected: false,
        status: 'disconnected',
        platform_fee_pct: 2.5,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!organizationId) return;
    try {
      setConnecting(true);
      const url = await stripeConnectService.createOAuthLink(organizationId);
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start Stripe connection');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!organizationId) return;
    try {
      setDisconnecting(true);
      await stripeConnectService.disconnect(organizationId);
      toast.success('Stripe account disconnected');
      setShowDisconnectConfirm(false);
      await loadStatus();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect Stripe account');
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading Stripe status...</span>
        </div>
      </div>
    );
  }

  const isActive = status?.status === 'active';
  const isPending = status?.status === 'pending';
  const isRestricted = status?.status === 'restricted';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Stripe Connect</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Accept online payments on invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
            </>
          )}
          {isPending && (
            <>
              <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</span>
            </>
          )}
          {isRestricted && (
            <>
              <div className="w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">Restricted</span>
            </>
          )}
          {!isActive && !isPending && !isRestricted && (
            <>
              <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Not Connected</span>
            </>
          )}
        </div>
      </div>

      {/* Active State */}
      {isActive && status && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Stripe account connected successfully
                </p>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700 dark:text-green-300">Account:</span>
                    <span className="text-xs font-mono text-green-800 dark:text-green-200">
                      {status.account_id ? `${status.account_id.slice(0, 12)}...` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700 dark:text-green-300">Platform fee:</span>
                    <span className="text-xs font-medium text-green-800 dark:text-green-200">
                      {status.platform_fee_pct}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  {status.charges_enabled && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-700 dark:text-green-300">Charges enabled</span>
                    </div>
                  )}
                  {status.payouts_enabled && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-700 dark:text-green-300">Payouts enabled</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            {!showDisconnectConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDisconnectConfirm(true)}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  Disconnect Stripe? You will no longer be able to accept online payments.
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectConfirm(false)}
                    disabled={disconnecting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDisconnect}
                    loading={disconnecting}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending State */}
      {isPending && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Completing Stripe setup...
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Please complete your Stripe onboarding to start accepting payments.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restricted State */}
      {isRestricted && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                Stripe account has restrictions
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                Some account details need to be verified. Please check your Stripe dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disconnected State */}
      {!isActive && !isPending && !isRestricted && (
        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Why connect Stripe?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Accept credit card and bank payments on invoices
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Generate shareable payment links for customers
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Automatic payment tracking and invoice status updates
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Payouts directly to your bank account
                </span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Platform fee: {status?.platform_fee_pct ?? 2.5}% per transaction
            </p>
            <Button
              onClick={handleConnect}
              loading={connecting}
              className="bg-[#635BFF] hover:bg-[#5851ea] text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect with Stripe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
