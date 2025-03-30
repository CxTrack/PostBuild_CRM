# CxTrack - Business Management System

CxTrack is an all-in-one solution for CRM, invoicing, and inventory management.

## Features

- Customer Management
- Invoicing
- Inventory Tracking
- Shopify Integration
- Subscription Management with Stripe

## Stripe Integration Setup

To set up Stripe payments in your application:

1. Create a Stripe account at [stripe.com](https://stripe.com)

2. Get your API keys from the Stripe Dashboard:
   - Go to Developers > API keys
   - Copy your publishable key and secret key

3. Add your Stripe keys to the environment variables:
   - Create a `.env` file based on `.env.example`
   - Add your Stripe publishable key to `VITE_STRIPE_PUBLISHABLE_KEY`
   - For Supabase Edge Functions, set your secret key in the Supabase dashboard

4. Set up webhook endpoints in your Stripe dashboard:
   - Go to Developers > Webhooks
   - Add an endpoint for your Supabase Edge Function URL
   - The endpoint should be: `https://[YOUR_SUPABASE_PROJECT_REF].functions.supabase.co/stripe-webhook`
   - Select the following events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_method.attached`
     - `payment_method.detached`

5. Create products and prices in the Stripe dashboard:
   - Go to Products > Add Product
   - Create products that match your subscription plans
   - Add prices for each product
   - Copy the price IDs and update them in your subscription_plans table

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

For Supabase Edge Functions, set these secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```