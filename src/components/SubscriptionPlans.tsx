import React, { useEffect, useState } from 'react';
import { Check, Loader } from 'lucide-react';
import { SubscriptionPlan, Subscription } from '../types/database.types';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { toast } from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentSubscription: Subscription | null;
}

const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ plans, currentSubscription }) => {
  const { createCheckoutSession, fetchFreeSubscription, fetchCurrentSubscription, setSubscription, cancelSubscription, loading } = useSubscriptionStore();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [isFreeSubscription, setIsFreeSubscription] = useState<boolean>(false);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);

  useEffect(() => {
    evaluateSubscriptionType();
  }, []);


  const evaluateSubscriptionType = async () => {
    const freeSubscription = await fetchFreeSubscription();
    await fetchCurrentSubscription(); // Refresh currentSubscription from store

    const latestSubscription = useSubscriptionStore.getState().currentSubscription;
    if (latestSubscription?.plan_id === freeSubscription.id) {
      setIsFreeSubscription(true);
    } else {
      setIsFreeSubscription(false);
    }
  };
  

  function getCurrentPlan() {
    if (!currentSubscription)
      return null;

    let plan = plans.find(plan => plan.id === currentSubscription.plan_id);
    return plan;
  }

  let currentPlan = getCurrentPlan();

  const handleSubscribe = async (planId: string) => {
    try {
      const freePlan = await fetchFreeSubscription();
      if (freePlan.id === planId) {

        await setSubscription(planId, true);
        setProcessingPlanId(null);

        currentPlan = getCurrentPlan();

        return;
      } else {
        const url = await createCheckoutSession(planId);
        window.open(url, '_blank');

        await setSubscription(planId, false);
        currentPlan = getCurrentPlan();

        setProcessingPlanId(null);
      }

    } catch (error) {
      toast.error('Failed to create checkout session');
      setProcessingPlanId(null);
    }finally {
      await evaluateSubscriptionType();
    }
  };

  const handleCancel = () => {
    setShowCancelConfirmation(true);
  };

  const handleConfirmCancel = async () => {
    try {
      await cancelSubscription();
      toast.success('Subscription canceled successfully');
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setShowCancelConfirmation(false);
      await evaluateSubscriptionType();
    }
  };

  const handleCloseCancel = () => {
    setShowCancelConfirmation(false);
  };

  return (

    <div className="space-y-6">
      <ConfirmationModal
        isOpen={showCancelConfirmation}
        onClose={handleCloseCancel}
        onConfirm={handleConfirmCancel}
        title="Cancel Subscription"
        message="Are you sure you want to cancel your subscription? You will still have access until the end of your billing period."
        confirmButtonText="Yes, Cancel"
        cancelButtonText="No, Keep Subscription"
        isDanger={true}
      />
      {currentSubscription && currentPlan && (
        <div className="bg-primary-900/20 border border-primary-800 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-white">Current Plan: {currentPlan.name}</h3>

              {!isFreeSubscription && (
                <p className="text-gray-300 mt-1">
                  {currentSubscription.cancel_at_period_end
                    ? 'Your subscription will end on '
                    : 'Your next billing date is '}
                  {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                </p>)
              }

            </div>
            {!currentSubscription.cancel_at_period_end &&  !isFreeSubscription && (
              <button
                onClick={handleCancel}
                disabled={loading}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                {loading ? 'Processing...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id;// && !currentSubscription?.cancel_at_period_end;
          const isProcessing = processingPlanId === plan.id;

          //console.log(currentPlan);
          

          return (
            <div
              key={plan.id}
              className={`bg-dark-800 border rounded-lg p-6 ${isCurrentPlan ? 'border-primary-500' : 'border-dark-700'
                }`}
            >
              <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
              <p className="text-2xl font-bold text-white mb-4">
                ${plan.price}/{plan.interval}
              </p>
              <p className="text-gray-400 mb-6">{plan.description}</p>

              <ul className="space-y-2 mb-6">
                {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check size={18} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrentPlan || isProcessing || loading}
                className={`w-full btn ${isCurrentPlan ? 'btn-secondary' : 'btn-primary'
                  }`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center">
                    <Loader size={16} className="animate-spin mr-2" />
                    Processing...
                  </span>
                ) : isCurrentPlan ? (
                  'Current Plan'
                  // ) : plan.price === 0 ? (
                  //  'Free Plan'
                  //`${plan.name}`
                ) : (
                  `Subscribe to ${plan.name}`
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionPlans;