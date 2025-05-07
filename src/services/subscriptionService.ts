import { log } from 'console';
import { supabase } from '../lib/supabase';
import { SubscriptionPlan, Subscription } from '../types/database.types';
import Stripe from 'stripe';


export const subscriptionService = {
  // Get all available subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        //.eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        throw error;
      }

      return plans || [];
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  // Get current user's subscription
  async getCurrentSubscription(): Promise<Subscription> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const freeSubsciption = await subscriptionService.fetchFreeSubscription();

      //let today = new Date().toISOString();

      let { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userData.user.id)
        // .or(
        //   `and(status.eq.active,current_period_end.gt.${today}),and(status.eq.canceled,plan_id.eq.${freeSubsciption.id})`
        // )
        .maybeSingle();

      if (error) {
        console.error('Error fetching current subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  async setSubscription(planId: string, isFree: boolean) {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      if (isFree) {
        const { error } = await supabase.from('subscriptions').update({
          plan_id: planId,
          status: 'active',
          current_period_end: '2125-01-01 19:17:14+00',
          cancel_at_period_end: false,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString()
        }).eq('user_id', userData?.user.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from('subscriptions').update({
          plan_id: planId,
          updated_at: new Date().toISOString()
        }).eq('user_id', userData?.user.id);
        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  async fetchFreeSubscription(): Promise<Subscription> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('price', 0)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current subscription:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  // Create a checkout session for subscription
  async createCheckoutSession(planId: string): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Get the user's session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Failed to get authentication session');
      }

      const plans = await this.getSubscriptionPlans()

      var selectedPlan = plans.find(plan => plan.id === planId)
      //return selectedPlan?.stripe_price_id || '';

      const stripe = new Stripe('sk_test_51RIYtWPmPvoB8hNNG0hDFxkRB1NfdqtYLT94m83StsLprhZb7jGHAO2fnkaVvj4wuWyIqeneBnoxcciehltTVyo9000uFOQs9B', {
        //apiVersion: '2023-10-16',
      });
      const stripeSession = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: userData?.user.email, // will auto-create a Customer,
        client_reference_id: userData?.user.id,
        line_items: [
          {
            price: selectedPlan?.stripe_price_id,
            quantity: 1,
          },
        ],
        metadata: {
          user_id: userData?.user?.id ?? 'unknown',
          description: userData?.user?.email ?? 'unknown',
          plan_id: planId
        },
        subscription_data: {
          metadata: {
            user_id: userData?.user.id,
            description: `CxTrack UserId: ${userData?.user.id} | CxTrack user email: ${userData?.user.email}`
          },
        },
        success_url: `https://buy.stripe.com/test_3csbJ22Ym7z4d0Y000/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://buy.stripe.com/test_3csbJ22Ym7z4d0Y000/cancel`
      }
      );

      return stripeSession.url;
      //return data;
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  async cancelSubscription() {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const subscription = await this.getCurrentSubscription();
      const stripe = new Stripe('sk_test_51RIYtWPmPvoB8hNNG0hDFxkRB1NfdqtYLT94m83StsLprhZb7jGHAO2fnkaVvj4wuWyIqeneBnoxcciehltTVyo9000uFOQs9B');
      
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
         cancel_at_period_end: true
      });

    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  // // Get user's payment methods
  // async getPaymentMethods(): Promise<PaymentMethod[]> {
  //   try {
  //     const { data: userData } = await supabase.auth.getUser();

  //     if (!userData?.user) {
  //       throw new Error('User not authenticated');
  //     }

  //     const { data, error } = await supabase
  //       .from('payment_methods')
  //       .select('*')
  //       .eq('user_id', userData.user.id)
  //       .order('is_default', { ascending: false });

  //     if (error) {
  //       console.error('Error fetching payment methods:', error);
  //       throw error;
  //     }

  //     return data || [];
  //   } catch (error) {
  //     console.error('Subscription service error:', error);
  //     throw error;
  //   }
  // },

  // Set default payment method
  // async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
  //   try {
  //     const { data: userData } = await supabase.auth.getUser();

  //     if (!userData?.user) {
  //       throw new Error('User not authenticated');
  //     }

  //     // First, set all payment methods to non-default
  //     const { error: updateError } = await supabase
  //       .from('payment_methods')
  //       .update({ is_default: false })
  //       .eq('user_id', userData.user.id);

  //     if (updateError) {
  //       console.error('Error updating payment methods:', updateError);
  //       throw updateError;
  //     }

  //     // Then set the selected payment method as default
  //     const { error } = await supabase
  //       .from('payment_methods')
  //       .update({ is_default: true })
  //       .eq('id', paymentMethodId)
  //       .eq('user_id', userData.user.id);

  //     if (error) {
  //       console.error('Error setting default payment method:', error);
  //       throw error;
  //     }
  //   } catch (error) {
  //     console.error('Subscription service error:', error);
  //     throw error;
  //   }
  // },

  // Remove payment method
  // async removePaymentMethod(paymentMethodId: string): Promise<void> {
  //   try {
  //     const { data: userData } = await supabase.auth.getUser();

  //     if (!userData?.user) {
  //       throw new Error('User not authenticated');
  //     }

  //     // Check if this is the default payment method
  //     const { data: paymentMethod, error: fetchError } = await supabase
  //       .from('payment_methods')
  //       .select('is_default')
  //       .eq('id', paymentMethodId)
  //       .eq('user_id', userData.user.id)
  //       .single();

  //     if (fetchError) {
  //       console.error('Error fetching payment method:', fetchError);
  //       throw fetchError;
  //     }

  //     if (paymentMethod.is_default) {
  //       throw new Error('Cannot remove default payment method');
  //     }

  //     // Remove the payment method
  //     const { error } = await supabase
  //       .from('payment_methods')
  //       .delete()
  //       .eq('id', paymentMethodId)
  //       .eq('user_id', userData.user.id);

  //     if (error) {
  //       console.error('Error removing payment method:', error);
  //       throw error;
  //     }
  //   } catch (error) {
  //     console.error('Subscription service error:', error);
  //     throw error;
  //   }
  // }
};