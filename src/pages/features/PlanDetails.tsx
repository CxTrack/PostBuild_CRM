import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, Loader } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { toast } from 'react-hot-toast';

const plans = {
  'free-plan': {
    name: 'Free Plan',
    price: 0,
    description: 'Basic features for small businesses',
    features: [
      'Basic invoicing functionality',
      'PDF invoice generation',
      'Manual invoice downloads',
      'Limited to 5 invoices per month'
    ],
    benefits: [
      {
        title: 'Perfect for Freelancers',
        description: 'Get started with essential invoicing tools at no cost.'
      },
      {
        title: 'Professional PDFs',
        description: 'Generate professional-looking invoices in PDF format.'
      },
      {
        title: 'Easy to Use',
        description: 'Simple and intuitive interface for basic business needs.'
      }
    ],
    stripeId: null // Free plan has no Stripe ID
  },
  'basic-plan': {
    name: 'Basic Plan',
    price: 19.99,
    description: 'Essential features for small businesses',
    features: [
      'All Free Plan features',
      'Email delivery to customers',
      'Invoice templates',
      'Recurring invoices',
      'Up to 25 customers',
      'Customer contact management',
      'Basic customer history',
      'Up to 10 products',
      'Basic product catalog'
    ],
    benefits: [
      {
        title: 'Streamlined Communication',
        description: 'Send invoices directly to customers via email.'
      },
      {
        title: 'Time-Saving Templates',
        description: 'Create and reuse professional invoice templates.'
      },
      {
        title: 'Customer Management',
        description: 'Keep track of customer information and history.'
      }
    ],
    stripeId: 'price_1Qz7DWGmarpEtABMVmArHtSG' // Basic Plan price ID
  },
  'business-plan': {
    name: 'Business Plan',
    price: 99.99,
    description: 'Advanced features for growing businesses',
    features: [
      'All Basic Plan features',
      'Up to 50 customers',
      'Customer segmentation',
      'Advanced customer analytics',
      'Up to 50 products',
      'Third-party integrations',
      'Multiple invoice templates',
      'Bulk invoice generation'
    ],
    benefits: [
      {
        title: 'Comprehensive Analytics',
        description: 'Make data-driven decisions with advanced customer insights.'
      },
      {
        title: 'Integrated Solutions',
        description: 'Connect with your favorite accounting and payment tools.'
      },
      {
        title: 'Automation',
        description: 'Save time with bulk operations and scheduled invoicing.'
      }
    ],
    stripeId: 'price_1Qz7GkGmarpEtABMeMjmUnPu' // Business Plan price ID
  },
  'enterprise-plan': {
    name: 'Enterprise Plan',
    price: 399.99,
    description: 'Complete solution for established businesses',
    features: [
      'All Business Plan features',
      'Unlimited customers',
      'AI-powered features',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'White-label options'
    ],
    benefits: [
      {
        title: 'Advanced AI Collections',
        description: 'Our AI-powered voice calling system automatically handles collection calls with natural conversation flow, sentiment analysis, and smart payment negotiations.'
      },
      {
        title: 'Intelligent Virtual Assistant',
        description: 'AI assistant handles customer inquiries, processes payments, and manages follow-ups with human-like interaction and understanding.'
      },
      {
        title: 'Smart Analytics & Predictions',
        description: 'Leverage machine learning for accurate revenue forecasting, customer behavior analysis, and payment prediction.'
      }
    ],
    aiFeatures: [
      {
        title: 'Voice Collections',
        description: 'AI-powered calling system that:',
        capabilities: [
          'Makes automated collection calls',
          'Understands customer responses',
          'Negotiates payment plans',
          'Detects customer sentiment',
          'Escalates to human agents when needed'
        ]
      },
      {
        title: 'Virtual Assistant',
        description: 'Intelligent AI assistant that:',
        capabilities: [
          'Handles customer inquiries 24/7',
          'Processes payments automatically',
          'Sends smart payment reminders',
          'Manages follow-up communications',
          'Learns from each interaction'
        ]
      },
      {
        title: 'Predictive Analytics',
        description: 'Machine learning system that:',
        capabilities: [
          'Forecasts payment likelihood',
          'Identifies at-risk accounts',
          'Suggests optimal collection times',
          'Analyzes customer patterns',
          'Recommends collection strategies'
        ]
      }
    ],
    stripeId: 'price_1Qz7HwGmarpEtABMrgE6JEo0' // Enterprise Plan price ID
  }
};

const PlanDetails: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const plan = plans[planId as keyof typeof plans];

  if (!plan) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Plan not found</h1>
          <Link to="/" className="text-primary-400 hover:text-primary-300">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const handleGetStarted = async () => {
    // Redirect to waitlist form with plan type
    navigate(`/dashboard?plan=${plan.name.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-white mb-8 hover:text-primary-200">
            <ArrowLeft size={20} className="mr-2" />
            Back to Home
          </Link>
          
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{plan.name}</h1>
            <p className="text-xl text-primary-200 mb-6">{plan.description}</p>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-white">${plan.price}</span>
              <span className="text-xl text-primary-200 ml-2">/month</span>
            </div>
            <button
              onClick={handleGetStarted}
              disabled={isProcessing}
              className="inline-block mt-8 btn btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Processing...
                </span>
              ) : (
                'Get Started'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {plan.aiFeatures && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">AI-Powered Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plan.aiFeatures.map((feature, index) => (
                <div key={index} className="bg-dark-800 rounded-xl p-6 border border-dark-700">
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.capabilities.map((capability, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="text-primary-500 mt-1 mr-2" size={16} />
                        <span className="text-gray-300">{capability}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Features</h2>
            <ul className="space-y-4">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="text-primary-500 mt-1 mr-3" size={20} />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-8">Key Benefits</h2>
            <div className="space-y-8">
              {plan.benefits.map((benefit, index) => (
                <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Start using our platform to streamline your operations today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={handleGetStarted}
              disabled={isProcessing}
              className="btn btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Processing...
                </span>
              ) : (
                'Sign Up'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanDetails;