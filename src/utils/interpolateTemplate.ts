/**
 * Interpolate template variables in a string.
 *
 * Replaces {variable_name} placeholders with provided values.
 * Handles {{double_brace}} syntax by leaving it untouched (used by Retell for dynamic variables like {{current_time}}).
 * Unreplaced {single_brace} placeholders are cleaned up gracefully.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string>
): string {
  if (!template) return '';

  let result = template;

  // First, temporarily protect {{double_brace}} tokens (Retell dynamic variables)
  const doubleBraceTokens: string[] = [];
  result = result.replace(/\{\{([^}]+)\}\}/g, (_match, inner) => {
    const idx = doubleBraceTokens.length;
    doubleBraceTokens.push(inner);
    return `__DOUBLE_BRACE_${idx}__`;
  });

  // Replace {variable_name} with provided values
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== null && value !== '') {
      result = result.replaceAll(`{${key}}`, value);
    }
  }

  // Clean up any remaining unreplaced {var} placeholders
  // Only remove simple single-word placeholders to avoid breaking structured content
  result = result.replace(/\{([a-z_]+)\}/g, '');

  // Restore {{double_brace}} tokens
  result = result.replace(/__DOUBLE_BRACE_(\d+)__/g, (_match, idx) => {
    return `{{${doubleBraceTokens[parseInt(idx)]}}}`;
  });

  // Clean up any double spaces or trailing whitespace left by removed placeholders
  result = result.replace(/  +/g, ' ');

  return result;
}

/**
 * Extract variable names from a template string.
 * Returns an array of variable keys found in {single_brace} format.
 */
export function extractTemplateVariables(template: string): string[] {
  if (!template) return [];

  const variables = new Set<string>();
  const regex = /\{([a-z_]+)\}/g;
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }

  return Array.from(variables);
}
