import Stripe from 'stripe';

// Server-side only (use API routes)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

// Stripe Plans with live price IDs (CAD, monthly recurring)
export const STRIPE_PLANS: Record<string, {
    name: string;
    price: number;
    priceId: string | null;
    productId: string | null;
    features: string[];
}> = {
    free: {
        name: 'Free',
        price: 0,
        priceId: null,
        productId: null,
        features: ['1 CRM User', 'Basic invoices & quotes', '10 invoices/quotes per month', 'Voice AI Agent (60 min) - First month only'],
    },
    business: {
        name: 'Business',
        price: 150,
        priceId: 'price_1T3lmlGmarpEtABM0O8k7aXV',
        productId: 'prod_U1pRXbiwPp57vF',
        features: ['Up to 5 CRM Users', '100 customer records', '50 invoices & quotes/month', 'Voice AI Agent (100 min/month)', 'Inventory & pipeline access'],
    },
    elite_premium: {
        name: 'Elite Premium',
        price: 350,
        priceId: 'price_1T3lmoGmarpEtABMiFVfN8Tk',
        productId: 'prod_U1pR8vTsx4wMnm',
        features: ['10 CRM Users', 'Unlimited customers', 'Unlimited invoices & quotes', 'Voice AI Agent (500 min/month)', 'Full suite of automations'],
    },
    enterprise: {
        name: 'Enterprise',
        price: 1299,
        priceId: 'price_1T3lmrGmarpEtABMrdtpRY4R',
        productId: 'prod_U1pRpy8sQGNQGh',
        features: ['Unlimited users & customers', 'Multiple Voice Agents', 'Advanced automations', 'Dedicated account manager', 'Skool community access'],
    },
};

// Manitoba GST+PST tax rate (12% = 5% GST + 7% PST, exclusive)
export const STRIPE_TAX_RATE_MB = 'txr_1T3ln7GmarpEtABM8LSX6fJn';
