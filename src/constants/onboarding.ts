// Shared constants for onboarding flow

export const industries = [
    { id: 'tax_accounting', label: 'Tax & Accounting', icon: 'calculate', description: 'Client intake, document collection, deadline tracking' },
    { id: 'distribution_logistics', label: 'Distribution & Logistics', icon: 'local_shipping', description: 'Inventory, supplier tracking, order processing' },
    { id: 'gyms_fitness', label: 'Gyms & Fitness', icon: 'fitness_center', description: 'Member management, class scheduling, payments' },
    { id: 'contractors_home_services', label: 'Contractors & Home Services', icon: 'construction', description: 'Job estimation, scheduling, invoicing' },
    { id: 'healthcare', label: 'Healthcare', icon: 'medical_services', description: 'Patient intake, appointments, HIPAA workflows' },
    { id: 'real_estate', label: 'Real Estate', icon: 'home_work', description: 'Lead nurturing, listings, transaction tracking' },
    { id: 'legal_services', label: 'Legal Services', icon: 'gavel', description: 'Client intake, case management, billing' },
    { id: 'agency', label: 'Agency', icon: 'hub', description: 'Client projects, proposals, billing, automations' },
    { id: 'mortgage_broker', label: 'Mortgage Broker', icon: 'account_balance', description: 'Loan pipeline, lender management, rate tracking' },
    { id: 'construction', label: 'Construction', icon: 'engineering', description: 'Project bids, punch lists, scheduling, invoicing' },
    { id: 'general_business', label: 'General Business', icon: 'business', description: 'Standard CRM pipelines, lead management' },
];

// Canada first, then alphabetical by name
export const COUNTRY_OPTIONS = [
    { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: '$', flag: '🇨🇦' },
    { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: '$', flag: '🇦🇺' },
    { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$', flag: '🇧🇷' },
    { code: 'FR', name: 'France', currency: 'EUR', currencySymbol: '€', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', currency: 'EUR', currencySymbol: '€', flag: '🇩🇪' },
    { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹', flag: '🇮🇳' },
    { code: 'IE', name: 'Ireland', currency: 'EUR', currencySymbol: '€', flag: '🇮🇪' },
    { code: 'IT', name: 'Italy', currency: 'EUR', currencySymbol: '€', flag: '🇮🇹' },
    { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥', flag: '🇯🇵' },
    { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: '$', flag: '🇲🇽' },
    { code: 'NL', name: 'Netherlands', currency: 'EUR', currencySymbol: '€', flag: '🇳🇱' },
    { code: 'NZ', name: 'New Zealand', currency: 'NZD', currencySymbol: '$', flag: '🇳🇿' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦', flag: '🇳🇬' },
    { code: 'PH', name: 'Philippines', currency: 'PHP', currencySymbol: '₱', flag: '🇵🇭' },
    { code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: '$', flag: '🇸🇬' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R', flag: '🇿🇦' },
    { code: 'ES', name: 'Spain', currency: 'EUR', currencySymbol: '€', flag: '🇪🇸' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED', currencySymbol: 'د.إ', flag: '🇦🇪' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£', flag: '🇬🇧' },
    { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$', flag: '🇺🇸' },
];

export const pricingTiers = [
    {
        id: 'free',
        name: 'FREE',
        price: 0,
        priceDisplay: '$0/month',
        badge: 'TRY IT',
        bestFor: 'Wanting to try CxTrack',
        features: [
            '1 CRM User (single seat only)',
            'Basic invoices & quotes',
            '10 invoices/quotes per month',
            'Voice AI Agent (60 min) - FIRST MONTH ONLY',
            'AI Quarterback (CoPilot)',
            '50K AI tokens/month',
        ],
        cta: 'Start Free',
        skipPayment: true,
    },
    {
        id: 'business',
        name: 'BUSINESS',
        price: 50,
        priceDisplay: '$50/mo → $150/mo',
        badge: null,
        bestFor: 'Growing SMEs + Basic AI',
        features: [
            'Up to 5 CRM Users',
            '100 customer records',
            '50 invoices & quotes/month',
            'Voice AI Agent (100 min/month)',
            'Inventory & pipeline access',
            'AI Quarterback (CoPilot)',
            '500K AI tokens/month',
        ],
        pricingNote: '$50/mo for first 3 months, then $150/mo',
        cta: 'Select Business',
    },
    {
        id: 'elite_premium',
        name: 'ELITE PREMIUM',
        price: 350,
        priceDisplay: '$350/mo',
        badge: 'MOST POPULAR',
        badgeColor: 'gold',
        bestFor: 'Scaling businesses',
        features: [
            '10 CRM Users',
            'Unlimited customers',
            'Unlimited invoices & quotes',
            'Voice AI Agent (500 min/month)',
            'Full suite of automations',
            'AI Quarterback (CoPilot)',
            '1M AI tokens/month',
        ],
        cta: 'Select Elite Premium',
        highlighted: true,
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        price: 1299,
        priceDisplay: '$1,299/mo+',
        badge: 'FULL AGENCY SUITE',
        bestFor: 'Agencies & Multi-location',
        features: [
            'Unlimited users & customers',
            'Multiple Voice Agents',
            'Advanced automations',
            'Dedicated account manager',
            'Skool community access',
            'AI Quarterback (CoPilot)',
            '1M AI tokens/month',
        ],
        cta: 'Select Enterprise',
    },
];

// Canadian provinces with primary area codes for Twilio phone number search
// Primary codes chosen based on Twilio availability (backend has full fallback list)
export const CA_PROVINCES = [
    { code: 'AB', name: 'Alberta', areaCode: 587 },
    { code: 'BC', name: 'British Columbia', areaCode: 604 },
    { code: 'MB', name: 'Manitoba', areaCode: 431 },
    { code: 'NB', name: 'New Brunswick', areaCode: 506 },
    { code: 'NL', name: 'Newfoundland & Labrador', areaCode: 709 },
    { code: 'NS', name: 'Nova Scotia', areaCode: 902 },
    { code: 'NT', name: 'Northwest Territories', areaCode: 867 },
    { code: 'NU', name: 'Nunavut', areaCode: 867 },
    { code: 'ON', name: 'Ontario', areaCode: 647 },
    { code: 'PE', name: 'Prince Edward Island', areaCode: 902 },
    { code: 'QC', name: 'Quebec', areaCode: 438 },
    { code: 'SK', name: 'Saskatchewan', areaCode: 639 },
    { code: 'YT', name: 'Yukon', areaCode: 867 },
];

// US states with primary area codes for Twilio phone number search
// Primary codes chosen based on Twilio availability (backend has full fallback list)
export const US_STATES = [
    { code: 'AL', name: 'Alabama', areaCode: 205 },
    { code: 'AK', name: 'Alaska', areaCode: 907 },
    { code: 'AZ', name: 'Arizona', areaCode: 602 },
    { code: 'AR', name: 'Arkansas', areaCode: 501 },
    { code: 'CA', name: 'California', areaCode: 323 },
    { code: 'CO', name: 'Colorado', areaCode: 720 },
    { code: 'CT', name: 'Connecticut', areaCode: 203 },
    { code: 'DE', name: 'Delaware', areaCode: 302 },
    { code: 'FL', name: 'Florida', areaCode: 786 },
    { code: 'GA', name: 'Georgia', areaCode: 470 },
    { code: 'HI', name: 'Hawaii', areaCode: 808 },
    { code: 'ID', name: 'Idaho', areaCode: 208 },
    { code: 'IL', name: 'Illinois', areaCode: 312 },
    { code: 'IN', name: 'Indiana', areaCode: 317 },
    { code: 'IA', name: 'Iowa', areaCode: 515 },
    { code: 'KS', name: 'Kansas', areaCode: 316 },
    { code: 'KY', name: 'Kentucky', areaCode: 502 },
    { code: 'LA', name: 'Louisiana', areaCode: 504 },
    { code: 'ME', name: 'Maine', areaCode: 207 },
    { code: 'MD', name: 'Maryland', areaCode: 301 },
    { code: 'MA', name: 'Massachusetts', areaCode: 617 },
    { code: 'MI', name: 'Michigan', areaCode: 313 },
    { code: 'MN', name: 'Minnesota', areaCode: 612 },
    { code: 'MS', name: 'Mississippi', areaCode: 601 },
    { code: 'MO', name: 'Missouri', areaCode: 314 },
    { code: 'MT', name: 'Montana', areaCode: 406 },
    { code: 'NE', name: 'Nebraska', areaCode: 402 },
    { code: 'NV', name: 'Nevada', areaCode: 725 },
    { code: 'NH', name: 'New Hampshire', areaCode: 603 },
    { code: 'NJ', name: 'New Jersey', areaCode: 201 },
    { code: 'NM', name: 'New Mexico', areaCode: 505 },
    { code: 'NY', name: 'New York', areaCode: 332 },
    { code: 'NC', name: 'North Carolina', areaCode: 980 },
    { code: 'ND', name: 'North Dakota', areaCode: 701 },
    { code: 'OH', name: 'Ohio', areaCode: 216 },
    { code: 'OK', name: 'Oklahoma', areaCode: 405 },
    { code: 'OR', name: 'Oregon', areaCode: 503 },
    { code: 'PA', name: 'Pennsylvania', areaCode: 215 },
    { code: 'RI', name: 'Rhode Island', areaCode: 401 },
    { code: 'SC', name: 'South Carolina', areaCode: 803 },
    { code: 'SD', name: 'South Dakota', areaCode: 605 },
    { code: 'TN', name: 'Tennessee', areaCode: 615 },
    { code: 'TX', name: 'Texas', areaCode: 469 },
    { code: 'UT', name: 'Utah', areaCode: 385 },
    { code: 'VT', name: 'Vermont', areaCode: 802 },
    { code: 'VA', name: 'Virginia', areaCode: 571 },
    { code: 'WA', name: 'Washington', areaCode: 206 },
    { code: 'WV', name: 'West Virginia', areaCode: 304 },
    { code: 'WI', name: 'Wisconsin', areaCode: 414 },
    { code: 'WY', name: 'Wyoming', areaCode: 307 },
    { code: 'DC', name: 'Washington, D.C.', areaCode: 202 },
];

export function detectCountryFromLocale(): string {
    try {
        const locale = navigator.language || navigator.languages?.[0] || '';
        const parts = locale.split('-');
        if (parts.length >= 2) {
            const countryCode = parts[parts.length - 1].toUpperCase();
            const match = COUNTRY_OPTIONS.find(c => c.code === countryCode);
            if (match) return match.code;
        }
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (tz.startsWith('America/Toronto') || tz.startsWith('America/Vancouver') || tz.startsWith('America/Montreal') || tz.startsWith('America/Edmonton') || tz.startsWith('America/Winnipeg') || tz.startsWith('America/Halifax')) return 'CA';
        if (tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Denver') || tz.startsWith('America/Los_Angeles') || tz.startsWith('America/Phoenix')) return 'US';
        if (tz.startsWith('Europe/London')) return 'GB';
        if (tz.startsWith('Australia/')) return 'AU';
    } catch {
        // Fallback
    }
    return 'CA'; // Default to Canada
}

/**
 * Detect country from user's IP address using ipapi.co free API.
 * Falls back to locale-based detection if the API is unavailable.
 * Returns a country code matching COUNTRY_OPTIONS.
 */
export async function detectCountryFromIP(): Promise<string> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('IP geolocation API error');
        const data = await res.json();
        const code = data.country_code; // ISO 3166-1 alpha-2
        if (code) {
            const match = COUNTRY_OPTIONS.find(c => c.code === code.toUpperCase());
            if (match) return match.code;
        }
    } catch {
        // API unavailable, blocked by ad blocker, or timeout — fall back to locale
    }
    return detectCountryFromLocale();
}

// Color for each onboarding step in the progress ribbon
// Follows the CxTrack marketing site brand palette
export const STEP_COLORS: Record<string, string> = {
    account:   '#1E90FF', // Sapphire Blue
    profile:   '#C850C0', // Purple
    selection: '#FF8C00', // Orange
    industry:  '#00CED1', // Cyan
    plan:      '#FFD700', // Electric Gold
    voice:     '#C850C0', // Purple
    checkout:  '#22C55E', // Green
};
