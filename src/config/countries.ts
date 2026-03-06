/**
 * Country and region configuration for international address support.
 */

export interface CountryOption {
    code: string;
    name: string;
    addressFormat: 'domestic' | 'international';
}

/** North American countries use "domestic" format (State dropdown). Everything else is "international" (Region text input). */
export const COUNTRIES: CountryOption[] = [
    { code: 'CA', name: 'Canada', addressFormat: 'domestic' },
    { code: 'US', name: 'United States', addressFormat: 'domestic' },
    { code: 'AU', name: 'Australia', addressFormat: 'international' },
    { code: 'BR', name: 'Brazil', addressFormat: 'international' },
    { code: 'CN', name: 'China', addressFormat: 'international' },
    { code: 'FR', name: 'France', addressFormat: 'international' },
    { code: 'DE', name: 'Germany', addressFormat: 'international' },
    { code: 'IN', name: 'India', addressFormat: 'international' },
    { code: 'IE', name: 'Ireland', addressFormat: 'international' },
    { code: 'IT', name: 'Italy', addressFormat: 'international' },
    { code: 'JP', name: 'Japan', addressFormat: 'international' },
    { code: 'MX', name: 'Mexico', addressFormat: 'international' },
    { code: 'NL', name: 'Netherlands', addressFormat: 'international' },
    { code: 'NZ', name: 'New Zealand', addressFormat: 'international' },
    { code: 'PH', name: 'Philippines', addressFormat: 'international' },
    { code: 'SG', name: 'Singapore', addressFormat: 'international' },
    { code: 'KR', name: 'South Korea', addressFormat: 'international' },
    { code: 'ES', name: 'Spain', addressFormat: 'international' },
    { code: 'SE', name: 'Sweden', addressFormat: 'international' },
    { code: 'CH', name: 'Switzerland', addressFormat: 'international' },
    { code: 'GB', name: 'United Kingdom', addressFormat: 'international' },
];

/** Canadian provinces and US states for the domestic dropdown. */
export const CA_PROVINCES = [
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

export const US_STATES = [
    { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
    { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
    { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
    { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
    { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
    { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
    { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
    { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
    { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
    { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
    { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
    { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
    { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
    { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
    { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
    { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
    { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
    { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
    { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
    { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
    { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
    { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
    { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
    { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
    { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
    { code: 'DC', name: 'District of Columbia' },
];

/** Get the province/state list for a domestic country code. */
export function getRegionsForCountry(countryCode: string) {
    switch (countryCode) {
        case 'CA': return CA_PROVINCES;
        case 'US': return US_STATES;
        default: return [];
    }
}

/** Check if a country uses domestic address format. */
export function isDomesticCountry(countryCode: string): boolean {
    const country = COUNTRIES.find(c => c.code === countryCode);
    return country?.addressFormat === 'domestic';
}
