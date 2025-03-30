import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ChevronRight, Search, FileText, BarChart2 } from 'lucide-react';

const Research: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Research, Analyze, Discover
            </h1>
            <p className="text-xl text-primary-200">
              Unlock powerful insights with AI-powered research and analysis.
            </p>
          </div>
        </div>
      </div>

      {/* Example Use Cases */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Market Research */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" 
              alt="Market Research"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Market Research
            </h3>
            <p className="text-gray-400 mb-4">
              Your AI teammate can analyze market trends, competitor data, and industry reports.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Data Analysis */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" 
              alt="Data Analysis"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Data Analysis
            </h3>
            <p className="text-gray-400 mb-4">
              Process and analyze large datasets to uncover valuable insights and patterns.
            </p>
            <Link 
              to="/features/ai-growth-partner" 
              className="inline-flex items-center text-primary-400 hover:text-primary-300"
            >
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          {/* Insights Generation */}
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <img 
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80" 
              alt="Insights Generation"
              className="w-full h-48 object-cover rounded-lg mb-6"
            />
            <h3 className="text-xl font-semibold text-white mb-3">
              Insights Generation
            </h3>
            <p className="text-gray-400 mb-4">
              Generate actionable insights and recommendations from your research findings.
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
                title: 'Smart Data Collection',
                description: 'Automatically gather data from multiple sources and formats.'
              },
              {
                title: 'Advanced Analytics',
                description: 'Process and analyze data using cutting-edge AI algorithms.'
              },
              {
                title: 'Trend Detection',
                description: 'Identify emerging trends and patterns in your market.'
              },
              {
                title: 'Competitor Analysis',
                description: 'Track and analyze competitor activities and strategies.'
              },
              {
                title: 'Custom Reports',
                description: 'Generate detailed reports tailored to your needs.'
              },
              {
                title: 'Real-time Monitoring',
                description: 'Stay updated with real-time market and industry changes.'
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
            Ready to Unlock Powerful Insights?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of businesses using our AI-powered research platform.
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

export default Research;