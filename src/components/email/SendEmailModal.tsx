/**
 * SendEmailModal
 * Compose and send email via user's connected Gmail/Outlook OAuth account.
 * Falls back with a helpful message if no email account is connected.
 */
import React, { useState } from 'react';
import { X, Mail, Send, Loader2, AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '@/utils/auth.utils';
import toast from 'react-hot-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
}

const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  customerEmail = '',
  customerName = '',
}) => {
  const navigate = useNavigate();
  const [toEmail, setToEmail] = useState(customerEmail);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [noConnection, setNoConnection] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!toEmail.trim()) {
      toast.error('Please enter a recipient email');
      return;
    }
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!body.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    setNoConnection(false);

    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in again.');
        return;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-user-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: toEmail.trim(),
          subject: subject.trim(),
          body_text: body.trim(),
          body_html: `<div style="font-family: sans-serif; line-height: 1.6;">${body.trim().replace(/\n/g, '<br>')}</div>`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'no_email_connected') {
          setNoConnection(true);
          return;
        }
        toast.error(data.error || 'Failed to send email. Please try again.');
        return;
      }

      toast.success(`Email sent to ${toEmail}`);
      onClose();
      // Reset form
      setSubject('');
      setBody('');
    } catch {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/dashboard/settings?tab=email');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Send Email</h2>
              {customerName && (
                <p className="text-xs text-gray-500 dark:text-gray-400">to {customerName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* No Connection Warning */}
        {noConnection && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  No email account connected
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Connect your Gmail, Outlook, or configure custom SMTP in Settings to send emails directly from the CRM.
                </p>
                <button
                  onClick={handleGoToSettings}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Go to Email Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* To */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              To
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Body */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={6}
              className="w-full px-4 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none transition-colors resize-y min-h-[120px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-5 py-2.5 text-sm font-medium rounded-lg text-white bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendEmailModal;
