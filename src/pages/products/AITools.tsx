import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, PenTool as Tool, Wrench, Settings, ChevronRight } from 'lucide-react';

const AITools: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Tools for Every Task
            </h1>
            <p className="text-xl text-primary-200">
              A comprehensive suite of AI-powered tools to automate and enhance your business processes.
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Tool Cards */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center mb-4">
              <Tool className="text-primary-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-white">YouTube Video File</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Extract direct video file URLs from YouTube links for easy downloading and processing.
            </p>
            <Link to="/tools/youtube-video" className="text-primary-400 hover:text-primary-300 flex items-center">
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center mb-4">
              <Tool className="text-primary-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-white">Form Recognizer</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Extract text and data from documents using advanced OCR technology.
            </p>
            <Link to="/tools/form-recognizer" className="text-primary-400 hover:text-primary-300 flex items-center">
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center mb-4">
              <Tool className="text-primary-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-white">SQL Query</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Run SQL queries directly on your database with an intuitive interface.
            </p>
            <Link to="/tools/sql-query" className="text-primary-400 hover:text-primary-300 flex items-center">
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center mb-4">
              <Tool className="text-primary-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-white">Escalate to Managers</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Quickly notify managers about important updates via Slack integration.
            </p>
            <Link to="/tools/escalate" className="text-primary-400 hover:text-primary-300 flex items-center">
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center mb-4">
              <Tool className="text-primary-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-white">Cloud Vision OCR</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Extract text from images and PDFs using Google Cloud Vision technology.
            </p>
            <Link to="/tools/cloud-vision" className="text-primary-400 hover:text-primary-300 flex items-center">
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>

          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center mb-4">
              <Tool className="text-primary-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-white">Airtable Toolkit</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Manage and manipulate your Airtable databases with powerful automation tools.
            </p>
            <Link to="/tools/airtable" className="text-primary-400 hover:text-primary-300 flex items-center">
              Learn more <ChevronRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why Choose Our AI Tools?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Easy Integration',
                description: 'Seamlessly integrate with your existing workflow and tools.'
              },
              {
                title: 'Customizable',
                description: 'Adapt and configure tools to match your specific needs.'
              },
              {
                title: 'Secure & Reliable',
                description: 'Enterprise-grade security with 99.9% uptime guarantee.'
              },
              {
                title: 'Regular Updates',
                description: 'Continuous improvements and new features added regularly.'
              },
              {
                title: 'Expert Support',
                description: '24/7 technical support and comprehensive documentation.'
              },
              {
                title: 'Cost-Effective',
                description: 'Pay only for what you use with flexible pricing plans.'
              }
            ].map((benefit, index) => (
              <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <Bot className="text-primary-500 mb-4" size={24} />
                <h3 className="text-lg font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Supercharge Your Workflow?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Get started with our AI tools today and transform your business processes.
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

export default AITools;