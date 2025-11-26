import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@12.0.0";
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const supabase = createClient(Deno.env.get('DB_URL') || '', Deno.env.get('DB_SERVICE_ROLE_KEY') || '');
Deno.serve(async (req)=>{
  try {
    const signature = req.headers.get('stripe-signature');
    console.log("Signature header:", signature);
    console.log("Webhook secret:", webhookSecret);
    if (!signature) {
      return new Response('Missing Stripe signature header', {
        status: 400
      });
    }
    const body = await req.text();
    console.log("Body:", body);
    let event;
    try {
      //event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      event = JSON.parse(body);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return new Response('Webhook signature verification failed', {
        status: 400
      });
    }
    console.log('Stripe event received:', event.type);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const planId = session.metadata.plan_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      if (!userId || !customerId || !subscriptionId) {
        console.error('Missing required metadata:', {
          userId,
          customerId,
          subscriptionId
        });
        return new Response('Missing metadata', {
          status: 400
        });
      }
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const { error } = await supabase.from('subscriptions').update({
        plan_id: planId,
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status: subscription.status,
        current_period_end: subscription.expires_at ? new Date(subscription.expires_at * 1000).toISOString() : new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      }).eq('user_id', userId);
      if (error) {
        throw error;
      }
    }
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      //const { user_id, id: subscriptionId } = subscription;
      let userId = subscription.metadata?.user_id;
      if (!userId) {
        const { data, error } = await supabase.from('subscriptions').select('user_id').eq('userId', userId).single();
        if (error || !data) {
          console.error('Could not find user by customerId:', userId);
          return new Response('User not found', {
            status: 400
          });
        }
        userId = data.user_id;
      }
      const { error } = await supabase.from('subscriptions').update({
        status: subscription.status,
        current_period_end: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }).eq('stripe_subscription_id', subscription.id);
      if (error) {
        throw error;
      }
    }
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      console.log("Stripe subscription Id:", subscription.id);
      const { error } = await supabase.from('subscriptions').update({
        status: 'canceled',
        cancel_at_period_end: true
      }).eq('stripe_subscription_id', subscription.id);
      if (error) {
        throw error;
      }
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
