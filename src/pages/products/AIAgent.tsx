import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Brain, Zap, ChevronRight, MessageSquare } from 'lucide-react';

const AIAgent: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Dedicated AI Agent
            </h1>
            <p className="text-xl text-primary-200">
              Empower your business with a focused AI agent that excels at specific tasks, delivering consistent results around the clock.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <Bot className="text-primary-500 mb-4 h-8 w-8" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Specialized Focus
            </h3>
            <p className="text-gray-400">
              Each AI agent is trained to excel at a specific task, ensuring high-quality, consistent results in their area of expertise.
            </p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <Brain className="text-primary-500 mb-4 h-8 w-8" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Continuous Learning
            </h3>
            <p className="text-gray-400">
              Your AI agent learns from each interaction, constantly improving its performance and adapting to your business needs.
            </p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <Zap className="text-primary-500 mb-4 h-8 w-8" />
            <h3 className="text-xl font-semibold text-white mb-3">
              24/7 Availability
            </h3>
            <p className="text-gray-400">
              Never miss an opportunity with an AI agent that's always on duty, handling tasks around the clock.
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Specialized AI Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Collections Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Automated payment follow-ups and reminders</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Intelligent payment plan negotiations</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Real-time payment processing</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Customer Service Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>24/7 customer inquiry handling</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Smart ticket routing and escalation</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Automated issue resolution</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Sales Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Lead qualification and scoring</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Automated follow-up sequences</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Meeting scheduling and coordination</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Research Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Market and competitor analysis</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Data gathering and synthesis</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Trend identification and reporting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Why Choose a Dedicated AI Agent?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Focused Expertise',
              description: 'Get better results with an AI agent that specializes in one specific task or domain.'
            },
            {
              title: 'Consistent Performance',
              description: 'Maintain high quality standards with an agent that never gets tired or distracted.'
            },
            {
              title: 'Scalable Operations',
              description: 'Handle increasing workloads without adding overhead or compromising quality.'
            },
            {
              title: 'Cost Effective',
              description: 'Reduce operational costs while maintaining or improving service quality.'
            },
            {
              title: 'Quick Implementation',
              description: 'Get started quickly with pre-trained agents ready for your specific needs.'
            },
            {
              title: 'Continuous Improvement',
              description: 'Benefit from an agent that learns and improves from every interaction.'
            }
          ].map((benefit, index) => (
            <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <Bot className="text-primary-500 mb-4" size={24} />
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
            Ready to Get Your Dedicated AI Agent?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Start with a specialized AI agent today and experience the power of focused automation.
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

export default AIAgent;