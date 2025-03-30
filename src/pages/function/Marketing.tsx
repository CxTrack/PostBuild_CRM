import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ChevronRight } from 'lucide-react';

const Marketing: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Research, Create Content, Nurture Leads
            </h1>
            <p className="text-xl text-primary-200">
              Supercharge your marketing efforts with AI-powered content creation and lead nurturing.
            </p>
          </div>
        </div>
      </div>

      {/* Example Use Cases */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Understand customers */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" 
              alt="Customer Research"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Quickly understand your customers and prospects
            </h3>
            <p className="text-gray-400 mb-4">
              Your AI teammate can easily summarize insights and share with your team. From industry reports to user interviews.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Content Creation */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80" 
              alt="Content Creation"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Content Creation
            </h3>
            <p className="text-gray-400 mb-4">
              Develop unique content based on your own data, style, research, and guidelines.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Nurture leads */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80" 
              alt="Lead Nurturing"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Nurture leads
            </h3>
            <p className="text-gray-400 mb-4">
              Your AI teammate can develop personalized nurture sequences. Never let a lead go cold again.
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
                title: 'Market Research',
                description: 'AI-powered research and analysis of market trends and competitor data.'
              },
              {
                title: 'Content Generation',
                description: 'Create engaging content that resonates with your target audience.'
              },
              {
                title: 'Social Media Management',
                description: 'Schedule and optimize posts across multiple platforms.'
              },
              {
                title: 'Email Marketing',
                description: 'Design and execute personalized email campaigns.'
              },
              {
                title: 'Analytics & Reporting',
                description: 'Track campaign performance and generate detailed reports.'
              },
              {
                title: 'Lead Scoring',
                description: 'Automatically score and prioritize leads based on engagement.'
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
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our AI-powered marketing automation to drive growth.
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

export default Marketing;