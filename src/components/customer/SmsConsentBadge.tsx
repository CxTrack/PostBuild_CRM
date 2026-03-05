import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Clock, Loader2, Send, RefreshCw, Info } from 'lucide-react';
import { useSmsConsentStore, SmsConsent, SmsAuditEntry } from '@/stores/smsConsentStore';
import { ReoptInModal } from './ReoptInModal';
import toast from 'react-hot-toast';

interface SmsConsentBadgeProps {
  customerId: string;
  organizationId: string;
  customerName?: string;
  customerEmail?: string;
}

const ACTION_LABELS: Record<string, string> = {
  initial_consent: 'SMS enabled',
  opt_out: 'Customer opted out',
  reopt_requested: 'Re-opt-in email sent',
  reopt_confirmed: 'Customer confirmed',
  admin_reenabled: 'Admin re-enabled SMS',
  admin_denied: 'Admin denied request',
};

export const SmsConsentBadge: React.FC<SmsConsentBadgeProps> = ({
  customerId,
  organizationId,
  customerName,
  customerEmail,
}) => {
  const { fetchConsent, fetchAuditLog, consentCache, auditCache, loading } = useSmsConsentStore();
  const cacheKey = `${customerId}:${organizationId}`;
  const consent: SmsConsent | null = consentCache[cacheKey] ?? null;
  const auditLog: SmsAuditEntry[] = auditCache[cacheKey] ?? [];
  const isLoading = loading[cacheKey] ?? false;
  const [showHistory, setShowHistory] = useState(false);
  const [showReoptModal, setShowReoptModal] = useState(false);

  useEffect(() => {
    fetchConsent(customerId, organizationId);
  }, [customerId, organizationId]);

  const handleShowHistory = async () => {
    if (!showHistory && auditLog.length === 0) {
      await fetchAuditLog(customerId, organizationId);
    }
    setShowHistory((v) => !v);
  };

  if (isLoading && !consent) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading SMS status...
      </div>
    );
  }

  const status = consent?.status ?? 'opted_in';

  const badge = () => {
    if (status === 'opted_out') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg text-sm text-red-700 dark:text-red-400 font-medium">
          <XCircle className="w-4 h-4" />
          SMS Disabled - Customer Opted Out
        </div>
      );
    }
    if (status === 'pending_reopt') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg text-sm text-amber-700 dark:text-amber-400 font-medium">
          <Clock className="w-4 h-4" />
          Re-opt-in Pending{consent?.reopt_completed_at ? ' - Customer Confirmed, Awaiting Admin Approval' : ' - Awaiting Customer Confirmation'}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg text-sm text-green-700 dark:text-green-400 font-medium">
        <CheckCircle className="w-4 h-4" />
        SMS Enabled
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <MessageSquare className="w-4 h-4" />
          SMS Status
        </div>
        {badge()}

        <button
          onClick={handleShowHistory}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          {showHistory ? 'Hide History' : 'View History'}
        </button>

        {status === 'opted_out' && (
          <button
            onClick={() => setShowReoptModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Request Re-opt-in
          </button>
        )}
      </div>

      {status === 'opted_out' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/20 rounded-xl text-xs text-red-700 dark:text-red-400">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            SMS messages cannot be sent to this customer. Only a CxTrack administrator can re-enable SMS. Submit a support ticket with proof of customer consent to request re-enablement.
          </span>
        </div>
      )}

      {showHistory && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">SMS Consent History</p>
          {auditLog.length === 0 ? (
            <p className="text-xs text-gray-400">No history recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                      {new Date(entry.created_at).toLocaleDateString('en-CA', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ReoptInModal
        isOpen={showReoptModal}
        onClose={() => setShowReoptModal(false)}
        customerId={customerId}
        organizationId={organizationId}
        customerName={customerName}
        customerEmail={customerEmail}
      />
    </div>
  );
};

export default SmsConsentBadge;
