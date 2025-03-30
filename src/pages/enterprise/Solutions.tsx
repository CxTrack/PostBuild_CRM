import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Building, Users, FileText, ShoppingCart, DollarSign, Briefcase, Stethoscope, GraduationCap, Gavel, Ban as Bank, HomeIcon } from 'lucide-react';

const Solutions: React.FC = () => {
  const industries = [
    {
      title: 'Financial Services',
      icon: Bank,
      description: 'Automate client communications, risk assessment, and compliance monitoring.',
      useCases: [
        'Automated credit assessment',
        'KYC process automation',
        'Investment advisory',
        'Fraud detection'
      ]
    },
    {
      title: 'Healthcare',
      icon: Stethoscope,
      description: 'Streamline patient scheduling, billing, and administrative tasks.',
      useCases: [
        'Patient appointment scheduling',
        'Insurance verification',
        'Medical billing automation',
        'Patient follow-up management'
      ]
    },
    {
      title: 'Real Estate',
      icon: HomeIcon,
      description: 'Enhance property management and client engagement.',
      useCases: [
        'Property inquiry handling',
        'Showing scheduling',
        'Tenant communication',
        'Lease renewal automation'
      ]
    },
    {
      title: 'Legal Services',
      icon: Gavel,
      description: 'Automate client intake, document processing, and case management.',
      useCases: [
        'Client intake automation',
        'Document review',
        'Case status updates',
        'Appointment scheduling'
      ]
    },
    {
      title: 'Education',
      icon: GraduationCap,
      description: 'Improve student engagement and administrative efficiency.',
      useCases: [
        'Student enrollment',
        'Course inquiries',
        'Assignment tracking',
        'Parent communication'
      ]
    },
    {
      title: 'Professional Services',
      icon: Briefcase,
      description: 'Streamline client services and project management.',
      useCases: [
        'Client onboarding',
        'Project updates',
        'Resource allocation',
        'Time tracking'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Industry Solutions
            </h1>
            <p className="text-xl text-primary-200">
              Discover how our AI agents can transform operations across different industries
            </p>
          </div>
        </div>
      </div>

      {/* Industries Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industries.map((industry, index) => (
            <div key={index} className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <industry.icon className="text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{industry.title}</h3>
              <p className="text-gray-400 mb-4">{industry.description}</p>
              <div className="space-y-2">
                {industry.useCases.map((useCase, i) => (
                  <div key={i} className="flex items-start">
                    <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                    <span className="text-gray-300">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Solution Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Don't See Your Industry?
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              Our AI agents can be customized for any industry. Contact us to discuss your specific needs and how we can help transform your operations.
            </p>
            <Link 
              to="/contact" 
              className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-8 py-3"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solutions;