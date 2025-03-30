import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Network, Zap, ChevronRight, Users, Brain } from 'lucide-react';

const AIWorkforce: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              The Future of Work: AI Workforce
            </h1>
            <p className="text-xl text-primary-200">
              Experience the power of a coordinated team of AI agents working together to drive your business forward.
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <Network className="text-primary-500 mb-4 h-8 w-8" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Seamless Collaboration
            </h3>
            <p className="text-gray-400">
              AI agents work together in perfect harmony, sharing information and coordinating tasks automatically.
            </p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <Brain className="text-primary-500 mb-4 h-8 w-8" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Collective Intelligence
            </h3>
            <p className="text-gray-400">
              Each agent contributes its specialized knowledge to create a powerful collective intelligence.
            </p>
          </div>

          <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
            <Zap className="text-primary-500 mb-4 h-8 w-8" />
            <h3 className="text-xl font-semibold text-white mb-3">
              Automated Workflows
            </h3>
            <p className="text-gray-400">
              Tasks flow seamlessly between agents, creating efficient, automated processes.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How AI Workforce Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Task Distribution</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>AI agents automatically distribute tasks based on specialization</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Smart workload balancing ensures optimal performance</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Real-time task prioritization and adjustment</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Information Sharing</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Seamless data exchange between AI agents</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Contextual awareness across the entire workforce</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Continuous knowledge base updates</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Process Optimization</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>AI-driven workflow improvements</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Automated bottleneck detection</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Continuous process refinement</span>
                </li>
              </ul>
            </div>

            <div className="bg-dark-800 rounded-xl p-8 border border-dark-700">
              <h3 className="text-xl font-semibold text-white mb-4">Human Collaboration</h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Seamless integration with human teams</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Smart escalation to human operators</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="text-primary-500 mt-1 mr-2" size={16} />
                  <span>Collaborative decision-making</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Benefits of an AI Workforce
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'Enhanced Efficiency',
              description: 'Multiple AI agents working together complete tasks faster than traditional methods.'
            },
            {
              title: 'Reduced Costs',
              description: 'Scale operations without the overhead of traditional workforce expansion.'
            },
            {
              title: '24/7 Operations',
              description: 'Your AI workforce never sleeps, ensuring continuous business operations.'
            },
            {
              title: 'Error Reduction',
              description: "Coordinated AI agents double-check each other's work for accuracy."
            },
            {
              title: 'Scalable Solution',
              description: 'Easily add or modify AI agents as your business needs change.'
            },
            {
              title: 'Future-Proof',
              description: 'Stay ahead with a workforce that continuously learns and evolves.'
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

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Build Your AI Workforce?
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Join the future of work with our coordinated AI workforce solution.
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

export default AIWorkforce;