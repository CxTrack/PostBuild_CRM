import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ChevronRight } from 'lucide-react';

const Operations: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Triage, Inform, Resolve
            </h1>
            <p className="text-xl text-primary-200">
              Streamline your operations with AI-powered automation and workflow management.
            </p>
          </div>
        </div>
      </div>

      {/* Example Use Cases */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service Desk */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=800&q=80" 
              alt="Service Desk"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Triage your service desk
            </h3>
            <p className="text-gray-400 mb-4">
              Categorize your service desk requests and get them to the right place.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Keep Everyone Informed */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" 
              alt="Team Communication"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Keep everyone informed
            </h3>
            <p className="text-gray-400 mb-4">
              Autonomously communicate updates to stakeholders.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Resolve */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80" 
              alt="Issue Resolution"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Resolve
            </h3>
            <p className="text-gray-400 mb-4">
              Ensure requests are resolved and logged.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Workflow Automation',
                description: 'Automate repetitive tasks and streamline operations.'
              },
              {
                title: 'Smart Routing',
                description: 'Intelligently route requests to the right team or person.'
              },
              {
                title: 'Status Tracking',
                description: 'Real-time tracking of request status and progress.'
              },
              {
                title: 'Team Collaboration',
                description: 'Enhanced team communication and coordination.'
              },
              {
                title: 'Performance Metrics',
                description: 'Track and analyze operational performance.'
              },
              {
                title: 'Custom Workflows',
                description: 'Create and optimize workflows for your needs.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <Bot className="text-primary-500 mb-4" size={24} />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Streamline Your Operations?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our AI-powered operations platform.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
              Start Free Trial
            </Link>
            <Link to="/contact" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Operations;