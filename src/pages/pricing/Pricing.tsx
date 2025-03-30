import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Bot, Brain, Clock, Star } from 'lucide-react';

const Pricing: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: 0,
      description: 'Basic features for small businesses',
      features: [ 
        'Up to 5 invoices per month',
        'Basic invoice templates',
        'PDF generation & download',
        'Single user access',
        'Basic customer database',
        'Email support'
      ],
      link: '/register'
    },
    {
      name: 'Business',
      price: 99.99,
      description: 'Advanced features for growing businesses',
      features: [
        'Unlimited invoices',
        'Custom invoice templates',
        'Automated reminders',
        'Team collaboration',
        'Advanced reporting',
        'Priority support',
        'API access',
        'Custom integrations'
      ],
      link: '/features/business-plan'
    },
    {
      name: 'Enterprise',
      price: 399.99,
      description: 'Complete AI-powered solution for large businesses',
      highlightFeatures: [
        {
          icon: Bot,
          title: 'AI Assistant',
          description: 'Intelligent virtual assistant for customer interactions'
        },
        {
          icon: Brain,
          title: 'Smart Analytics',
          description: 'Predictive analysis and insights'
        },
        {
          icon: Clock,
          title: '24/7 Support',
          description: 'Round-the-clock dedicated support'
        }
      ],
      features: [
        'AI-powered automation',
        'Voice collection calls',
        'Smart payment reminders',
        'Sentiment analysis',
        'Custom AI training',
        'Dedicated support'
      ],
      link: '/features/enterprise-plan'
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-primary-200">
              Choose the plan that best fits your business needs
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.name} className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              {plan.name === 'Enterprise' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    AI-Powered
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  ${plan.price}
                  <span className="text-lg text-gray-400">/mo</span>
                </div>
                <p className="text-gray-400">{plan.description}</p>
              </div>

              {plan.highlightFeatures && (
                <div className="mb-8 space-y-4">
                  {plan.highlightFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center p-3 bg-dark-700/50 rounded-lg">
                      <feature.icon className="text-primary-400 mr-3" size={24} />
                      <div>
                        <h4 className="text-white font-medium">{feature.title}</h4>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="text-primary-500 mt-1 mr-2" size={16} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={plan.link}
                className="w-full btn btn-primary flex items-center justify-center space-x-2 group"
              >
                <span>{plan.price === 0 ? 'Sign Up Free' : 'Learn More'}</span>
              </Link>
            </div>
          ))}
        </div>

        {/* Compare Features Link */}
        <div className="text-center mt-12">
          <Link to="/pricing/compare" className="text-primary-400 hover:text-primary-300 flex items-center justify-center">
            <Star className="mr-2" size={16} />
            Compare all features
          </Link>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-white text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              Can I upgrade or downgrade my plan?
            </h3>
            <p className="text-gray-400">
              Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
            </p>
          </div>
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              Is there a long-term contract?
            </h3>
            <p className="text-gray-400">
              No, all our plans are month-to-month with no long-term commitment required.
            </p>
          </div>
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              What payment methods do you accept?
            </h3>
            <p className="text-gray-400">
              We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.
            </p>
          </div>
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <h3 className="text-lg font-semibold text-white mb-2">
              Do you offer a free trial?
            </h3>
            <p className="text-gray-400">
              Yes, you can start with our Free plan to test our basic features, or request a demo for Business and Enterprise features.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Our team is here to help you find the perfect plan for your business needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
              Contact Sales
            </Link>
            <Link to="/demo" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;