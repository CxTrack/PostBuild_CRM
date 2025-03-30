import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ChevronRight } from 'lucide-react';

const CustomerSupport: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Triage, Respond, Escalate
            </h1>
            <p className="text-xl text-primary-200">
              Deliver exceptional customer support with AI-powered automation and insights.
            </p>
          </div>
        </div>
      </div>

      {/* Example Use Cases */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Triage */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=800&q=80" 
              alt="Triage"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Triage your customer enquiries
            </h3>
            <p className="text-gray-400 mb-4">
              Your AI teammate can classify your enquiries so they always end up at the right place.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Respond */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80" 
              alt="Respond"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Respond
            </h3>
            <p className="text-gray-400 mb-4">
              Equipped with FAQs your AI teammate can answer commonly asked questions.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Escalate */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80" 
              alt="Escalate"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Escalate
            </h3>
            <p className="text-gray-400 mb-4">
              For complex enquiries your AI teammate can summarize the enquiry, enrich the customers details, and escalate to a team member.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Ticket Routing',
                description: 'Automatically categorize and route support tickets to the right team.'
              },
              {
                title: 'Automated Responses',
                description: 'Generate accurate responses to common customer inquiries.'
              },
              {
                title: 'Knowledge Base Integration',
                description: 'Seamlessly connect with your existing knowledge base.'
              },
              {
                title: 'Sentiment Analysis',
                description: 'Detect customer sentiment and prioritize urgent issues.'
              },
              {
                title: 'Multi-channel Support',
                description: 'Handle inquiries across email, chat, and social media.'
              },
              {
                title: 'Performance Analytics',
                description: 'Track support metrics and team performance in real-time.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <Bot className="text-primary-500 mb-4" size={24} />
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Transform Your Customer Support?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our AI-powered customer support automation.
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

export default CustomerSupport;