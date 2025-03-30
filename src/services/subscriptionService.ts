import { supabase } from '../lib/supabase';
import { SubscriptionPlan, Subscription, PaymentMethod } from '../types/database.types';

export const subscriptionService = {
  // Get all available subscription plans
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
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
  async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('status', 'active')
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
  async createCheckoutSession(planId: string): Promise<{ sessionId: string; url: string }> {
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

      // Call Supabase Edge Function to create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { 
          planId,
          userId: userData.user.id,
          email: userData.user.email
        }
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('Invalid response from checkout session creation');
      }

      return data;
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  // Get user's payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('is_default', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // First, set all payment methods to non-default
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userData.user.id);
      
      if (updateError) {
        console.error('Error updating payment methods:', updateError);
        throw updateError;
      }
      
      // Then set the selected payment method as default
      const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', userData.user.id);
      
      if (error) {
        console.error('Error setting default payment method:', error);
        throw error;
      }
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  },

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData?.user) {
        throw new Error('User not authenticated');
      }

      // Check if this is the default payment method
      const { data: paymentMethod, error: fetchError } = await supabase
        .from('payment_methods')
        .select('is_default')
        .eq('id', paymentMethodId)
        .eq('user_id', userData.user.id)
        .single();
      
      if (fetchError) {
        console.error('Error fetching payment method:', fetchError);
        throw fetchError;
      }
      
      if (paymentMethod.is_default) {
        throw new Error('Cannot remove default payment method');
      }
      
      // Remove the payment method
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId)
        .eq('user_id', userData.user.id);
      
      if (error) {
        console.error('Error removing payment method:', error);
        throw error;
      }
    } catch (error) {
      console.error('Subscription service error:', error);
      throw error;
    }
  }
};