import type { ActionProposal, ChoicesConfig } from '@/types/copilot-actions.types';

interface ParsedResponse {
  textContent: string;
  action: ActionProposal | null;
  choicesConfig: ChoicesConfig | null;
}

export function parseActionProposal(rawResponse: string): ParsedResponse {
  const actionRegex = /```ACTION_PROPOSAL\s*\n([\s\S]*?)\n```/;
  const choiceRegex = /```CHOICE_OPTIONS\s*\n([\s\S]*?)\n```/;

  let textContent = rawResponse;
  let action: ActionProposal | null = null;
  let choicesConfig: ChoicesConfig | null = null;

  // Parse ACTION_PROPOSAL block
  const actionMatch = rawResponse.match(actionRegex);
  if (actionMatch) {
    try {
      const actionData = JSON.parse(actionMatch[1]);
      if (actionData.actionType && actionData.fields && Array.isArray(actionData.fields)) {
        textContent = textContent.replace(actionRegex, '').trim();
        action = {
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
        };
      }
    } catch {
      // Invalid JSON -- skip action parsing
    }
  }

  // Parse CHOICE_OPTIONS block
  const choiceMatch = textContent.match(choiceRegex);
  if (choiceMatch) {
    try {
      const choiceData = JSON.parse(choiceMatch[1]);
      if (choiceData.options && Array.isArray(choiceData.options)) {
        textContent = textContent.replace(choiceRegex, '').trim();
        choicesConfig = {
          options: choiceData.options.map((o: any) => ({
            id: o.id || '',
            label: o.label || '',
            description: o.description || '',
            icon: o.icon || 'Pencil',
          })),
          multiSelect: choiceData.multiSelect ?? false,
          allowOther: choiceData.allowOther ?? true,
          otherPlaceholder: choiceData.otherPlaceholder || 'Type your answer...',
          progressLabel: choiceData.progressLabel,
        };
      }
    } catch {
      // Invalid JSON -- skip choice parsing
    }
  }

  return { textContent, action, choicesConfig };
}
