import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Bot, Phone, Brain } from 'lucide-react';

interface PricingCardProps {
  plan: typeof plans[0];
  isHovered: boolean;
  onHover: (name: string | null) => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, isHovered, onHover }) => {
  const isMobile = window.innerWidth < 768;
  const navigate = useNavigate();

  return (
    <div
      className={`relative bg-dark-800 rounded-2xl p-8 border-2 transition-all duration-300 cursor-pointer ${
        isHovered
          ? 'border-primary-500 transform scale-105 shadow-xl'
          : 'border-dark-700 transform scale-100'
      }`}
      onMouseEnter={() => onHover(plan.name)}
      onMouseLeave={() => onHover(null)}
      onClick={() => navigate(plan.link)}
    >
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
        {(isMobile ? plan.mobileFeatures : plan.features).map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="text-primary-500 mt-1 mr-2 flex-shrink-0" size={16} />
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
        {isMobile && plan.features.length > plan.mobileFeatures.length && (
          <li className="text-center text-primary-400 mt-2">
            +{plan.features.length - plan.mobileFeatures.length} more features
          </li>
        )}
      </ul>

      <Link
        to={plan.link}
        className={`w-full btn btn-primary flex items-center justify-center space-x-2 group`}
      >
        <span>{plan.price === 0 ? 'Sign Up Free' : 'Learn More'}</span>
        <ArrowRight
          size={16}
          className={`transform transition-transform duration-300 ${
            isHovered ? 'translate-x-1' : ''
          }`}
        />
      </Link>
    </div>
  );
};

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
      'Simple reporting tools',
      'Email notifications',
      'Basic dashboard',
      'Mobile app access',
      'Standard documentation'
    ],
    mobileFeatures: [
      'Basic invoicing functionality',
      'PDF invoice generation', 
      'Manual invoice downloads',
      'Limited to 5 invoices per month',
      'Single user account',
      'Basic email support'
    ],
    link: '/register'
  },
  {
    name: 'Basic',
    price: 19.99,
    description: 'Essential features for growing businesses',
    features: [
      'Unlimited invoices & quotes',
      'Custom invoice templates',
      'Automated payment reminders',
      'Up to 25 customers',
      'Basic inventory tracking',
      'Email delivery system',
      'Customer contact management',
      'Basic CRM features',
      'CSV data export',
      'Standard support',
      'Basic document storage',
      'Simple workflow automation',
      'Email templates',
      'Basic task management'
    ],
    mobileFeatures: [
      'All Free Plan features',
      'Email delivery to customers',
      'Invoice templates',
      'Recurring invoices',
      'Up to 25 customers',
      'Customer contact management'
    ],
    link: '/features/basic-plan'
  },
  {
    name: 'Business',
    price: 99.99,
    description: 'Advanced features for established businesses',
    features: [
      'Unlimited customers & products',
      'Advanced analytics dashboard',
      'Team collaboration tools',
      'Custom integrations & API',
      'Multi-currency support',
      'Inventory management',
      'Automated workflows',
      'Priority support',
      'Custom branding options',
      'Advanced reporting',
      'Role-based access control',
      'Bulk operations & imports',
      'Advanced document management',
      'Custom fields & forms',
      'Advanced search capabilities',
      'Audit logs & compliance'
    ],
    mobileFeatures: [
      'All Basic Plan features',
      'Up to 50 customers',
      'Customer segmentation',
      'Advanced analytics',
      'Team collaboration',
      'Priority support'
    ],
    link: '/features/business-plan'
  },
  {
    name: 'Enterprise',
    price: 399.99,
    description: 'Complete AI-powered solution for large businesses',
    features: [
      'AI-powered automation suite',
      'Intelligent virtual assistant',
      'Predictive analytics',
      'Natural language processing',
      'Automated follow-up system',
      'AI revenue forecasting',
      'Multi-language support',
      'Enterprise-grade security',
      'Dedicated success manager',
      'Custom AI development'
    ],
    mobileFeatures: [
      'All Business Plan features',
      'AI Virtual Assistant',
      'Voice Collections',
      'Smart Analytics',
      'Custom AI Training',
      'Dedicated Support'
    ],
    highlightFeatures: [
      {
        icon: Bot,
        title: 'AI Assistant',
        description: 'Intelligent virtual assistant for customer interactions'
      },
      {
        icon: Phone,
        title: 'Voice Collections',
        description: 'Automated, AI-powered collection calls'
      },
      {
        icon: Brain,
        title: 'Smart Analytics',
        description: 'Predictive analysis and insights'
      }
    ],
    link: '/features/enterprise-plan'
  }
];

const PricingSection: React.FC = () => {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <section className="relative">
      {/* Visual break with gradient and pattern */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dark-900 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.15),rgba(99,102,241,0)_100%)]"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }}></div>
      </div>

      {/* Main content */}
      <div className="relative pt-32 pb-20 bg-dark-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that best fits your business needs. Premium plans coming soon!
            </p>
          </div>

          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map(plan => (
              <PricingCard
                key={plan.name}
                plan={plan}
                isHovered={hoveredPlan === plan.name}
                onHover={setHoveredPlan}
              />
            ))}
          </div> */}

          <div className="text-center mt-12">
            <p className="text-gray-400">
              Need a custom solution?{' '}
              <Link to="/contact" className="text-primary-400 hover:text-primary-300">
                Contact our sales team
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;