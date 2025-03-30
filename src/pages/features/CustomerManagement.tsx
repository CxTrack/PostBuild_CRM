import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Star, BarChart2, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const CustomerManagement: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Customer Management That Drives Growth
            </h1>
            <p className="text-primary-200 text-lg mb-6">
              Build stronger relationships, understand your customers better, and increase retention with our comprehensive CRM solution.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100">
                Start Free
              </Link>
              <Link to="/login" className="btn btn-secondary border border-white text-white hover:bg-primary-700">
                Learn More
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80" 
              alt="Customer Management Dashboard" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Powerful Customer Management Features</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Everything you need to manage customer relationships effectively and drive business growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Users className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">360° Customer View</h3>
            <p className="text-gray-400">
              Get a complete view of your customers including contact information, purchase history, communication logs, and more.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <MessageSquare className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Communication Tracking</h3>
            <p className="text-gray-400">
              Log all customer interactions in one place to ensure consistent communication and follow-ups.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <BarChart2 className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Customer Analytics</h3>
            <p className="text-gray-400">
              Gain insights into customer behavior, preferences, and spending patterns to optimize your sales strategy.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Star className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Customer Segmentation</h3>
            <p className="text-gray-400">
              Group customers based on demographics, purchase behavior, or custom criteria for targeted marketing.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Clock className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Activity Timeline</h3>
            <p className="text-gray-400">
              Track the complete history of customer interactions, purchases, and support requests in chronological order.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl">
            <div className="bg-primary-900/30 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <CheckCircle className="text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Task Management</h3>
            <p className="text-gray-400">
              Create and assign follow-up tasks to ensure no customer interaction falls through the cracks.
            </p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="bg-dark-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Intuitive Customer Dashboard</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our user-friendly interface puts all customer information at your fingertips.
          </p>
        </div>
        
        <div className="rounded-xl overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80" 
            alt="Customer Dashboard" 
            className="w-full"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Transform Your Customer Relationships?</h2>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Join thousands of businesses that use our platform to grow their customer base and increase retention.
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

export default CustomerManagement;