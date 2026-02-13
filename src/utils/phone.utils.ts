
/**
 * Phone number formatting utilities for consistent display across the app.
 */

// Format phone for display (North American format with international support)
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // North American format: (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // With country code: +1 (XXX) XXX-XXXX
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // International format: +XX XXX XXX XXXX
  if (hasPlus || digits.length > 10) {
    const formatted = digits.replace(/(\d{2,3})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
    return formatted.startsWith('+') ? formatted : `+${formatted}`;
  }

  // Fallback: return cleaned number
  return phone;
}

// Format phone for storage (digits only, with country code)
export function formatPhoneForStorage(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  if (!digits) return '';

  // Add country code if missing (assume +1 for 10-digit numbers)
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // Already has country code
  if (digits.length > 10) {
    return `+${digits}`;
  }

  return digits;
}

// Create tel: link for phone calls
export function getPhoneLink(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits ? `tel:+${digits.startsWith('1') ? '' : '1'}${digits}` : '';
}

// Validate phone number (basic check)
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true; // Empty is valid (use required separately)
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}
