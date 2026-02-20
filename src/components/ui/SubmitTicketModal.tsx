import React, { useState } from 'react';
import { Loader2, Send, TicketCheck } from 'lucide-react';
import { Modal, Input, Select, Button } from '../theme/ThemeComponents';
import { useTicketStore } from '@/stores/ticketStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useAuthStore } from '@/stores/authStore';
import { supabaseUrl } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface SubmitTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: 'help_center' | 'customer_profile' | 'bug_report';
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'billing', label: 'Billing' },
  { value: 'data_request', label: 'Data Request (DSAR)' },
  { value: 'account_issue', label: 'Account Issue' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

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

export const SubmitTicketModal: React.FC<SubmitTicketModalProps> = ({
  isOpen,
  onClose,
  source,
  customerId,
  customerName,
  customerEmail,
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(source === 'bug_report' ? 'bug_report' : 'general');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const { createTicket } = useTicketStore();
  const currentOrganization = useOrganizationStore((s) => s.currentOrganization);
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setCategory(source === 'bug_report' ? 'bug_report' : 'general');
    setPriority('normal');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const ticket = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category: category as any,
        priority: priority as any,
        source,
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        organization_name: currentOrganization?.name,
      });

      // Fire-and-forget email notification
      const token = getAuthToken();
      if (token) {
        const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-ticket-notification`;
        fetch(edgeFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'support_ticket',
            ticketId: ticket.id,
            subject: subject.trim(),
            description: description.trim(),
            userName: profile?.full_name || user?.email || 'Unknown',
            userEmail: user?.email || '',
            organizationName: currentOrganization?.name,
            category,
            priority,
            customerName,
          }),
        }).catch(() => { /* non-blocking */ });
      }

      toast.success('Support ticket submitted successfully');
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const modalTitle = source === 'bug_report'
    ? 'Report a Bug'
    : source === 'customer_profile'
      ? 'Submit Support Ticket'
      : 'Submit a Support Ticket';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer context badge */}
        {customerName && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-800/20 rounded-xl">
            <TicketCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ticket related to: <span className="font-semibold">{customerName}</span>
              {customerEmail && <span className="text-blue-500 dark:text-blue-400"> ({customerEmail})</span>}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your issue"
            required
            className="w-full"
          />

          {/* Textarea — no ThemeComponent for this, use manual styling matching Input */}
          <div className="w-full">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue in detail..."
              required
              rows={5}
              className="
                w-full px-4 py-2.5
                bg-white dark:bg-gray-700
                border-2 border-gray-200 dark:border-gray-600
                rounded-xl
                focus:border-primary-500 focus:ring-2 focus:ring-primary-500
                transition-all
                text-gray-900 dark:text-white
                placeholder:text-gray-400 dark:placeholder:text-gray-500
                resize-none
              "
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={CATEGORY_OPTIONS}
              className="w-full"
            />

            <Select
              label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={PRIORITY_OPTIONS}
              className="w-full"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SubmitTicketModal;
