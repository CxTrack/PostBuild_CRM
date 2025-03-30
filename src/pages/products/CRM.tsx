import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, BarChart2, MessageSquare, Clock, Check, Bot, Brain, Zap } from 'lucide-react';

const CRM: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI-Powered CRM That Works For You
            </h1>
            <p className="text-xl text-primary-200">
              Transform your customer relationships with intelligent automation and deep insights.
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Bot className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Assistant</h3>
            <p className="text-gray-400">
              Let our AI handle routine tasks while you focus on building relationships. Automated follow-ups, meeting scheduling, and data entry.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Brain className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Insights</h3>
            <p className="text-gray-400">
              Get AI-powered insights into customer behavior, preferences, and potential opportunities for growth.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Zap className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Automation</h3>
            <p className="text-gray-400">
              Automate repetitive tasks, data entry, and follow-ups to save time and reduce errors.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Details */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">Everything You Need to Manage Customer Relationships</h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-primary-900/30 p-2 rounded-lg mr-4">
                    <Users className="text-primary-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">360° Customer View</h3>
                    <p className="text-gray-400">See all customer interactions, history, and preferences in one place.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-900/30 p-2 rounded-lg mr-4">
                    <MessageSquare className="text-primary-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Smart Communication</h3>
                    <p className="text-gray-400">AI-powered email templates and automated follow-ups that get responses.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-900/30 p-2 rounded-lg mr-4">
                    <BarChart2 className="text-primary-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
                    <p className="text-gray-400">Track performance, identify trends, and make data-driven decisions.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-primary-900/30 p-2 rounded-lg mr-4">
                    <Clock className="text-primary-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Activity Timeline</h3>
                    <p className="text-gray-400">Never miss a follow-up with our smart activity tracking system.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
                alt="CRM Dashboard" 
                className="rounded-lg shadow-xl"
              />
              <div className="absolute -bottom-4 -right-4 bg-primary-800 p-4 rounded-lg shadow-xl">
                <div className="flex items-center space-x-2">
                  <Bot className="text-primary-400" size={24} />
                  <div>
                    <p className="text-white font-semibold">AI Assistant Active</p>
                    <p className="text-sm text-primary-300">Helping 24/7</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Why Choose Our CRM?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Save Time',
              description: 'Automate 80% of routine tasks and focus on what matters most - building relationships.'
            },
            {
              title: 'Increase Sales',
              description: 'Convert 40% more leads with AI-powered insights and automated follow-ups.'
            },
            {
              title: 'Better Insights',
              description: 'Make data-driven decisions with advanced analytics and AI predictions.'
            }
          ].map((benefit, index) => (
            <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <Star className="text-primary-500 mb-4" size={24} />
              <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
              <p className="text-gray-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Customer Relationships?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our AI-powered CRM to grow their customer base.
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

export default CRM;