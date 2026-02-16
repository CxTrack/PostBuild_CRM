import type { ActionProposal } from '@/types/copilot-actions.types';

interface ParsedResponse {
  textContent: string;
  action: ActionProposal | null;
}

export function parseActionProposal(rawResponse: string): ParsedResponse {
  const actionRegex = /```ACTION_PROPOSAL\s*\n([\s\S]*?)\n```/;
  const match = rawResponse.match(actionRegex);

  if (!match) {
    return { textContent: rawResponse, action: null };
  }

  try {
    const actionData = JSON.parse(match[1]);

    if (!actionData.actionType || !actionData.fields || !Array.isArray(actionData.fields)) {
      return { textContent: rawResponse, action: null };
    }

    const textContent = rawResponse.replace(actionRegex, '').trim();

    return {
      textContent,
      action: {
        actionType: actionData.actionType,
        label: actionData.label || 'Perform action',
        fields: actionData.fields.map((f: any) => ({
          key: f.key || '',
          label: f.label || f.key || '',
          value: f.value ?? '',
          type: f.type || 'text',
          required: f.required ?? false,
          options: f.options,
          editable: f.editable ?? true,
        })),
      },
    };
  } catch {
    return { textContent: rawResponse, action: null };
  }
}
