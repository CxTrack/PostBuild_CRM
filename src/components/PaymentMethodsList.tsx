import React from 'react';
import { CreditCard, Check, Trash2 } from 'lucide-react';
import { PaymentMethod } from '../types/database.types';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { toast } from 'react-hot-toast';

interface PaymentMethodsListProps {
  paymentMethods: PaymentMethod[];
}

const PaymentMethodsList: React.FC<PaymentMethodsListProps> = ({ paymentMethods }) => {
  const { setDefaultPaymentMethod, removePaymentMethod, loading } = useSubscriptionStore();

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
      toast.success('Default payment method updated');
    } catch (error) {
      toast.error('Failed to update default payment method');
    }
  };

  const handleRemove = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this payment method?')) {
      try {
        await removePaymentMethod(id);
        toast.success('Payment method removed');
      } catch (error) {
        toast.error('Failed to remove payment method');
      }
    }
  };

  const getCardBrandIcon = (brand: string) => {
    switch (brand.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳 Card';
    }
  };

  if (paymentMethods.length === 0) {
    return (
      <div className="text-center py-6 bg-dark-800 rounded-lg border border-dark-700">
        <CreditCard size={48} className="mx-auto text-gray-500 mb-2" />
        <p className="text-gray-400">No payment methods added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => (
        <div key={method.id} className="bg-dark-800 rounded-lg border border-dark-700 p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-white text-lg">
                {getCardBrandIcon(method.card_brand)}
              </div>
              <div>
                <p className="text-white">•••• {method.card_last4}</p>
                <p className="text-sm text-gray-400">
                  Expires {method.card_exp_month}/{method.card_exp_year}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {method.is_default ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
                  <Check size={12} className="mr-1" />
                  Default
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(method.id)}
                  disabled={loading}
                  className="text-sm text-primary-400 hover:text-primary-300"
                >
                  Make Default
                </button>
              )}
              <button
                onClick={() => handleRemove(method.id)}
                disabled={loading || method.is_default}
                className={`text-red-400 hover:text-red-300 ${method.is_default ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentMethodsList;