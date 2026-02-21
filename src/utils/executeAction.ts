import type { ActionProposal, ActionResult, ActionType } from '@/types/copilot-actions.types';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useTaskStore } from '@/stores/taskStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { DEFAULT_PERMISSIONS } from '@/config/modules.config';
import { getAuthToken } from '@/utils/auth.utils';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

const PERMISSION_MAP: Record<ActionType, string> = {
  create_customer: 'customers.write',
  create_deal: 'pipeline.write',
  create_task: 'tasks.write',
  add_note: 'customers.write',
  send_email: 'customers.read',
  send_sms: 'customers.read',
  draft_call_script: 'customers.read',
};

export function checkActionPermission(actionType: ActionType): boolean {
  const membership = useOrganizationStore.getState().currentMembership;
  const role = membership?.role || 'user';
  const permissions = DEFAULT_PERMISSIONS[role] || [];
  return permissions.includes(PERMISSION_MAP[actionType]);
}

async function resolveCustomerId(customerName: string): Promise<string | null> {
  const store = useCustomerStore.getState();
  if (store.customers.length === 0) {
    await store.fetchCustomers();
  }
  const customers = useCustomerStore.getState().customers;
  const lowerName = customerName.toLowerCase().trim();

  // Exact match
  const exact = customers.find(c => c.name?.toLowerCase() === lowerName);
  if (exact) return exact.id;

  // Partial match (name contains search term)
  const partial = customers.find(c => c.name?.toLowerCase().includes(lowerName));
  if (partial) return partial.id;

  // Try first+last separately
  const parts = lowerName.split(/\s+/);
  if (parts.length >= 2) {
    const match = customers.find(c => {
      const name = c.name?.toLowerCase() || '';
      return parts.every(p => name.includes(p));
    });
    if (match) return match.id;
  }

  return null;
}

export async function executeAction(
  action: ActionProposal,
  editedFields: Record<string, any>
): Promise<ActionResult> {
  if (!checkActionPermission(action.actionType)) {
    return {
      success: false,
      message: "You don't have permission to perform this action. Contact your admin.",
    };
  }

  try {
    switch (action.actionType) {
      case 'create_customer': {
        const customer = await useCustomerStore.getState().createCustomer({
          first_name: editedFields.first_name || '',
          last_name: editedFields.last_name || '',
          email: editedFields.email || undefined,
          phone: editedFields.phone || undefined,
          company: editedFields.company || undefined,
        });
        if (!customer) {
          return { success: false, message: 'Failed to create customer. Please try again.' };
        }
        return {
          success: true,
          message: `Customer "${customer.name}" created successfully`,
          recordId: customer.id,
          recordType: 'customer',
        };
      }

      case 'create_deal': {
        const customerName = editedFields.customer_name || '';
        const customerId = await resolveCustomerId(customerName);
        if (!customerId) {
          return {
            success: false,
            message: `Could not find customer "${customerName}". Check the name and try again.`,
          };
        }
        const deal = await useDealStore.getState().createDeal({
          customer_id: customerId,
          title: editedFields.title || 'New Deal',
          value: parseFloat(editedFields.value) || 0,
          stage: editedFields.stage || 'lead',
          description: editedFields.description || undefined,
          expected_close_date: editedFields.expected_close_date || undefined,
        });
        return {
          success: true,
          message: `Deal "${deal.title}" created for $${Number(deal.value).toLocaleString()}`,
          recordId: deal.id,
          recordType: 'deal',
        };
      }

      case 'create_task': {
        const customerName = editedFields.customer_name || '';
        const customerId = await resolveCustomerId(customerName);
        if (!customerId) {
          return {
            success: false,
            message: `Could not find customer "${customerName}". Check the name and try again.`,
          };
        }
        const task = await useTaskStore.getState().createTask({
          customer_id: customerId,
          title: editedFields.title || 'New Task',
          due_date: editedFields.due_date || new Date().toISOString().split('T')[0],
          type: editedFields.type || 'other',
          priority: editedFields.priority || 'medium',
          description: editedFields.description || undefined,
        });
        return {
          success: true,
          message: `Task "${task.title}" created successfully`,
          recordId: task.id,
          recordType: 'task',
        };
      }

      case 'add_note': {
        const customerName = editedFields.customer_name || '';
        const customerId = await resolveCustomerId(customerName);
        if (!customerId) {
          return {
            success: false,
            message: `Could not find customer "${customerName}". Check the name and try again.`,
          };
        }
        await useCustomerStore.getState().addNote({
          customer_id: customerId,
          content: editedFields.content || 'Note from CoPilot',
        });
        return {
          success: true,
          message: `Note added to ${customerName}`,
          recordType: 'note',
        };
      }

      case 'send_email': {
        const toEmail = editedFields.to_email || '';
        const subject = editedFields.subject || '';
        const body = editedFields.body || '';

        if (!toEmail || !subject || !body) {
          return { success: false, message: 'Email requires a recipient, subject, and body.' };
        }

        const token = await getAuthToken();
        if (!token) {
          return { success: false, message: 'Authentication required. Please refresh and try again.' };
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-user-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to_email: toEmail,
            subject,
            body_text: body,
            body_html: `<div style="font-family: sans-serif; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Special case: no email connected
          if (data.error === 'no_email_connected') {
            return {
              success: false,
              message: 'No email account connected. Go to Settings > Email to connect your Gmail or Outlook.',
            };
          }
          return { success: false, message: data.error || 'Failed to send email. Please try again.' };
        }

        return {
          success: true,
          message: `Email sent to ${toEmail}`,
          recordType: 'email',
        };
      }

      case 'send_sms': {
        const toPhone = editedFields.to_phone || '';
        const messageBody = editedFields.message_body || '';

        if (!toPhone || !messageBody) {
          return { success: false, message: 'SMS requires a phone number and message body.' };
        }

        const smsToken = await getAuthToken();
        if (!smsToken) {
          return { success: false, message: 'Authentication required. Please refresh and try again.' };
        }

        const smsResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${smsToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: toPhone,
            body: messageBody,
          }),
        });

        const smsData = await smsResponse.json();

        if (!smsResponse.ok) {
          return { success: false, message: smsData.error || 'Failed to send SMS. Please try again.' };
        }

        return {
          success: true,
          message: `SMS sent to ${toPhone}`,
          recordType: 'sms',
        };
      }

      case 'draft_call_script': {
        // Call scripts are display-only — confirming just acknowledges the user has the script
        return {
          success: true,
          message: `Call script for ${editedFields.customer_name || 'customer'} is ready. Good luck on the call!`,
          recordType: 'call_script',
        };
      }

      default:
        return { success: false, message: `Unknown action type: ${action.actionType}` };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'An unexpected error occurred. Please try again.',
    };
  }
}
