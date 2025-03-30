import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Disclosure } from '@headlessui/react';
import { Code, Bot, Zap, MessageSquare, Settings, Users, Phone, Calendar, FileText, ChevronDown, Brain, Network, Database } from 'lucide-react';

const CustomDevelopment: React.FC = () => {
  const [activeProcess, setActiveProcess] = useState<string | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);

  const handleIntegrationClick = (title: string) => {
    setActiveIntegration(prev => {
      // If clicking the currently open section, close it
      if (prev === title) {
        return null;
      }
      // Otherwise, open the new section
      return title;
    });
    // Always close process section when opening an integration
    if (activeProcess) {
      setActiveProcess(null);
    }
  };
  
  const handleProcessClick = (title: string) => {
    setActiveProcess(prev => {
      // If clicking the currently open section, close it
      if (prev === title) {
        return null;
      }
      // Otherwise, open the new section
      return title;
    });
    // Always close integration section when opening a process
    if (activeIntegration) {
      setActiveIntegration(null);
    }
  };

  const developmentProcess = [
    {
      title: 'Requirements Analysis',
      icon: FileText,
      description: 'Deep dive into your business needs and objectives',
      details: {
        importance: 'The foundation of successful AI implementation lies in thoroughly understanding your business processes, challenges, and objectives.',
        process: [
          'Stakeholder interviews and workshops',
          'Current process analysis and documentation',
          'Pain point identification',
          'Opportunity assessment',
          'ROI calculation and business case development'
        ],
        impact: 'A thorough requirements analysis ensures your AI solution addresses real business needs and delivers measurable value. This phase typically reduces project risks by 60% and increases success rates by 40%.'
      }
    },
    {
      title: 'Custom Development',
      icon: Code,
      description: 'Building your tailored AI solution',
      details: {
        importance: 'Custom development ensures your AI solution perfectly matches your unique business requirements and integrates seamlessly with your existing systems.',
        process: [
          'Architecture design and planning',
          'AI model selection and customization',
          'Integration framework development',
          'Security implementation',
          'Custom feature development'
        ],
        impact: 'Custom-developed AI solutions typically achieve 35% higher user adoption rates and deliver 45% more business value compared to off-the-shelf solutions.'
      }
    },
    {
      title: 'Training & Integration',
      icon: Bot,
      description: 'Teaching your AI and connecting systems',
      details: {
        importance: 'Proper training and integration are crucial for ensuring your AI agents perform effectively and work harmoniously with your existing infrastructure.',
        process: [
          'Data preparation and cleaning',
          'Model training and validation',
          'System integration testing',
          'Performance optimization',
          'Integration with existing workflows'
        ],
        impact: 'Well-trained and properly integrated AI agents show 80% higher accuracy rates and reduce manual intervention by up to 70%.'
      }
    },
    {
      title: 'Testing & Refinement',
      icon: Settings,
      description: 'Ensuring perfect performance',
      details: {
        importance: 'Rigorous testing and continuous refinement ensure your AI solution performs reliably and accurately in real-world conditions.',
        process: [
          'Comprehensive testing scenarios',
          'Performance benchmarking',
          'User acceptance testing',
          'Edge case handling',
          'Continuous improvement cycles'
        ],
        impact: 'Thorough testing and refinement typically reduce post-deployment issues by 75% and increase user satisfaction by 60%.'
      }
    },
    {
      title: 'Deployment & Support',
      icon: Zap,
      description: 'Going live and ensuring success',
      details: {
        importance: 'Successful deployment and ongoing support ensure your AI solution delivers long-term value and adapts to changing business needs.',
        process: [
          'Phased deployment strategy',
          'User training and documentation',
          'Performance monitoring',
          'Continuous optimization',
          '24/7 support and maintenance'
        ],
        impact: 'Proper deployment and support lead to 90% higher user adoption rates and 50% faster time to value.'
      }
    }
  ];

  const integrationCapabilities = [
    {
      title: 'Communication Systems',
      icon: MessageSquare,
      description: 'Seamless integration with your communication platforms',
      details: {
        features: [
          'Email system integration',
          'Chat platform connectivity',
          'VoIP system integration',
          'Unified messaging support',
          'Multi-channel communication'
        ],
        benefits: 'Reduce response times by 75% and improve customer satisfaction by 40%',
        techSpecs: 'Supports REST APIs, webhooks, and native integrations with major platforms'
      }
    },
    {
      title: 'Calendar Systems',
      icon: Calendar,
      description: 'Connect with your scheduling and calendar tools',
      details: {
        features: [
          'Multi-calendar synchronization',
          'Automated scheduling',
          'Availability management',
          'Time zone handling',
          'Meeting coordination'
        ],
        benefits: 'Reduce scheduling conflicts by 90% and save 5+ hours per week per employee',
        techSpecs: 'Compatible with Google Calendar, Outlook, and other major calendar systems'
      }
    },
    {
      title: 'CRM Integration',
      icon: Users,
      description: 'Seamless integration with your CRM system',
      details: {
        features: [
          'Bi-directional data sync',
          'Automated record updates',
          'Custom field mapping',
          'Activity logging',
          'Lead scoring automation'
        ],
        benefits: 'Improve data accuracy by 95% and reduce manual data entry by 80%',
        techSpecs: 'Supports Salesforce, HubSpot, and other major CRM platforms'
      }
    },
    {
      title: 'Phone Systems',
      icon: Phone,
      description: 'Connect with your existing phone infrastructure',
      details: {
        features: [
          'VoIP integration',
          'Call routing automation',
          'Voice transcription',
          'Call analytics',
          'Interactive voice response'
        ],
        benefits: 'Handle 70% more calls with 50% fewer resources',
        techSpecs: 'Compatible with major VoIP providers and PBX systems'
      }
    }
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Custom AI Development
            </h1>
            <p className="text-xl text-primary-200 mb-8">
              We are at a pivotal moment in business history. AI is not just another technology upgrade – it's a fundamental shift in how businesses operate and compete.
            </p>
            <p className="text-lg text-primary-300">
              Companies that embrace and adapt to AI now will have a significant competitive advantage in the years to come.
            </p>
          </div>
        </div>
      </div>

      {/* Development Process */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Development Process
          </h2>
          <div className="space-y-6">
            {developmentProcess.map((processStep, index) => (
              <Disclosure key={index}>
                {({ open }) => (
                  <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
                    <Disclosure.Button className="w-full p-6 flex items-center justify-between text-left">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary-900/30 p-3 rounded-full">
                          <processStep.icon className="text-primary-400" size={24} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{processStep.title}</h3>
                          <p className="text-gray-400">{processStep.description}</p>
                        </div>
                      </div>
                      <ChevronDown 
                        className={`text-gray-400 transition-transform duration-200 ${
                          open ? 'transform rotate-180' : ''
                        }`} 
                      />
                    </Disclosure.Button>
                    
                    <Disclosure.Panel className="px-6 pb-6 space-y-4 animate-fadeIn">
                    <div className="p-4 bg-dark-700/50 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Why It's Important</h4>
                      <p className="text-gray-300">{processStep.details.importance}</p>
                    </div>
                    
                    <div className="p-4 bg-dark-700/50 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Process Steps</h4>
                      <ul className="space-y-2">
                        {processStep.details.process.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                            <span className="text-gray-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-dark-700/50 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Business Impact</h4>
                      <p className="text-gray-300">{processStep.details.impact}</p>
                    </div>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Capabilities */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Integration Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrationCapabilities.map((integration, index) => (
            <Disclosure key={index}>
              {({ open }) => (
                <div className="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
                  <Disclosure.Button className="w-full p-6 flex items-center justify-between text-left">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary-900/30 p-3 rounded-full">
                        <integration.icon className="text-primary-400" size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{integration.title}</h3>
                        <p className="text-gray-400">{integration.description}</p>
                      </div>
                    </div>
                    <ChevronDown 
                      className={`text-gray-400 transition-transform duration-200 ${
                        open ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </Disclosure.Button>
                  
                  <Disclosure.Panel className="px-6 pb-6 space-y-4 animate-fadeIn">
                  <div className="p-4 bg-dark-700/50 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Key Features</h4>
                    <ul className="space-y-2">
                      {integration.details.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-dark-700/50 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Business Benefits</h4>
                    <p className="text-gray-300">{integration.details.benefits}</p>
                  </div>
                  
                  <div className="p-4 bg-dark-700/50 rounded-lg">
                    <h4 className="text-white font-medium mb-2">Technical Specifications</h4>
                    <p className="text-gray-300">{integration.details.techSpecs}</p>
                  </div>
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>

      {/* Future-Ready Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              The Future of Business is AI-Powered
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              By 2025, 85% of enterprises will be using AI in their operations. Don't get left behind – start your AI transformation journey today and position your business for success in the AI-driven future.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <Brain className="text-primary-400 h-8 w-8 mb-4 mx-auto" />
                <div className="text-4xl font-bold text-primary-400 mb-2">40%</div>
                <p className="text-gray-300">Increase in Productivity</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <Network className="text-primary-400 h-8 w-8 mb-4 mx-auto" />
                <div className="text-4xl font-bold text-primary-400 mb-2">24/7</div>
                <p className="text-gray-300">Automated Operations</p>
              </div>
              <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <Database className="text-primary-400 h-8 w-8 mb-4 mx-auto" />
                <div className="text-4xl font-bold text-primary-400 mb-2">60%</div>
                <p className="text-gray-300">Cost Reduction</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join the AI revolution and give your business a competitive edge. Let's discuss your requirements and create a custom AI solution that perfectly fits your needs.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
              Schedule Consultation
            </Link>
            <Link to="/demo" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
              Request Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDevelopment;