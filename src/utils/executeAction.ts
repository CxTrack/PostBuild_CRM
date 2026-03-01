import type { ActionProposal, ActionResult, ActionType } from '@/types/copilot-actions.types';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useTaskStore } from '@/stores/taskStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useVoiceAgentStore } from '@/stores/voiceAgentStore';
import { DEFAULT_PERMISSIONS } from '@/config/modules.config';
import { getAuthToken } from '@/utils/auth.utils';
import { interpolateTemplate } from '@/utils/interpolateTemplate';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';

const PERMISSION_MAP: Record<ActionType, string> = {
  create_customer: 'customers.write',
  create_deal: 'pipeline.write',
  create_task: 'tasks.write',
  add_note: 'customers.write',
  send_email: 'customers.read',
  send_sms: 'customers.read',
  draft_call_script: 'customers.read',
  update_voice_agent: 'customers.read', // Any authenticated user can personalize their own agent
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

/**
 * Log a Quarterback action as a customer note so it appears in the
 * customer profile timeline and feeds into the AICustomerSummary RAG.
 * Fire-and-forget: failures are silently logged to console.
 */
async function logQuarterbackActivity(
  actionType: ActionType,
  customerName: string,
  details: string
): Promise<void> {
  try {
    const customerId = await resolveCustomerId(customerName);
    if (!customerId) return;

    const orgId = useOrganizationStore.getState().currentOrganization?.id;
    if (!orgId) return;

    const { data: { user } } = await supabase.auth.getUser();

    const noteTypeMap: Record<string, string> = {
      send_email: 'email',
      send_sms: 'general',
      draft_call_script: 'call',
    };

    const labelMap: Record<string, string> = {
      send_email: 'Email Sent',
      send_sms: 'SMS Sent',
      draft_call_script: 'Call Script Prepared',
    };

    const noteContent = `[AI Quarterback - ${labelMap[actionType] || 'Action'}] ${details}`;

    await supabase
      .from('customer_notes')
      .insert({
        customer_id: customerId,
        organization_id: orgId,
        user_id: user?.id || null,
        note_type: noteTypeMap[actionType] || 'general',
        content: noteContent,
        is_pinned: false,
      });
  } catch (err) {
    console.error('[QB Activity Log] Failed to log activity:', err);
  }
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

        // Log quarterback activity (fire-and-forget)
        logQuarterbackActivity('send_email', editedFields.customer_name || toEmail,
          `Subject: "${subject}" - sent to ${toEmail}`);

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

        // Log quarterback activity (fire-and-forget)
        logQuarterbackActivity('send_sms', editedFields.customer_name || toPhone,
          `SMS sent to ${toPhone}`);

        return {
          success: true,
          message: `SMS sent to ${toPhone}`,
          recordType: 'sms',
        };
      }

      case 'draft_call_script': {
        // Log quarterback activity (fire-and-forget)
        logQuarterbackActivity('draft_call_script', editedFields.customer_name || 'customer',
          `Call script prepared for ${editedFields.customer_name || 'customer'}`);

        return {
          success: true,
          message: `Call script for ${editedFields.customer_name || 'customer'} is ready. Good luck on the call!`,
          recordType: 'call_script',
        };
      }

      case 'update_voice_agent': {
        const orgId = useOrganizationStore.getState().currentOrganization?.id;
        const industry = useOrganizationStore.getState().currentOrganization?.industry_template || 'general_business';

        if (!orgId) {
          return { success: false, message: 'No organization found. Please refresh and try again.' };
        }

        // 1. Fetch the industry template
        const { data: templateData, error: templateError } = await supabase
          .from('industry_voice_templates')
          .select('system_prompt, default_greeting')
          .eq('industry_key', industry)
          .maybeSingle();

        if (templateError || !templateData) {
          // Fallback to general_business
          const { data: fallback } = await supabase
            .from('industry_voice_templates')
            .select('system_prompt, default_greeting')
            .eq('industry_key', 'general_business')
            .single();

          if (!fallback) {
            return { success: false, message: 'Could not load voice agent template. Please try again.' };
          }
          Object.assign(templateData || {}, fallback);
        }

        const template = templateData!;

        // 2. Build variables from editedFields
        const variables: Record<string, string> = {};
        for (const [key, value] of Object.entries(editedFields)) {
          if (value && typeof value === 'string') {
            variables[key] = value;
          }
        }

        // 3. Interpolate the template with personalization values
        const interpolatedPrompt = interpolateTemplate(template.system_prompt, variables);
        const interpolatedGreeting = interpolateTemplate(template.default_greeting || '', variables);

        // 4. Push updated prompt to Retell via the store
        const voiceStore = useVoiceAgentStore.getState();
        const updateResult = await voiceStore.updateRetellAgent({
          generalPrompt: interpolatedPrompt,
          beginMessage: interpolatedGreeting || undefined,
        });

        if (!updateResult.success) {
          return {
            success: false,
            message: updateResult.error || 'Failed to update voice agent. Please try again.',
          };
        }

        // 5. Save personalization values to voice_agent_configs
        const config = useVoiceAgentStore.getState().config;
        if (config) {
          await supabase
            .from('voice_agent_configs')
            .update({
              personalization_values: variables,
              general_prompt: interpolatedPrompt,
              begin_message: interpolatedGreeting || config.begin_message,
              updated_at: new Date().toISOString(),
            })
            .eq('id', config.id);

          // Refresh store
          await useVoiceAgentStore.getState().fetchConfig();
        }

        return {
          success: true,
          message: 'Your AI phone agent has been personalized and updated successfully!',
          recordType: 'voice_agent',
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
