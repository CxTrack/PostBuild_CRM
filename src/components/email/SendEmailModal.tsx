/**
 * SendEmailModal
 * Compose and send email via user's connected Gmail/Outlook OAuth account.
 * Supports industry email templates with variable substitution.
 * Falls back with a helpful message if no email account is connected.
 *
 * v2: Double-click prevention, email-sent event for AI Summary refresh,
 *     sync trigger after send, reply threading support.
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Mail, Send, Loader2, AlertCircle, Settings, FileText, ChevronDown, Reply } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAuthToken } from '@/utils/auth.utils';
import { useOrganizationStore } from '@/stores/organizationStore';
import { substituteTemplateVars } from '@/services/sms.service';
import toast from 'react-hot-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface EmailTemplate {
  id: string;
  template_key: string;
  category: string;
  name: string;
  subject: string;
  body_text: string;
  variables: string[];
}

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail?: string;
  customerName?: string;
  customerId?: string;
  organizationId?: string;
  /** Extra template variables (e.g. quote_total, invoice_number) */
  templateVars?: Record<string, string>;
  /** Reply mode: pre-populate with reply context */
  replyTo?: {
    subject: string;
    messageId?: string;
    conversationId?: string;
    senderEmail?: string;
  };
  /** Callback fired after a successful send (e.g. to refresh parent data) */
  onEmailSent?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  follow_up: 'Follow-Up',
  quote: 'Quotes',
  invoice: 'Invoices',
  appointment: 'Appointments',
  general: 'General',
};

const SendEmailModal: React.FC<SendEmailModalProps> = ({
  isOpen,
  onClose,
  customerEmail = '',
  customerName = '',
  customerId,
  organizationId,
  templateVars = {},
  replyTo,
  onEmailSent,
}) => {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganizationStore();
  const [toEmail, setToEmail] = useState(customerEmail);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [noConnection, setNoConnection] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const sendClickedRef = useRef(false); // Double-click guard

  const orgId = organizationId || currentOrganization?.id;
  const isReply = !!replyTo;

  // Reset form when customer changes or reply mode activates
  useEffect(() => {
    if (isOpen) {
      setToEmail(replyTo?.senderEmail || customerEmail);
      setNoConnection(false);
      sendClickedRef.current = false;

      // Pre-populate reply subject
      if (replyTo?.subject) {
        const replySubject = replyTo.subject.startsWith('Re: ')
          ? replyTo.subject
          : `Re: ${replyTo.subject}`;
        setSubject(replySubject);
      }
    }
  }, [isOpen, customerEmail, replyTo]);

  // Fetch templates when modal opens
  useEffect(() => {
    if (!isOpen || !currentOrganization?.industry_template) return;

    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        const raw = tokenKey ? localStorage.getItem(tokenKey) : null;
        const token = raw ? JSON.parse(raw)?.access_token : null;
        if (!token) return;

        const industry = currentOrganization.industry_template;
        // Fetch system templates (org_id is null) + org-specific templates
        const url = `${SUPABASE_URL}/rest/v1/email_templates?industry=eq.${industry}&is_active=eq.true&or=(organization_id.is.null,organization_id.eq.${orgId})&order=sort_order.asc&select=id,template_key,category,name,subject,body_text,variables`;

        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setTemplates(data || []);
        }
      } catch {
        // Silent -- templates are supplementary
      } finally {
        setLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [isOpen, currentOrganization?.industry_template, orgId]);

  if (!isOpen) return null;

  const handleSelectTemplate = (template: EmailTemplate) => {
    // Build substitution variables
    const vars: Record<string, string> = {
      customer_name: customerName || '',
      business_name: currentOrganization?.name || '',
      user_name: '', // Will be filled if we have user info
      user_email: '',
      user_phone: '',
      ...templateVars,
    };

    const substitutedSubject = substituteTemplateVars(template.subject, vars);
    const substitutedBody = substituteTemplateVars(template.body_text, vars);

    setSubject(substitutedSubject);
    setBody(substitutedBody);
    setSelectedTemplateKey(template.template_key);
    setShowTemplates(false);
  };

  const handleSend = async () => {
    // Double-click guard
    if (sendClickedRef.current || sending) return;

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

    sendClickedRef.current = true;
    setSending(true);
    setNoConnection(false);

    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error('Please sign in again.');
        return;
      }

      const payload: Record<string, unknown> = {
        to_email: toEmail.trim(),
        subject: subject.trim(),
        body_text: body.trim(),
        body_html: `<div style="font-family: sans-serif; line-height: 1.6;">${body.trim().replace(/\n/g, '<br>')}</div>`,
        customer_id: customerId || null,
        organization_id: orgId || null,
        template_key: selectedTemplateKey || null,
      };

      // Reply threading headers
      if (replyTo?.messageId) {
        payload.in_reply_to = replyTo.messageId;
        payload.references = replyTo.messageId;
      }
      if (replyTo?.conversationId) {
        payload.conversation_id = replyTo.conversationId;
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-user-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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

      // Dispatch custom event so AI Summary and other components can refresh
      window.dispatchEvent(new CustomEvent('email-sent', {
        detail: { customerId, toEmail: toEmail.trim(), subject: subject.trim() },
      }));

      // Fire the callback for parent components
      onEmailSent?.();

      onClose();
      // Reset form
      setSubject('');
      setBody('');
      setSelectedTemplateKey('');
    } catch {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setSending(false);
      sendClickedRef.current = false;
    }
  };

  const handleGoToSettings = () => {
    onClose();
    navigate('/dashboard/settings?tab=email');
  };

  // Group templates by category
  const templatesByCategory = templates.reduce<Record<string, EmailTemplate[]>>((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isReply ? 'bg-green-50 dark:bg-green-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              {isReply ? (
                <Reply className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isReply ? 'Reply' : 'Send Email'}
              </h2>
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
          {/* Template Picker */}
          {templates.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors w-full"
              >
                <FileText className="w-4 h-4 text-indigo-500" />
                <span className="flex-1 text-left">
                  {selectedTemplateKey
                    ? templates.find(t => t.template_key === selectedTemplateKey)?.name || 'Select Template'
                    : 'Use a template...'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
              </button>

              {showTemplates && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        {CATEGORY_LABELS[category] || category}
                      </div>
                      {categoryTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.subject}</p>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
