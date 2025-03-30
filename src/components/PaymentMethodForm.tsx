import React, { useState, useEffect } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';
import { useSubscriptionStore } from '../stores/subscriptionStore';

interface PaymentMethodFormProps {
  onSuccess?: () => void;
}

const PaymentMethodForm: React.FC<PaymentMethodFormProps> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSetupIntent, loading } = useSubscriptionStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const getSetupIntent = async () => {
      try {
        const { clientSecret } = await createSetupIntent();
        setClientSecret(clientSecret);
      } catch (error) {
        console.error('Error creating setup intent:', error);
        toast.error('Failed to initialize payment form');
      }
    };

    getSetupIntent();
  }, [createSetupIntent]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    
    if (!cardElement) {
      setProcessing(false);
      setCardError('Card element not found');
      return;
    }

    const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardElement,
      }
    });

    if (error) {
      setCardError(error.message || 'An error occurred with your card');
      setProcessing(false);
    } else if (setupIntent) {
      toast.success('Payment method added successfully');
      if (onSuccess) onSuccess();
      setProcessing(false);
      
      // Clear the card input
      cardElement.clear();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Card Details
        </label>
        <div className="p-3 bg-dark-700 rounded-md border border-dark-600">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#FFFFFF',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
                invalid: {
                  color: '#EF4444',
                },
              },
            }}
          />
        </div>
        {cardError && (
          <p className="text-sm text-red-400">{cardError}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!stripe || !clientSecret || processing || loading}
        className="btn btn-primary w-full"
      >
        {processing || loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : (
          'Add Payment Method'
        )}
      </button>
    </form>
  );
};

export default PaymentMethodForm;