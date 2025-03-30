import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, Key, Database, Eye, FileCheck, Server, Users, CheckCircle } from 'lucide-react';

const Security: React.FC = () => {
  const securityFeatures = [
    {
      title: 'Data Encryption',
      icon: Lock,
      description: 'Enterprise-grade encryption for all data at rest and in transit',
      features: [
        'AES-256 encryption at rest',
        'TLS 1.3 for data in transit',
        'End-to-end encryption for sensitive communications',
        'Secure key management'
      ]
    },
    {
      title: 'Access Control',
      icon: Key,
      description: 'Granular access controls and user management',
      features: [
        'Role-based access control (RBAC)',
        'Multi-factor authentication',
        'Single sign-on (SSO)',
        'IP whitelisting'
      ]
    },
    {
      title: 'Data Privacy',
      icon: Eye,
      description: 'Comprehensive data privacy measures',
      features: [
        'GDPR compliance',
        'Data anonymization',
        'Privacy by design',
        'Data retention policies'
      ]
    },
    {
      title: 'Compliance',
      icon: FileCheck,
      description: 'Industry standard compliance and certifications',
      features: [
        'SOC 2 Type II certified',
        'HIPAA compliance',
        'GDPR compliance',
        'Regular security audits'
      ]
    },
    {
      title: 'Infrastructure Security',
      icon: Server,
      description: 'Secure and reliable infrastructure',
      features: [
        'DDoS protection',
        'WAF (Web Application Firewall)',
        'Regular penetration testing',
        'Automated security scanning'
      ]
    },
    {
      title: 'AI Security',
      icon: Shield,
      description: 'Specialized security for AI operations',
      features: [
        'AI model protection',
        'Training data security',
        'Inference protection',
        'Bias detection and mitigation'
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
              Enterprise-Grade Security
            </h1>
            <p className="text-xl text-primary-200">
              Your data security and privacy are our top priorities
            </p>
          </div>
        </div>
      </div>

      {/* Security Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <feature.icon className="text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 mb-4">{feature.description}</p>
              <ul className="space-y-2">
                {feature.features.map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle className="text-primary-500 mt-1 mr-2" size={16} />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              Trusted by Enterprises Worldwide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <div className="text-4xl font-bold text-primary-400 mb-2">99.9%</div>
                <p className="text-gray-300">Uptime SLA</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <div className="text-4xl font-bold text-primary-400 mb-2">24/7</div>
                <p className="text-gray-300">Security Monitoring</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <div className="text-4xl font-bold text-primary-400 mb-2">ISO 27001</div>
                <p className="text-gray-300">Certified</p>
              </div>
            </div>
            <Link 
              to="/contact" 
              className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-8 py-3"
            >
              Contact Security Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;