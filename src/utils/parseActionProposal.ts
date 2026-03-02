import type { ActionProposal, ChoiceOption, ChoicesConfig } from '@/types/copilot-actions.types';

interface ParsedResponse {
  textContent: string;
  action: ActionProposal | null;
  choicesConfig: ChoicesConfig | null;
  /** AI-generated follow-up choices (rendered as single-select ChoiceCard) */
  followUpChoices: ChoiceOption[] | null;
}

export function parseActionProposal(rawResponse: string): ParsedResponse {
  const actionRegex = /```ACTION_PROPOSAL\s*\n([\s\S]*?)\n```/;
  const choiceRegex = /```CHOICE_OPTIONS\s*\n([\s\S]*?)\n```/;
  const choiceProposalRegex = /```CHOICE_PROPOSAL\s*\n([\s\S]*?)\n```/;

  let textContent = rawResponse;
  let action: ActionProposal | null = null;
  let choicesConfig: ChoicesConfig | null = null;
  let followUpChoices: ChoiceOption[] | null = null;

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

  // Parse CHOICE_PROPOSAL block (AI-generated clickable follow-up options)
  const proposalMatch = textContent.match(choiceProposalRegex);
  if (proposalMatch) {
    try {
      const proposalData = JSON.parse(proposalMatch[1]);
      if (proposalData.choices && Array.isArray(proposalData.choices)) {
        textContent = textContent.replace(choiceProposalRegex, '').trim();
        followUpChoices = proposalData.choices.map((c: any) => ({
          id: c.id || c.label?.toLowerCase().replace(/\s+/g, '_') || '',
          label: c.label || '',
          description: c.description || '',
          icon: c.icon || 'Pencil',
        }));
      }
    } catch {
      // Invalid JSON -- skip choice proposal parsing
    }
  }

  // Fallback: strip any remaining A/B/C/D text-based options the AI might output
  // Matches patterns like "A) ...", "A. ...", "a) ...", "1) ...", "1. ..."
  textContent = textContent.replace(
    /\n\s*[A-Da-d1-4][.)]\s+.+(?:\s*--\s*.+)?$/gm,
    ''
  ).trim();

  return { textContent, action, choicesConfig, followUpChoices };
}
