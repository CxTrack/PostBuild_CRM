import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Brain, Phone, MessageSquare, BarChart2, Shield, Users, Clock, Check, FileText, DollarSign, Star } from 'lucide-react';

const EnterprisePlan: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Enterprise-Grade AI Solution
            </h1>
            <p className="text-xl text-primary-200">
              Transform your business with our comprehensive AI-powered platform designed for enterprise operations.
            </p>
          </div>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Advanced AI Capabilities
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Bot className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">AI Sales Team</h3>
            <p className="text-gray-400 mb-4">
              Deploy a full team of AI agents that work 24/7 to engage leads, qualify prospects, and drive conversions.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Automated lead qualification</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Intelligent follow-up sequences</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Meeting scheduling automation</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Phone className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Voice Collections</h3>
            <p className="text-gray-400 mb-4">
              AI-powered voice calling system for automated payment collection and follow-ups.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Natural conversation flow</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Sentiment analysis</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Payment plan negotiation</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Brain className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Smart Analytics</h3>
            <p className="text-gray-400 mb-4">
              Advanced analytics and predictions powered by machine learning.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Revenue forecasting</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Customer behavior analysis</span>
              </li>
              <li className="flex items-start">
                <Check className="text-primary-500 mt-1 mr-2" size={16} />
                <span>Payment prediction</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Specialized AI Agents */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Specialized AI Agents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">BDR Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Automated lead qualification and scoring</span>
                </li>
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Personalized outreach at scale</span>
                </li>
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Instant meeting scheduling</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">Marketing Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Automated content generation</span>
                </li>
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Campaign optimization</span>
                </li>
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Customer journey automation</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <h3 className="text-lg font-semibold text-white mb-4">Research Agent</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Market and competitor analysis</span>
                </li>
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Data gathering and synthesis</span>
                </li>
                <li className="flex items-start">
                  <Bot className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Trend identification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Enterprise-Grade Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <Shield className="text-primary-500 mb-4" size={24} />
            <h3 className="text-lg font-semibold text-white mb-2">Advanced Security</h3>
            <p className="text-gray-400">Enterprise-grade security with role-based access control, audit logs, and data encryption.</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <Users className="text-primary-500 mb-4" size={24} />
            <h3 className="text-lg font-semibold text-white mb-2">Unlimited Users</h3>
            <p className="text-gray-400">Support for unlimited team members with customizable roles and permissions.</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <BarChart2 className="text-primary-500 mb-4" size={24} />
            <h3 className="text-lg font-semibold text-white mb-2">Advanced Analytics</h3>
            <p className="text-gray-400">Comprehensive reporting and analytics with custom dashboards and KPIs.</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <FileText className="text-primary-500 mb-4" size={24} />
            <h3 className="text-lg font-semibold text-white mb-2">Custom Integrations</h3>
            <p className="text-gray-400">Custom API access and integration support for your existing systems.</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <Clock className="text-primary-500 mb-4" size={24} />
            <h3 className="text-lg font-semibold text-white mb-2">24/7 Support</h3>
            <p className="text-gray-400">Priority support with dedicated account manager and technical assistance.</p>
          </div>

          <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <DollarSign className="text-primary-500 mb-4" size={24} />
            <h3 className="text-lg font-semibold text-white mb-2">Custom Pricing</h3>
            <p className="text-gray-400">Flexible pricing options tailored to your business needs and usage.</p>
          </div>
        </div>
      </div>

      {/* ROI Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Enterprise ROI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
              <div className="text-4xl font-bold text-primary-400 mb-2">85%</div>
              <p className="text-gray-300">Reduction in response time</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
              <div className="text-4xl font-bold text-primary-400 mb-2">60%</div>
              <p className="text-gray-300">Increase in sales efficiency</p>
            </div>
            <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 text-center">
              <div className="text-4xl font-bold text-primary-400 mb-2">40%</div>
              <p className="text-gray-300">Cost reduction</p>
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
            Get started with our Enterprise solution and experience the power of AI-driven automation.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
              Schedule Demo
            </Link>
            <Link to="/register" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePlan;