/**
 * Canonical country data for phone dial codes, address dropdowns, and currency display.
 * Single source of truth across the entire app.
 */

export interface CountryData {
  iso: string;            // ISO 3166-1 alpha-2
  name: string;           // Full English name
  flag: string;           // Emoji flag
  dialCode: string;       // ITU dial code with + prefix
  currency: string;       // ISO 4217 code
  currencySymbol: string; // Display symbol
}

/** Default country ISO code */
export const DEFAULT_COUNTRY_ISO = 'CA';

/** All supported countries -- Canada & US first, then alphabetical by name */
export const COUNTRIES: CountryData[] = [
  { iso: 'CA', name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', dialCode: '+1', currency: 'CAD', currencySymbol: '$' },
  { iso: 'US', name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', dialCode: '+1', currency: 'USD', currencySymbol: '$' },
  { iso: 'AU', name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', dialCode: '+61', currency: 'AUD', currencySymbol: '$' },
  { iso: 'BE', name: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}', dialCode: '+32', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'BR', name: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}', dialCode: '+55', currency: 'BRL', currencySymbol: 'R$' },
  { iso: 'CN', name: 'China', flag: '\u{1F1E8}\u{1F1F3}', dialCode: '+86', currency: 'CNY', currencySymbol: '\u00A5' },
  { iso: 'FR', name: 'France', flag: '\u{1F1EB}\u{1F1F7}', dialCode: '+33', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'DE', name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', dialCode: '+49', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'HK', name: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}', dialCode: '+852', currency: 'HKD', currencySymbol: '$' },
  { iso: 'IN', name: 'India', flag: '\u{1F1EE}\u{1F1F3}', dialCode: '+91', currency: 'INR', currencySymbol: '\u20B9' },
  { iso: 'IE', name: 'Ireland', flag: '\u{1F1EE}\u{1F1EA}', dialCode: '+353', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'IT', name: 'Italy', flag: '\u{1F1EE}\u{1F1F9}', dialCode: '+39', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'JP', name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}', dialCode: '+81', currency: 'JPY', currencySymbol: '\u00A5' },
  { iso: 'MX', name: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}', dialCode: '+52', currency: 'MXN', currencySymbol: '$' },
  { iso: 'NL', name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', dialCode: '+31', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'NZ', name: 'New Zealand', flag: '\u{1F1F3}\u{1F1FF}', dialCode: '+64', currency: 'NZD', currencySymbol: '$' },
  { iso: 'NG', name: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}', dialCode: '+234', currency: 'NGN', currencySymbol: '\u20A6' },
  { iso: 'PK', name: 'Pakistan', flag: '\u{1F1F5}\u{1F1F0}', dialCode: '+92', currency: 'PKR', currencySymbol: '\u20A8' },
  { iso: 'PH', name: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}', dialCode: '+63', currency: 'PHP', currencySymbol: '\u20B1' },
  { iso: 'SA', name: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}', dialCode: '+966', currency: 'SAR', currencySymbol: '\uFDFC' },
  { iso: 'SG', name: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}', dialCode: '+65', currency: 'SGD', currencySymbol: '$' },
  { iso: 'KR', name: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}', dialCode: '+82', currency: 'KRW', currencySymbol: '\u20A9' },
  { iso: 'ZA', name: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}', dialCode: '+27', currency: 'ZAR', currencySymbol: 'R' },
  { iso: 'ES', name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', dialCode: '+34', currency: 'EUR', currencySymbol: '\u20AC' },
  { iso: 'CH', name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}', dialCode: '+41', currency: 'CHF', currencySymbol: 'CHF' },
  { iso: 'TH', name: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}', dialCode: '+66', currency: 'THB', currencySymbol: '\u0E3F' },
  { iso: 'TR', name: 'Turkey', flag: '\u{1F1F9}\u{1F1F7}', dialCode: '+90', currency: 'TRY', currencySymbol: '\u20BA' },
  { iso: 'AE', name: 'United Arab Emirates', flag: '\u{1F1E6}\u{1F1EA}', dialCode: '+971', currency: 'AED', currencySymbol: '\u062F.\u0625' },
  { iso: 'GB', name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', dialCode: '+44', currency: 'GBP', currencySymbol: '\u00A3' },
];

// Unique dial codes sorted longest-first for unambiguous parsing
const DIAL_CODES_SORTED = [...new Set(COUNTRIES.map(c => c.dialCode))]
  .sort((a, b) => b.length - a.length);

/** Look up a country by ISO code */
export function getCountryByIso(iso: string): CountryData | undefined {
  return COUNTRIES.find(c => c.iso === iso.toUpperCase());
}

/** Get all countries sharing a dial code (e.g. +1 returns CA and US) */
export function getCountriesByDialCode(dialCode: string): CountryData[] {
  const code = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES.filter(c => c.dialCode === code);
}

/**
 * Parse an E.164 phone string into country + national number.
 * Matches longest dial code first to avoid ambiguity (e.g. +852 before +8).
 * For +1 numbers, defaults to CA unless isoHint is provided.
 */
export function parseE164Country(
  e164: string,
  isoHint?: string
): { country: CountryData | null; nationalNumber: string } {
  if (!e164) return { country: null, nationalNumber: '' };

  const digits = e164.replace(/[^\d+]/g, '');
  const normalized = digits.startsWith('+') ? digits : `+${digits}`;

  for (const code of DIAL_CODES_SORTED) {
    if (normalized.startsWith(code)) {
      const national = normalized.slice(code.length);
      const matches = getCountriesByDialCode(code);

      // Use hint to disambiguate shared dial codes (e.g. +1 -> CA vs US)
      if (isoHint) {
        const hinted = matches.find(c => c.iso === isoHint.toUpperCase());
        if (hinted) return { country: hinted, nationalNumber: national };
      }

      return { country: matches[0] || null, nationalNumber: national };
    }
  }

  return { country: null, nationalNumber: normalized.replace('+', '') };
}

/** Build an E.164 string from dial code + national number */
export function formatE164(dialCode: string, nationalNumber: string): string {
  const code = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const digits = nationalNumber.replace(/\D/g, '');
  if (!digits) return '';
  return `${code}${digits}`;
}

/** Common name aliases -> canonical name */
const NAME_ALIASES: Record<string, string> = {
  'usa': 'United States',
  'us': 'United States',
  'u.s.': 'United States',
  'u.s.a.': 'United States',
  'united states of america': 'United States',
  'uk': 'United Kingdom',
  'u.k.': 'United Kingdom',
  'great britain': 'United Kingdom',
  'england': 'United Kingdom',
  'ca': 'Canada',
};

/**
 * Normalize a country string to canonical name.
 * Handles ISO codes, common aliases, and existing full names.
 */
export function normalizeCountryName(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Check aliases (case-insensitive)
  const alias = NAME_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  // Check if it's a 2-letter ISO code
  if (trimmed.length === 2) {
    const byIso = getCountryByIso(trimmed);
    if (byIso) return byIso.name;
  }

  // Check if it matches a known country name (case-insensitive)
  const byName = COUNTRIES.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
  if (byName) return byName.name;

  // Return as-is for unknown countries
  return trimmed;
}

/**
 * Find a country from a stored value (could be ISO code, full name, or alias).
 * Returns the CountryData or undefined if not found.
 */
export function findCountryFromValue(value: string): CountryData | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();

  // Direct ISO match
  if (trimmed.length === 2) {
    const byIso = getCountryByIso(trimmed);
    if (byIso) return byIso;
  }

  // Alias lookup
  const alias = NAME_ALIASES[trimmed.toLowerCase()];
  if (alias) {
    return COUNTRIES.find(c => c.name === alias);
  }

  // Name match
  return COUNTRIES.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
}
