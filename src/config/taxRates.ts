export interface TaxConfig {
  rate: number;
  label: string;
  description: string;
}

export interface StateOption {
  code: string;
  name: string;
}

export interface CountryOption {
  value: string;
  label: string;
}

// ─── Country Options ───────────────────────────────────────────────

export const COUNTRY_OPTIONS: CountryOption[] = [
  { value: 'Canada', label: 'Canada' },
  { value: 'United States', label: 'United States' },
];

// ─── Canadian Provinces & Territories ──────────────────────────────

export const CANADIAN_PROVINCES: StateOption[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

// ─── US States ─────────────────────────────────────────────────────

export const US_STATES: StateOption[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

// ─── Canadian Tax Rates ────────────────────────────────────────────

const CANADA_TAX_RATES: Record<string, TaxConfig> = {
  AB: { rate: 5,      label: 'GST',     description: 'GST 5%' },
  BC: { rate: 12,     label: 'GST+PST', description: '5% GST + 7% PST' },
  MB: { rate: 12,     label: 'GST+PST', description: '5% GST + 7% PST' },
  NB: { rate: 15,     label: 'HST',     description: 'HST 15%' },
  NL: { rate: 15,     label: 'HST',     description: 'HST 15%' },
  NS: { rate: 15,     label: 'HST',     description: 'HST 15%' },
  NT: { rate: 5,      label: 'GST',     description: 'GST 5%' },
  NU: { rate: 5,      label: 'GST',     description: 'GST 5%' },
  ON: { rate: 13,     label: 'HST',     description: 'HST 13%' },
  PE: { rate: 15,     label: 'HST',     description: 'HST 15%' },
  QC: { rate: 14.975, label: 'GST+QST', description: '5% GST + 9.975% QST' },
  SK: { rate: 11,     label: 'GST+PST', description: '5% GST + 6% PST' },
  YT: { rate: 5,      label: 'GST',     description: 'GST 5%' },
};

// ─── US State Tax Rates (state-level base rates) ───────────────────

const US_TAX_RATES: Record<string, TaxConfig> = {
  AL: { rate: 4,      label: 'Sales Tax', description: 'State rate 4% (local rates may apply)' },
  AK: { rate: 0,      label: 'Sales Tax', description: 'No state sales tax (local rates may apply)' },
  AZ: { rate: 5.6,    label: 'Sales Tax', description: 'State rate 5.6% (local rates may apply)' },
  AR: { rate: 6.5,    label: 'Sales Tax', description: 'State rate 6.5% (local rates may apply)' },
  CA: { rate: 7.25,   label: 'Sales Tax', description: 'State rate 7.25% (local rates may apply)' },
  CO: { rate: 2.9,    label: 'Sales Tax', description: 'State rate 2.9% (local rates may apply)' },
  CT: { rate: 6.35,   label: 'Sales Tax', description: 'State rate 6.35%' },
  DE: { rate: 0,      label: 'Sales Tax', description: 'No sales tax' },
  DC: { rate: 6,      label: 'Sales Tax', description: 'DC rate 6%' },
  FL: { rate: 6,      label: 'Sales Tax', description: 'State rate 6% (local rates may apply)' },
  GA: { rate: 4,      label: 'Sales Tax', description: 'State rate 4% (local rates may apply)' },
  HI: { rate: 4,      label: 'GET',       description: 'General Excise Tax 4% (local rates may apply)' },
  ID: { rate: 6,      label: 'Sales Tax', description: 'State rate 6%' },
  IL: { rate: 6.25,   label: 'Sales Tax', description: 'State rate 6.25% (local rates may apply)' },
  IN: { rate: 7,      label: 'Sales Tax', description: 'State rate 7%' },
  IA: { rate: 6,      label: 'Sales Tax', description: 'State rate 6% (local rates may apply)' },
  KS: { rate: 6.5,    label: 'Sales Tax', description: 'State rate 6.5% (local rates may apply)' },
  KY: { rate: 6,      label: 'Sales Tax', description: 'State rate 6%' },
  LA: { rate: 4.45,   label: 'Sales Tax', description: 'State rate 4.45% (local rates may apply)' },
  ME: { rate: 5.5,    label: 'Sales Tax', description: 'State rate 5.5%' },
  MD: { rate: 6,      label: 'Sales Tax', description: 'State rate 6%' },
  MA: { rate: 6.25,   label: 'Sales Tax', description: 'State rate 6.25%' },
  MI: { rate: 6,      label: 'Sales Tax', description: 'State rate 6%' },
  MN: { rate: 6.875,  label: 'Sales Tax', description: 'State rate 6.875% (local rates may apply)' },
  MS: { rate: 7,      label: 'Sales Tax', description: 'State rate 7%' },
  MO: { rate: 4.225,  label: 'Sales Tax', description: 'State rate 4.225% (local rates may apply)' },
  MT: { rate: 0,      label: 'Sales Tax', description: 'No sales tax' },
  NE: { rate: 5.5,    label: 'Sales Tax', description: 'State rate 5.5% (local rates may apply)' },
  NV: { rate: 6.85,   label: 'Sales Tax', description: 'State rate 6.85% (local rates may apply)' },
  NH: { rate: 0,      label: 'Sales Tax', description: 'No sales tax' },
  NJ: { rate: 6.625,  label: 'Sales Tax', description: 'State rate 6.625%' },
  NM: { rate: 5.125,  label: 'GRT',       description: 'Gross Receipts Tax 5.125% (local rates may apply)' },
  NY: { rate: 4,      label: 'Sales Tax', description: 'State rate 4% (local rates may apply)' },
  NC: { rate: 4.75,   label: 'Sales Tax', description: 'State rate 4.75% (local rates may apply)' },
  ND: { rate: 5,      label: 'Sales Tax', description: 'State rate 5% (local rates may apply)' },
  OH: { rate: 5.75,   label: 'Sales Tax', description: 'State rate 5.75% (local rates may apply)' },
  OK: { rate: 4.5,    label: 'Sales Tax', description: 'State rate 4.5% (local rates may apply)' },
  OR: { rate: 0,      label: 'Sales Tax', description: 'No sales tax' },
  PA: { rate: 6,      label: 'Sales Tax', description: 'State rate 6% (local rates may apply)' },
  RI: { rate: 7,      label: 'Sales Tax', description: 'State rate 7%' },
  SC: { rate: 6,      label: 'Sales Tax', description: 'State rate 6% (local rates may apply)' },
  SD: { rate: 4.5,    label: 'Sales Tax', description: 'State rate 4.5% (local rates may apply)' },
  TN: { rate: 7,      label: 'Sales Tax', description: 'State rate 7% (local rates may apply)' },
  TX: { rate: 6.25,   label: 'Sales Tax', description: 'State rate 6.25% (local rates may apply)' },
  UT: { rate: 6.1,    label: 'Sales Tax', description: 'State rate 6.1% (local rates may apply)' },
  VT: { rate: 6,      label: 'Sales Tax', description: 'State rate 6% (local rates may apply)' },
  VA: { rate: 5.3,    label: 'Sales Tax', description: 'State rate 5.3% (local rates may apply)' },
  WA: { rate: 6.5,    label: 'Sales Tax', description: 'State rate 6.5% (local rates may apply)' },
  WV: { rate: 6,      label: 'Sales Tax', description: 'State rate 6%' },
  WI: { rate: 5,      label: 'Sales Tax', description: 'State rate 5% (local rates may apply)' },
  WY: { rate: 4,      label: 'Sales Tax', description: 'State rate 4% (local rates may apply)' },
};

// ─── Lookup Functions ──────────────────────────────────────────────

export function getStatesForCountry(country: string): StateOption[] {
  const normalized = country?.trim().toLowerCase();
  if (normalized === 'canada') return CANADIAN_PROVINCES;
  if (normalized === 'united states' || normalized === 'us' || normalized === 'usa') return US_STATES;
  return [];
}

export function getTaxConfigForLocation(country: string, stateCode: string): TaxConfig | null {
  if (!country || !stateCode) return null;
  const normalizedCountry = country.trim().toLowerCase();
  const normalizedState = stateCode.trim().toUpperCase();

  if (normalizedCountry === 'canada') {
    return CANADA_TAX_RATES[normalizedState] || null;
  }
  if (normalizedCountry === 'united states' || normalizedCountry === 'us' || normalizedCountry === 'usa') {
    return US_TAX_RATES[normalizedState] || null;
  }
  return null;
}

export function isSupportedCountry(country: string): boolean {
  const normalized = country?.trim().toLowerCase();
  return normalized === 'canada' || normalized === 'united states' || normalized === 'us' || normalized === 'usa';
}
