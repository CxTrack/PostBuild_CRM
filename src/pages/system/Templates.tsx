import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, Building, DollarSign, Download, Plus } from 'lucide-react';
import { useTemplateStore } from '../../stores/templateStore';
import { toast } from 'react-hot-toast';

const Templates: React.FC = () => {
  const { activeTemplate, setActiveTemplate, getActiveTemplate, loading } = useTemplateStore();

  useEffect(() => {
    getActiveTemplate();
  }, [getActiveTemplate]);

  const handleTemplateSwitch = async (templateId: string) => {
    try {
      await setActiveTemplate(templateId);
      toast.success(`Successfully switched to ${templates.find(t => t.id === templateId)?.name} template`);
    } catch (error) {
      toast.error('Failed to switch template');
    }
  };

  const templates = [
    // {
    //   id: 'small-business',
    //   name: 'Small Business',
    //   description: 'Perfect for small businesses and startups',
    //   isActive: activeTemplate === 'small-business',
    //   items: [
    //     {
    //       type: 'Customer Types',
    //       data: [
    //         'Individual Customer',
    //         'Small Business',
    //         'Freelancer',
    //         'Local Business'
    //       ]
    //     },
    //     {
    //       type: 'Product Categories',
    //       data: [
    //         'Services',
    //         'Products',
    //         'Consulting',
    //         'Support'
    //       ]
    //     },
    //     {
    //       type: 'Invoice Terms',
    //       data: [
    //         'Net 30',
    //         'Due on Receipt',
    //         'Net 15',
    //         'Custom Terms'
    //       ]
    //     },
    //     {
    //       type: 'Payment Methods',
    //       data: [
    //         'Credit Card',
    //         'Bank Transfer',
    //         'Cash',
    //         'Check'
    //       ]
    //     }
    //   ],
    //   features: [
    //     'Basic customer management',
    //     'Simple invoicing workflow',
    //     'Essential product tracking',
    //     'Basic reporting'
    //   ]
    // },
    // {
    //   id: 'realtors',
    //   name: 'Realtors',
    //   description: 'Tailored for real estate professionals',
    //   isActive: activeTemplate === 'realtors',
    //   items: [
    //     {
    //       type: 'Client Types',
    //       data: [
    //         'Home Buyer',
    //         'Home Seller',
    //         'Property Investor',
    //         'Commercial Client'
    //       ]
    //     },
    //     {
    //       type: 'Property Categories',
    //       data: [
    //         'Residential',
    //         'Commercial',
    //         'Investment',
    //         'Luxury'
    //       ]
    //     },
    //     {
    //       type: 'Service Types',
    //       data: [
    //         'Property Listing',
    //         'Buyer Representation',
    //         'Property Management',
    //         'Market Analysis'
    //       ]
    //     },
    //     {
    //       type: 'Commission Types',
    //       data: [
    //         'Fixed Rate',
    //         'Percentage Based',
    //         'Tiered Commission',
    //         'Split Commission'
    //       ]
    //     }
    //   ],
    //   features: [
    //     'Property listing management',
    //     'Client pipeline tracking',
    //     'Commission calculation',
    //     'Showing schedule management',
    //     'Document management',
    //     'Market analysis tools'
    //   ]
    // },
    // {
    //   id: 'mortgage-brokers',
    //   name: 'Mortgage Brokers',
    //   description: 'Specialized for mortgage and lending professionals',
    //   isActive: activeTemplate === 'mortgage-brokers',
    //   items: [
    //     {
    //       type: 'Client Types',
    //       data: [
    //         'First-time Buyer',
    //         'Refinancing',
    //         'Investment Property',
    //         'Commercial Loan'
    //       ]
    //     },
    //     {
    //       type: 'Loan Types',
    //       data: [
    //         'Conventional',
    //         'FHA',
    //         'VA',
    //         'Commercial'
    //       ]
    //     },
    //     {
    //       type: 'Document Categories',
    //       data: [
    //         'Income Verification',
    //         'Credit Reports',
    //         'Property Appraisals',
    //         'Loan Applications'
    //       ]
    //     },
    //     {
    //       type: 'Status Tracking',
    //       data: [
    //         'Pre-Approval',
    //         'Application',
    //         'Underwriting',
    //         'Closing'
    //       ]
    //     }
    //   ],
    //   features: [
    //     'Loan application tracking',
    //     'Document collection system',
    //     'Rate comparison tools',
    //     'Payment calculators',
    //     'Automated follow-ups',
    //     'Lender relationship management'
    //   ]
    // },
    // {
    //   id: 'insurance-brokers',
    //   name: 'Insurance Brokers',
    //   description: 'Complete solution for insurance professionals',
    //   isActive: activeTemplate === 'insurance-brokers',
    //   items: [
    //     {
    //       type: 'Policy Types',
    //       data: [
    //         'Life Insurance',
    //         'Health Insurance',
    //         'Property Insurance',
    //         'Business Insurance'
    //       ]
    //     },
    //     {
    //       type: 'Client Categories',
    //       data: [
    //         'Individual',
    //         'Family',
    //         'Small Business',
    //         'Corporate'
    //       ]
    //     },
    //     {
    //       type: 'Renewal Tracking',
    //       data: [
    //         '30 Days Notice',
    //         '60 Days Notice',
    //         '90 Days Notice',
    //         'Annual Review'
    //       ]
    //     },
    //     {
    //       type: 'Claims Status',
    //       data: [
    //         'New Claim',
    //         'In Progress',
    //         'Under Review',
    //         'Settled'
    //       ]
    //     }
    //   ],
    //   features: [
    //     'Policy management',
    //     'Claims tracking',
    //     'Renewal automation',
    //     'Premium calculators',
    //     'Client risk assessment',
    //     'Commission tracking'
    //   ]
    // }
    // ,
    {
      id: 'call-center',
      name: 'Call Center',
      description: 'Optimized for businesses with high call volumes and agent management needs.',
      isActive: activeTemplate === 'call-center',
      items: [
        {
          type: 'Call Template Features',
          data: [
            'AI Agents - Inbound Calls',
            'Calls Statistics',
            'Calls Summary',
            'Calls Recording'
          ]
        },
        {
          type: 'Modules',
          data: [
            'Dashboard',
            'Customers',
            'Calls',
            'Templates'
          ]
        }
      ],
      features: [
        'Call scripts',
        'Agents management',
        'Call logging and tracking',
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">CRM Templates</h1>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus size={16} />
          <span>Create Template</span>
        </button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            {/* Template Header */}
            <div className="p-6 border-b border-dark-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold text-white">{template.name}</h3>
                  {template.isActive && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-900/30 text-green-400 rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-primary-500/20">
                  <Building className="text-primary-400" size={20} />
                </div>
              </div>
              <p className="text-gray-400">{template.description}</p>
            </div>

            {/* Template Content */}
            <div className="p-6 space-y-6">
              {template.items.map((item, index) => (
                <div key={index}>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">{item.type}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {item.data.map((value, i) => (
                      <div key={i} className="bg-dark-700/50 px-3 py-2 rounded text-sm text-gray-300">
                        {value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">Features</h4>
                <ul className="space-y-2">
                  {template.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300 text-sm">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Template Actions */}
            <div className="p-6 bg-dark-700/50 border-t border-dark-700">
              {template.isActive ? (
                <button 
                  disabled 
                  className="btn btn-secondary w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                >
                  <span>Currently Active</span>
                </button>
              ) : (
                <button 
                  onClick={() => handleTemplateSwitch(template.id)}
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <Download size={16} />
                  <span>{loading ? 'Switching...' : 'Use Template'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Templates;