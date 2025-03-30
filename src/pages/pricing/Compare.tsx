import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

const ComparePlans: React.FC = () => {
  const features = {
    basic: [
      'All Free Plan features',
      'Email delivery to customers',
      'Invoice templates',
      'Recurring invoices',
      'Up to 25 customers',
      'Customer contact management',
      'Basic customer history',
      'Up to 10 products',
      'Basic product catalog',
      'Email notifications',
      'Basic reporting',
      'CSV data export',
      'Standard support',
      'Mobile app access',
      'Basic inventory tracking',
      'Simple dashboard',
      'Payment reminders',
      'Basic document storage',
      'Customer notes',
      'Basic search functionality',
      'Email templates',
      'Basic task management',
      'Simple workflow automation',
      'Basic API access'
    ],
    business: [
      'All Basic Plan features',
      'Up to 50 customers',
      'Customer segmentation',
      'Advanced customer analytics',
      'Customer communication history',
      'Up to 50 products',
      'Product categories',
      'Stock tracking',
      'Accounting software integration',
      'Payment gateway integration',
      'Email marketing tools',
      'Multiple invoice templates',
      'Bulk invoice generation',
      'Invoice scheduling',
      'Custom branding',
      'Advanced reporting',
      'Team collaboration',
      'Role-based access control',
      'Audit logs',
      'Priority support',
      'Advanced search',
      'Custom fields',
      'Automated workflows',
      'Data backup',
      'API access',
      'Multi-currency support',
      'Customizable dashboards',
      'Advanced document management',
      'Batch processing',
      'Business intelligence tools'
    ],
    enterprise: [
      'All Business Plan features',
      'AI-Powered Virtual Assistant',
      'Automated Voice Collection Calls',
      'Smart Payment Reminders',
      'AI Customer Sentiment Analysis',
      'Voice-to-Text Transcription',
      'Predictive Payment Analysis',
      'Natural Language Processing',
      'Automated Follow-up System',
      'AI Revenue Forecasting',
      'Smart Customer Segmentation',
      'Voice Authentication',
      'Multi-Language Support',
      'Custom AI Training',
      'Unlimited Team Members',
      'Advanced Analytics Dashboard',
      'Custom Integration Support',
      'Priority 24/7 Support',
      'Dedicated Account Manager'
    ]
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Compare Plans
            </h1>
            <p className="text-xl text-primary-200">
              Find the perfect plan for your business needs
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mx-auto px-4 py-16">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="py-4 px-6 text-left"></th>
                <th className="py-4 px-6 text-center">
                  <div className="text-xl font-bold text-white mb-2">Free</div>
                  <div className="text-3xl font-bold text-white mb-2">$0</div>
                  <div className="text-sm text-gray-400 mb-4">per month</div>
                  <Link to="/register" className="btn btn-secondary w-full">
                    Start Free
                  </Link>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="text-xl font-bold text-white mb-2">Basic</div>
                  <div className="text-3xl font-bold text-white mb-2">$19.99</div>
                  <div className="text-sm text-gray-400 mb-4">per month</div>
                  <Link to="/features/basic-plan" className="btn btn-primary w-full">
                    Learn More
                  </Link>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="text-xl font-bold text-white mb-2">Business</div>
                  <div className="text-3xl font-bold text-white mb-2">$99.99</div>
                  <div className="text-sm text-gray-400 mb-4">per month</div>
                  <Link to="/features/business-plan" className="btn btn-primary w-full">
                    Learn More
                  </Link>
                </th>
                <th className="py-4 px-6 text-center">
                  <div className="text-xl font-bold text-white mb-2">Enterprise</div>
                  <div className="text-3xl font-bold text-white mb-2">$399.99</div>
                  <div className="text-sm text-gray-400 mb-4">per month</div>
                  <Link to="/features/enterprise-plan" className="btn btn-primary w-full">
                    Learn More
                  </Link>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {/* Basic Features */}
              <tr>
                <td colSpan={4} className="py-4 px-6">
                  <h3 className="text-lg font-semibold text-white">Basic Features</h3>
                </td>
              </tr>
              {features.basic.map((feature, index) => (
                <tr key={index} className="hover:bg-dark-800/50">
                  <td className="py-3 px-6 text-gray-300">{feature}</td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                </tr>
              ))}

              {/* Business Features */}
              <tr>
                <td colSpan={4} className="py-4 px-6">
                  <h3 className="text-lg font-semibold text-white">Business Features</h3>
                </td>
              </tr>
              {features.business.map((feature, index) => (
                <tr key={index} className="hover:bg-dark-800/50">
                  <td className="py-3 px-6 text-gray-300">{feature}</td>
                  <td className="py-3 px-6 text-center">
                    <X className="mx-auto text-red-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <X className="mx-auto text-red-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                </tr>
              ))}

              {/* Enterprise Features */}
              <tr>
                <td colSpan={4} className="py-4 px-6">
                  <h3 className="text-lg font-semibold text-white">Enterprise Features</h3>
                </td>
              </tr>
              {features.enterprise.map((feature, index) => (
                <tr key={index} className="hover:bg-dark-800/50">
                  <td className="py-3 px-6 text-gray-300">{feature}</td>
                  <td className="py-3 px-6 text-center">
                    <X className="mx-auto text-red-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <X className="mx-auto text-red-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <X className="mx-auto text-red-500" size={20} />
                  </td>
                  <td className="py-3 px-6 text-center">
                    <Check className="mx-auto text-green-500" size={20} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default ComparePlans;