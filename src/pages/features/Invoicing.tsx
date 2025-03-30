import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, DollarSign, CreditCard, BarChart2, Clock, Zap } from 'lucide-react';

const Invoicing: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Professional Invoicing Made Simple
            </h1>
            <p className="text-primary-200 text-lg mb-6">
              Create, send, and track professional invoices in minutes. Get paid faster and improve your cash flow.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100">
                Start Free
              </Link>
              <Link to="/login" className="btn btn-secondary border border-white text-white hover:bg-primary-700">
                View Demo
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
              alt="Invoice Dashboard" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Powerful Invoicing Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to create professional invoices and get paid faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <FileText className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Professional Templates</h3>
            <p className="text-gray-400">
              Choose from a variety of professionally designed invoice templates that reflect your brand identity.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <DollarSign className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Multiple Payment Options</h3>
            <p className="text-gray-400">
              Accept payments via credit card, bank transfer, PayPal, and more to make it easy for customers to pay.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CreditCard className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Automated Billing</h3>
            <p className="text-gray-400">
              Set up recurring invoices for subscription-based services and automate your billing process.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Financial Reporting</h3>
            <p className="text-gray-400">
              Generate detailed reports on sales, outstanding invoices, and payment history to track your business performance.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Clock className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Payment Reminders</h3>
            <p className="text-gray-400">
              Send automatic reminders for overdue invoices to improve your cash flow and reduce late payments.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Zap className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Quick Invoice Creation</h3>
            <p className="text-gray-400">
              Create and send professional invoices in minutes with our intuitive interface and time-saving features.
            </p>
          </div>
        </div>
      </section>

      {/* Invoice Preview */}
      <section className="bg-dark-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Beautiful, Professional Invoices</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our invoices are designed to look professional and make a great impression on your clients.
          </p>
        </div>
        
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80" 
            alt="Invoice Template" 
            className="w-full"
          />
        </div>
      </section>

      {/* How It Works */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our invoicing system is designed to be simple and efficient, saving you time and helping you get paid faster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-400">1</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Create Invoice</h3>
            <p className="text-gray-400">
              Select a template and add your customer details, items, and payment terms.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-400">2</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Send Invoice</h3>
            <p className="text-gray-400">
              Email the invoice directly to your customer with a personalized message.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-400">3</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Get Paid</h3>
            <p className="text-gray-400">
              Customers can pay online through various payment methods with just a few clicks.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl text-center">
            <div className="bg-primary-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-400">4</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Track Payments</h3>
            <p className="text-gray-400">
              Monitor payment status and send automatic reminders for overdue invoices.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Streamline Your Invoicing Process?</h2>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of businesses that use our platform to create professional invoices and get paid faster.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
            Start Your Free Account
          </Link>
          <Link to="/login" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
            Learn More
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Invoicing;