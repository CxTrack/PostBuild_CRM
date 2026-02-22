import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { Modal, Button } from '@/components/theme/ThemeComponents';
import { useSmsConsentStore } from '@/stores/smsConsentStore';
import { useNotificationStore } from '@/stores/notificationStore';
import toast from 'react-hot-toast';

interface ReoptInModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  organizationId: string;
  customerName?: string;
  customerEmail?: string;
}

export const ReoptInModal: React.FC<ReoptInModalProps> = ({
  isOpen,
  onClose,
  customerId,
  organizationId,
  customerName,
  customerEmail,
}) => {
  const [step, setStep] = useState<'info' | 'sent'>('info');
  const [loading, setLoading] = useState(false);
  const { requestReoptIn, fetchConsent } = useSmsConsentStore();
  const { addOptimistic } = useNotificationStore();

  const handleSend = async () => {
    setLoading(true);
    try {
      const result = await requestReoptIn(customerId, organizationId);
      if (result.success) {
        setStep('sent');
        // Refresh consent status
        await fetchConsent(customerId, organizationId);
        toast.success('Re-opt-in email sent to customer');
      } else {
        toast.error(result.error || 'Failed to send re-opt-in email');
      }
    } catch {
      toast.error('Failed to send re-opt-in email');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request SMS Re-opt-in"
      maxWidth="sm"
    >
      {step === 'info' && (
        <div className="space-y-5">
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">How this works</p>
              <ol className="text-xs text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>An email will be sent to {customerEmail || 'the customer'} asking if they want to receive SMS again.</li>
                <li>The customer must click the verification link in the email to confirm.</li>
                <li>CxTrack Admin will be notified and must approve the re-enablement.</li>
                <li>SMS will remain disabled until admin approves.</li>
              </ol>
            </div>
          </div>

          {customerName && (
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-600 dark:text-gray-400">
              Sending request to: <span className="font-semibold text-gray-900 dark:text-gray-200">{customerName}</span>
              {customerEmail && (
                <span className="block text-xs text-gray-400 mt-0.5">{customerEmail}</span>
              )}
            </div>
          )}

          {!customerEmail && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              This customer does not have an email address on file. Please add an email to their profile before requesting re-opt-in.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={loading || !customerEmail}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {loading ? 'Sending...' : 'Send Re-opt-in Email'}
            </Button>
          </div>
        </div>
      )}

      {step === 'sent' && (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Email Sent!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
              A re-opt-in email has been sent to <strong>{customerEmail}</strong>. The customer must click the link to confirm, then admin must approve before SMS is re-enabled.
            </p>
          </div>
          <div className="flex justify-center">
            <Button variant="primary" onClick={handleClose}>Done</Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ReoptInModal;
