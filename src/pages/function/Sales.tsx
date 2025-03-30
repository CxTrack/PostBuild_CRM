import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Bot, ChevronRight } from 'lucide-react';

const Sales: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Research, Prospect, Close
            </h1>
            <p className="text-xl text-primary-200">
              Supercharge your sales process with AI-powered automation and insights.
            </p>
          </div>
        </div>
      </div>

      {/* Example Use Cases */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quickly understand prospects */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=800&q=80" 
              alt="Prospect Research"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Quickly understand your prospects
            </h3>
            <p className="text-gray-400 mb-4">
              Your AI teammate can easily find, summarize, and store information about your prospects.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Personalized prospecting */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80" 
              alt="Personalized Prospecting"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Personalized prospecting
            </h3>
            <p className="text-gray-400 mb-4">
              Develop personalized emails and scripts following your playbook.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Close the deal */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80" 
              alt="Close Deals"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Close the deal
            </h3>
            <p className="text-gray-400 mb-4">
              Your AI teammate can book meetings, always making sure your CRM is up to date.
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
                title: 'AI-Powered Research',
                description: 'Automatically gather and analyze prospect information from multiple sources.'
              },
              {
                title: 'Smart Outreach',
                description: 'Generate personalized outreach messages based on prospect data and engagement history.'
              },
              {
                title: 'Meeting Scheduling',
                description: 'Automate meeting scheduling with smart availability detection and reminders.'
              },
              {
                title: 'Deal Intelligence',
                description: 'Get AI-powered insights and recommendations to close deals faster.'
              },
              {
                title: 'CRM Integration',
                description: 'Seamlessly sync all activities and data with your existing CRM system.'
              },
              {
                title: 'Performance Analytics',
                description: 'Track and analyze sales performance with detailed metrics and insights.'
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
            Ready to Transform Your Sales Process?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our AI-powered sales automation to close more deals.
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

export default Sales;