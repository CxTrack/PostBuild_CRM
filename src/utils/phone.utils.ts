
/**
 * Phone number formatting utilities for consistent display across the app.
 * Supports international E.164 format with per-country display formatting.
 */

import { parseE164Country } from '@/constants/countries';

/** Format national digits for +1 (North American) display */
function formatNorthAmericanDisplay(nationalDigits: string): string {
  if (nationalDigits.length === 10) {
    return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6)}`;
  }
  // Partial or unusual length -- format what we have
  if (nationalDigits.length <= 3) return `(${nationalDigits}`;
  if (nationalDigits.length <= 6) return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3)}`;
  return `(${nationalDigits.slice(0, 3)}) ${nationalDigits.slice(3, 6)}-${nationalDigits.slice(6, 10)}`;
}

/** Format national digits with simple space grouping */
function formatSpaceGrouped(nationalDigits: string): string {
  const parts: string[] = [];
  let i = 0;
  while (i < nationalDigits.length) {
    const remaining = nationalDigits.length - i;
    const chunk = remaining > 4 ? 3 : remaining;
    parts.push(nationalDigits.slice(i, i + chunk));
    i += chunk;
  }
  return parts.join(' ');
}

// Format phone for display (international-aware)
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';

  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // Try to parse as E.164
  if (hasPlus || digits.length > 10) {
    const e164 = hasPlus ? phone : `+${digits}`;
    const { country, nationalNumber } = parseE164Country(e164);

    if (country) {
      if (country.dialCode === '+1') {
        return `+1 ${formatNorthAmericanDisplay(nationalNumber)}`;
      }
      return `${country.dialCode} ${formatSpaceGrouped(nationalNumber)}`;
    }

    // Unknown dial code -- basic formatting
    return `+${formatSpaceGrouped(digits)}`;
  }

  // Bare 10-digit number -- assume North American
  if (digits.length === 10) {
    return formatNorthAmericanDisplay(digits);
  }

  // Fallback: return cleaned number
  return phone;
}

// Format phone for storage (E.164 digits with +)
export function formatPhoneForStorage(phone: string | null | undefined): string {
  if (!phone) return '';

  // Strip all non-digit chars except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // Already has + prefix -- return cleaned E.164
  if (hasPlus) {
    return `+${digits}`;
  }

  // Add +1 for bare 10-digit numbers (backward compat for North American default)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // 11+ digits without + -- prepend +
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return digits;
}

// Create tel: link for phone calls
export function getPhoneLink(phone: string | null | undefined): string {
  if (!phone) return '';
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // If already E.164, use directly
  if (hasPlus) {
    return `tel:+${digits}`;
  }

  // Bare 10 digits -- assume +1
  if (digits.length === 10) {
    return `tel:+1${digits}`;
  }

  // 11 digits starting with 1 -- assume North American with country code
  if (digits.length === 11 && digits.startsWith('1')) {
    return `tel:+${digits}`;
  }

  return `tel:+${digits}`;
}

// Validate phone number (basic check)
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true; // Empty is valid (use required separately)
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}
