import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Database, Filter, DollarSign, Brain } from 'lucide-react';

export default function CRMEnrichment() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Keep your CRM up to date
            </h1>
            <p className="text-xl text-primary-200">
              Never rely on outdated or expensive enrichment again.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-16">
          <div className="text-center">
            <Database className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Real-Time Updates</p>
          </div>
          <div className="text-center">
            <Bot className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Any data sources</p>
          </div>
          <div className="text-center">
            <Filter className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Intelligent classification</p>
          </div>
          <div className="text-center">
            <DollarSign className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Cost-efficient</p>
          </div>
          <div className="text-center">
            <Brain className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="text-white">Accurate prospect insights</p>
          </div>
        </div>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <h3 className="text-xl font-semibold text-red-400 mb-6">Without an AI Agent</h3>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Outdated, manually updated CRM records
              </li>
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Expensive enrichment providers
              </li>
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Gaps in prospect data and company details
              </li>
              <li className="flex items-center text-gray-400">
                <span className="h-2 w-2 bg-red-500 rounded-full mr-3"></span>
                Reliance on manual classification
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <h3 className="text-xl font-semibold text-primary-400 mb-6">With an AI CRM Enrichment Agent</h3>
            <ul className="space-y-4">
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                Automated, real-time enrichment from multiple sources
              </li>
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                90% cheaper and more accurate data
              </li>
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                Complete prospect profiles for better targeting
              </li>
              <li className="flex items-center text-gray-400">
                <Bot className="text-primary-500 h-5 w-5 mr-3" />
                Automated job function & industry categorization
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Automate Your CRM Enrichment?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Get started with your AI CRM Enrichment Agent today.
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