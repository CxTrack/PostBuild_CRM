import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Send, Check, Clock, ArrowRight, BarChart2, RefreshCw, DollarSign } from 'lucide-react';

const Quotes: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Win More Business with Professional Quotes
            </h1>
            <p className="text-primary-200 text-lg mb-6">
              Create and send professional quotes in minutes, track their status, and convert them to invoices with a single click.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100">
                Start Free
              </Link>
              <Link to="/demo" className="btn btn-secondary border border-white text-white hover:bg-primary-700">
                Schedule Demo
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public/images/quote-preview.jpg`}
              alt="Quote Management" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Powerful Quote Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to create professional quotes and win more business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Professional Templates</h3>
            <p className="text-gray-400">
              Choose from a variety of professionally designed quote templates that reflect your brand identity.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Send className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Quick Send</h3>
            <p className="text-gray-400">
              Send quotes directly to customers via email with optional attachments and personalized messages.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Clock className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Expiry Management</h3>
            <p className="text-gray-400">
              Set and manage quote expiry dates with automatic reminders and follow-ups.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Check className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Approval Workflow</h3>
            <p className="text-gray-400">
              Streamline the quote approval process with customizable workflows and notifications.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <RefreshCw className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Convert to Invoice</h3>
            <p className="text-gray-400">
              Convert accepted quotes to invoices with a single click, maintaining all line items and details.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Quote Analytics</h3>
            <p className="text-gray-400">
              Track quote performance, conversion rates, and customer response times with detailed analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Quote Preview */}
      <section className="bg-dark-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Beautiful, Professional Quotes</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our quotes are designed to impress your clients and help you win more business.
          </p>
        </div>
        
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <img 
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public/images/quote-preview.jpg`}
            alt="Quote Template" 
            className="w-full"
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Why Use Our Quote Management</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            See how our quote management solution can transform your sales process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Win More Business</h3>
            <p className="text-gray-400 mb-4">
              Create professional quotes quickly and follow up automatically to increase your win rate.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Professional quote templates</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automated follow-ups</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Higher conversion rates</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Save Time</h3>
            <p className="text-gray-400 mb-4">
              Automate your quote process from creation to follow-up and conversion.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Quick quote generation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automated reminders</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>One-click invoice conversion</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Track Everything</h3>
            <p className="text-gray-400 mb-4">
              Get insights into your quote performance and customer behavior.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Quote analytics dashboard</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Conversion tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Customer response metrics</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Look Professional</h3>
            <p className="text-gray-400 mb-4">
              Present your business professionally with beautiful quotes and smooth client interaction.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Branded templates</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Professional communication</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Client portal access</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Streamline Your Quote Process?</h2>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of businesses that use our platform to create professional quotes and win more business.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
            Start Your Free Account
          </Link>
          <Link to="/demo" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
            Schedule Demo
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Quotes;