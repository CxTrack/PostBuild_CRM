import type { ActionProposal, ActionResult, ActionType } from '@/types/copilot-actions.types';
import { useCustomerStore } from '@/stores/customerStore';
import { useDealStore } from '@/stores/dealStore';
import { useTaskStore } from '@/stores/taskStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { DEFAULT_PERMISSIONS } from '@/config/modules.config';

const PERMISSION_MAP: Record<ActionType, string> = {
  create_customer: 'customers.write',
  create_deal: 'pipeline.write',
  create_task: 'tasks.write',
  add_note: 'customers.write',
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
