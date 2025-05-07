import React, { useEffect, useState } from 'react';
//import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
//import { CreditCard, AlertCircle, Check, Trash2 } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
//import { toast } from 'react-hot-toast';
//import PaymentMethodsList from '../../components/PaymentMethodsList';
//import PaymentMethodForm from '../../components/PaymentMethodForm';
import SubscriptionPlans from '../../components/SubscriptionPlans';

const BillingTab: React.FC = () => {
  const { 
    plans, 
    currentSubscription, 
    paymentMethods, 
    loading, 
    error,
    fetchSubscriptionPlans, 
    fetchCurrentSubscription, 
    //fetchPaymentMethods 
  } = useSubscriptionStore();
  //const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);

  useEffect(() => {
    // Load subscription data
    fetchSubscriptionPlans();
    fetchCurrentSubscription();
    //fetchPaymentMethods();
  }, [fetchSubscriptionPlans, fetchCurrentSubscription]);

  // const handlePaymentMethodAdded = () => {
  //   setShowAddPaymentMethod(false);
  //   //fetchPaymentMethods();
  // };

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-white mb-4">Billing & Subscription</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-800 text-red-300 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Loading billing information...</p>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="text-md font-medium text-white">Subscription Plans</h3>
        <SubscriptionPlans 
          plans={plans} 
          currentSubscription={currentSubscription} 
        />
      </div>

      {/* <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-white">Payment Methods</h3>
          {!showAddPaymentMethod && (
            <button 
              onClick={() => setShowAddPaymentMethod(true)}
              className="btn btn-secondary text-sm"
            >
              Add Payment Method
            </button>
          )}
        </div>
        
        <PaymentMethodsList paymentMethods={paymentMethods} />
        
        {showAddPaymentMethod && (
          <div className="mt-6 pt-6 border-t border-dark-700">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-md font-medium text-white">Add Payment Method</h4>
              <button 
                onClick={() => setShowAddPaymentMethod(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
            <PaymentMethodForm onSuccess={handlePaymentMethodAdded} />
          </div>
        )}
      </div> */}

      {/* <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="p-2 rounded-md bg-blue-500/20 text-blue-500">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="text-md font-medium text-white mb-2">Billing Security</h3>
            <p className="text-gray-400 text-sm">
              Your payment information is securely processed by Stripe. We never store your full card details on our servers.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default BillingTab;