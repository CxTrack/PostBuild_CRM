import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Brain, Clock, CheckCircle, Users, MessageSquare, BarChart2, Settings, Mail } from 'lucide-react';

const AIGrowthPartner: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Your AI Sales Team, Built Right In
            </h1>
            <p className="text-primary-200 text-lg mb-6">
              Get a fully trained AI sales team that works 24/7, integrated directly with your CxTrack system for seamless operations and maximum efficiency.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100">
                Start Free Trial
              </Link>
              <Link to="/contact" className="btn btn-secondary border border-white text-white hover:bg-primary-700">
                Schedule Demo
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <img 
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80" 
              alt="AI Sales Team" 
              className="rounded-lg shadow-xl"
            />
          </div>
        </div>
      </section>

      {/* Why Choose AI Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Why Hire Our AI Sales Team?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional vs AI Comparison */}
          <div className="bg-dark-800/50 p-6 rounded-xl border border-dark-700">
            <h3 className="text-xl font-semibold text-white mb-4">Traditional Sales Employees</h3>
            <ul className="space-y-4">
              <li className="flex items-start text-gray-300">
                <span className="text-red-400 mr-2">✕</span>
                Manual hiring requires time, then it takes 3.2 months to hit KPIs
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-red-400 mr-2">✕</span>
                Requires training, management, HR & Benefits (payroll taxes, etc)
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-red-400 mr-2">✕</span>
                Clocks in/out, goes on vacation, works 8 hours a day
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-red-400 mr-2">✕</span>
                72% of their shifts are spent doing "busy" work and not income producing activities
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-red-400 mr-2">✕</span>
                Inconsistency in performance, burns out, lacks motivation, etc.
              </li>
            </ul>
          </div>

          <div className="bg-primary-900/20 p-6 rounded-xl border border-primary-800">
            <h3 className="text-xl font-semibold text-white mb-4">AI Sales Employees</h3>
            <ul className="space-y-4">
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span>
                1 time build out, and it can hit KPI's within the first 30 days
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span>
                Training is done instantly, it learns and memorizes immediately
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span>
                Works 24/7, never takes a day off
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span>
                99.9% of their shift is spent doing sales activities
              </li>
              <li className="flex items-start text-gray-300">
                <span className="text-green-400 mr-2">✓</span>
                Never burns out, always has a great attitude; consistent performance
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Our Promise Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Big Bold Promise</h2>
        <p className="text-xl text-primary-200 max-w-4xl mx-auto">
          We guarantee your AI Employees will generate 3x more appointments within 90 days—or we'll personally optimize it until it does.
        </p>
      </section>

      {/* How It Works Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Hire Your AI Employees in 3 Simple Steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80"
              alt="Step 1"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-white mb-2">Step 1: You Choose</h3>
            <p className="text-gray-400">
              Select the right AI Agent(s) for your business and sales needs—whether it's lead generation, nurturing, or customer retention.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80"
              alt="Step 2"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-white mb-2">Step 2: We Build</h3>
            <p className="text-gray-400">
              We'll train the AI to fit your specific needs, ensuring it understands your brand, services, and lead engagement strategy.
            </p>
          </div>

          <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=500&q=80"
              alt="Step 3"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-white mb-2">Step 3: You Scale</h3>
            <p className="text-gray-400">
              Your AI Agent goes to work, reaching out, booking appointments, reactivating leads, and driving consistent engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Who This Is Perfect For</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            'BUSINESS OWNERS',
            'INSURANCE AGENTS',
            'B2B CONSULTANTS',
            'SOLAR COMPANIES',
            'GYMS & COACHES',
            'BUSINESS LENDING',
            'REAL ESTATE AGENTS',
            'BUSINESS COACHES',
            'AND MORE...'
          ].map((item) => (
            <div key={item} className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex items-center space-x-2">
              <span className="text-primary-400">✓</span>
              <span className="text-white font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-dark-800 rounded-2xl p-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">How do the setup fees work?</h3>
            <p className="text-gray-300">Each use case is considered an employee and each employee is trained on a set of automations, scripts, etc. Each setup is $3k/per employee as a one-time fee. If you purchase the Go All In plan you would get 4 employees for $10k ($2k in savings).</p>
          </div>

          <div className="bg-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Is this a subscription?</h3>
            <p className="text-gray-300">Yes, our AI Sales Employees are offered on a subscription basis. This ensures ongoing support, updates, and seamless integration with your evolving sales processes. We also provide flexible plans to match your business needs.</p>
          </div>

          <div className="bg-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Is this considered robocalling?</h3>
            <p className="text-gray-300">No, our AI Sales Agents focus on meaningful, personalized interactions. Unlike traditional robocalls, our agents use natural language processing to engage leads in real conversations, ensuring a human-like experience that drives better results.</p>
          </div>

          <div className="bg-dark-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">What if the AI Sales Agent makes a mistake?</h3>
            <p className="text-gray-300">Our AI is continuously learning and improving. While mistakes are rare, we provide monitoring tools and human oversight to quickly address and correct any issues, ensuring your brand reputation remains intact.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to Scale Your Sales Team?</h2>
        <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
          Get started with your AI sales team today and see the difference in your bottom line.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/contact" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
            Schedule A Demo
          </Link>
          <Link to="/register" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AIGrowthPartner;