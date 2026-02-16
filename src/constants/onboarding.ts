// Shared constants for onboarding flow

export const industries = [
    { id: 'tax_accounting', label: 'Tax & Accounting', icon: 'calculate', description: 'Client intake, document collection, deadline tracking' },
    { id: 'distribution_logistics', label: 'Distribution & Logistics', icon: 'local_shipping', description: 'Inventory, supplier tracking, order processing' },
    { id: 'gyms_fitness', label: 'Gyms & Fitness', icon: 'fitness_center', description: 'Member management, class scheduling, payments' },
    { id: 'contractors_home_services', label: 'Contractors & Home Services', icon: 'construction', description: 'Job estimation, scheduling, invoicing' },
    { id: 'healthcare', label: 'Healthcare', icon: 'medical_services', description: 'Patient intake, appointments, HIPAA workflows' },
    { id: 'real_estate', label: 'Real Estate', icon: 'home_work', description: 'Lead nurturing, listings, transaction tracking' },
    { id: 'legal_services', label: 'Legal Services', icon: 'gavel', description: 'Client intake, case management, billing' },
    { id: 'software_development', label: 'Software Development', icon: 'code', description: 'Sprint management, bug tracking, releases' },
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
        ],
        cta: 'Select Enterprise',
    },
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
