import React from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Camera, Upload, FileText, Bot, BarChart2, RefreshCw, Receipt } from 'lucide-react';

const Expenses: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Smart Expense Management
            </h1>
            <p className="text-primary-200 text-lg mb-6">
              Effortlessly track and manage expenses with AI-powered receipt scanning, automated categorization, and real-time analytics.
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
            <div className="bg-dark-800 rounded-lg p-8 border-2 border-dashed border-dark-600 hover:border-primary-500 transition-colors">
              <div className="text-center">
                <DollarSign className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-4">Drag and Drop Receipts</h3>
                <p className="text-gray-300 mb-6">Drop your receipts here or use your device's camera</p>
                <div className="flex justify-center space-x-4">
                  <button className="btn btn-primary">
                    Take a Photo
                  </button>
                  <button className="btn btn-secondary">
                    Browse Files
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Smart Expense Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Powerful tools to streamline your expense management process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Camera className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Smart Receipt Capture</h3>
            <p className="text-gray-400">
              Instantly scan receipts using your device's camera with automatic data extraction and validation.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Upload className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop Processing</h3>
            <p className="text-gray-400">
              Simply drag and drop receipts, invoices, or any expense documents for instant processing.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Bot className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">AI Data Extraction</h3>
            <p className="text-gray-400">
              Advanced AI technology automatically extracts and categorizes expense data with high accuracy.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <RefreshCw className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Auto-Categorization</h3>
            <p className="text-gray-400">
              Smart categorization of expenses based on vendor, amount, and historical data.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Digital Storage</h3>
            <p className="text-gray-400">
              Secure cloud storage for all your receipts and expense documents with easy search and retrieval.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Expense Analytics</h3>
            <p className="text-gray-400">
              Detailed expense reports and analytics to help you understand and optimize spending.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-dark-800 rounded-2xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Expense management has never been easier with our AI-powered solution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Camera className="text-primary-400 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Capture</h3>
            <p className="text-gray-400">
              Take a photo of your receipt or drag and drop your documents.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Bot className="text-primary-400 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Process</h3>
            <p className="text-gray-400">
              AI automatically extracts and validates all relevant information.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="text-primary-400 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Categorize</h3>
            <p className="text-gray-400">
              Expenses are automatically categorized and organized.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BarChart2 className="text-primary-400 h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Analyze</h3>
            <p className="text-gray-400">
              Generate reports and gain insights into your spending.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Benefits of Smart Expense Management</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            See how our expense management solution can transform your business operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Save Time</h3>
            <p className="text-gray-400 mb-4">
              Eliminate manual data entry and automate your expense management process.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Reduce processing time by 90%</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automated data extraction</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Instant categorization</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Reduce Errors</h3>
            <p className="text-gray-400 mb-4">
              AI-powered validation ensures accuracy in expense tracking.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>AI data validation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Duplicate detection</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Automatic error checking</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Better Insights</h3>
            <p className="text-gray-400 mb-4">
              Gain valuable insights into your business spending patterns.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Detailed spending analytics</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Custom reporting</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Trend analysis</span>
              </li>
            </ul>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <h3 className="text-xl font-semibold text-white mb-4">Stay Compliant</h3>
            <p className="text-gray-400 mb-4">
              Keep your expense records organized and audit-ready.
            </p>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Digital receipt storage</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Audit trail</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Compliance reporting</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Simplify Your Expense Management?</h2>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of businesses that use our platform to automate their expense tracking and management.
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

export default Expenses;