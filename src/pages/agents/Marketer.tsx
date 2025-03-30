import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Users, RefreshCw, TrendingUp, MessageSquare } from 'lucide-react';

export const Marketer: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Put <span className="text-primary-300">every</span> customer first
            </h1>
            <p className="text-xl text-primary-200">
              Make every customer feel like your top priority.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Reduce Churn</p>
          </div>
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Increase Retention</p>
          </div>
          <div className="text-center">
            <Users className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Increase Usage</p>
          </div>
          <div className="text-center">
            <MessageSquare className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Escalate to anyone</p>
          </div>
          <div className="text-center">
            <Bot className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Reply to everyone</p>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <h3 className="text-xl font-semibold text-red-400 mb-6">Without an AI Agent</h3>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Sending email blasts
              </li>
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Can't reply to questions from customers
              </li>
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                100's of complicated flow diagrams
              </li>
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Limited understanding of customers
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <h3 className="text-xl font-semibold text-primary-400 mb-6">With an AI Lifecycle Marketing Agent</h3>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                Tailors every message to each individual customer
              </li>
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                Train to answer any queries or escalate to colleagues
              </li>
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                One AI Agent seamlessly interacting with your customers
              </li>
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                Retrieve data from anywhere to understand your customer
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Customer Marketing?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Get started with your AI Lifecycle Marketing Agent today.
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