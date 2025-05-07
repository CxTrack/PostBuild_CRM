import { create } from 'zustand';
import { subscriptionService } from '../services/subscriptionService';
import { SubscriptionPlan, Subscription, PaymentMethod } from '../types/database.types';

interface SubscriptionState {
  plans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchSubscriptionPlans: () => Promise<void>;
  fetchCurrentSubscription: () => Promise<void>;
  fetchFreeSubscription: () => Promise<Subscription>;
  setSubscription: (planId: string) => Promise<void>;
  //fetchPaymentMethods: () => Promise<void>;
  createCheckoutSession: (planId: string) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  //createSetupIntent: () => Promise<{ clientSecret: string }>;
  //setDefaultPaymentMethod: (paymentMethodId: string) => Promise<void>;
  //removePaymentMethod: (paymentMethodId: string) => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  plans: [],
  currentSubscription: null,
  paymentMethods: [],
  loading: false,
  error: null,
  
  clearError: () => set({ error: null }),
  
  fetchSubscriptionPlans: async () => {
    set({ loading: true, error: null });
    try {
      const plans = await subscriptionService.getSubscriptionPlans();
      set({ plans, loading: false });
    } catch (error: any) {
      console.error('Error in fetchSubscriptionPlans:', error);
      set({ 
        error: error.message || 'Failed to fetch subscription plans', 
        loading: false 
      });
    }
  },
  
  fetchCurrentSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const subscription = await subscriptionService.getCurrentSubscription();
      
      set({ currentSubscription: subscription, loading: false });
    } catch (error: any) {
      console.error('Error in fetchCurrentSubscription:', error);
      set({ 
        error: error.message || 'Failed to fetch current subscription', 
        loading: false 
      });
    }
  },
  
  // fetchPaymentMethods: async () => {
  //   set({ loading: true, error: null });
  //   try {
  //     const paymentMethods = await subscriptionService.getPaymentMethods();
  //     set({ paymentMethods, loading: false });
  //   } catch (error: any) {
  //     console.error('Error in fetchPaymentMethods:', error);
  //     set({ 
  //       error: error.message || 'Failed to fetch payment methods', 
  //       loading: false 
  //     });
  //   }
  // },
  
  createCheckoutSession: async (planId: string) => {
    set({ loading: true, error: null });
    try {
      const result = await subscriptionService.createCheckoutSession(planId);
      set({ loading: false });
      return result;
    } catch (error: any) {
      console.error('Error in createCheckoutSession:', error);
      set({ 
        error: error.message || 'Failed to create checkout session', 
        loading: false 
      });
      throw error;
    }
  },
  
  cancelSubscription: async () => {
    set({ loading: true, error: null });
    try {
      await subscriptionService.cancelSubscription();
      
      // Refresh subscription after cancellation
      const subscription = await subscriptionService.getCurrentSubscription();
      set({ currentSubscription: subscription, loading: false });
    } catch (error: any) {
      console.error('Error in cancelSubscription:', error);
      set({ 
        error: error.message || 'Failed to cancel subscription', 
        loading: false 
      });
      throw error;
    }
  },

  fetchFreeSubscription: async () => {
    set({ loading: true, error: null });
    try {

      // Refresh subscription after cancellation
      const freePlan = await subscriptionService.fetchFreeSubscription();
      set({ currentSubscription: freePlan, loading: false });

      return freePlan;

    } catch (error: any) {
      console.error('Error in fetchFreeSubscription:', error);
      set({ 
        error: error.message || 'Failed to fetchFreeSubscription subscription', 
        loading: false 
      });
      throw error;
    }
  },

  setSubscription: async (planId: string) => {
    set({ loading: true, error: null });
    try {

      await subscriptionService.setSubscription(planId);

    } catch (error: any) {
      console.error('Error in setSubscription:', error);
      set({ 
        error: error.message || 'Failed to setSubscription subscription', 
        loading: false 
      });
      throw error;
    }
  },
  
  // createSetupIntent: async () => {
  //   set({ loading: true, error: null });
  //   try {
  //     const result = await subscriptionService.createSetupIntent();
  //     set({ loading: false });
  //     return result;
  //   } catch (error: any) {
  //     console.error('Error in createSetupIntent:', error);
  //     set({ 
  //       error: error.message || 'Failed to create setup intent', 
  //       loading: false 
  //     });
  //     throw error;
  //   }
  // },
  
  // setDefaultPaymentMethod: async (paymentMethodId: string) => {
  //   set({ loading: true, error: null });
  //   try {
  //     await subscriptionService.setDefaultPaymentMethod(paymentMethodId);
      
  //     // Refresh payment methods after setting default
  //     const paymentMethods = await subscriptionService.getPaymentMethods();
  //     set({ paymentMethods, loading: false });
  //   } catch (error: any) {
  //     console.error('Error in setDefaultPaymentMethod:', error);
  //     set({ 
  //       error: error.message || 'Failed to set default payment method', 
  //       loading: false 
  //     });
  //     throw error;
  //   }
  // },
  
  // removePaymentMethod: async (paymentMethodId: string) => {
  //   set({ loading: true, error: null });
  //   try {
  //     await subscriptionService.removePaymentMethod(paymentMethodId);
      
  //     // Refresh payment methods after removal
  //     const paymentMethods = await subscriptionService.getPaymentMethods();
  //     set({ paymentMethods, loading: false });
  //   } catch (error: any) {
  //     console.error('Error in removePaymentMethod:', error);
  //     set({ 
  //       error: error.message || 'Failed to remove payment method', 
  //       loading: false 
  //     });
  //     throw error;
  //   }
  // }
}));