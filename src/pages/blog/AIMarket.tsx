import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ShoppingBag, ChevronRight, Star, Shield, Users } from 'lucide-react';
import { articleService } from '../../services/articleService';
import { toast } from 'react-hot-toast'

const AIMarket: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const latestArticles = await articleService.getLatestArticles(3);
        setArticles(latestArticles);
      } catch (error) {
        console.error('Error loading articles:', error);
        toast.error('Failed to load latest articles');
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Market Insights
            </h1>
            <p className="text-xl text-primary-200">
              Stay ahead with the latest trends, insights, and innovations in AI technology.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Articles */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading latest articles...</p>
            </div>
          ) : articles.length > 0 ? (
            articles.map(article => (
              <div key={article.id} className="bg-dark-800 rounded-xl p-8 border border-dark-700">
                <img 
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-48 object-cover rounded-lg mb-6"
                />
                <h3 className="text-xl font-semibold text-white mb-3">
                  {article.title}
                </h3>
                <p className="text-gray-400 mb-4">
                  {article.summary}
                </p>
                <Link 
                  to={`/blog/article/${article.id}`}
                  className="inline-flex items-center text-primary-400 hover:text-primary-300"
                >
                  Read more <ChevronRight size={16} className="ml-1" />
                </Link>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-400">No articles available</p>
            </div>
          )}
        </div>
      </div>

      {/* Market Stats */}
      <div className="bg-dark-900 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            AI Market Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="text-4xl font-bold text-primary-400 mb-2">$500B+</div>
              <p className="text-gray-400">Global AI market size by 2025</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="text-4xl font-bold text-primary-400 mb-2">85%</div>
              <p className="text-gray-400">Companies adopting AI by 2025</p>
            </div>
            <div className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <div className="text-4xl font-bold text-primary-400 mb-2">40%</div>
              <p className="text-gray-400">Productivity increase with AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Latest Insights */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Latest Market Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: 'AI Security Trends',
              description: 'Latest developments in AI security and compliance.',
              icon: Shield
            },
            {
              title: 'Workforce Impact',
              description: 'How AI is transforming the modern workforce.',
              icon: Users
            },
            {
              title: 'Investment Opportunities',
              description: 'Key areas for AI investment in 2025.',
              icon: Star
            }
          ].map((insight, index) => (
            <div key={index} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
              <insight.icon className="text-primary-500 mb-4" size={24} />
              <h3 className="text-lg font-semibold text-white mb-2">{insight.title}</h3>
              <p className="text-gray-400">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Stay Ahead of the AI Curve
          </h2>
          <p className="text-primary-200 text-lg mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter for weekly AI market insights and analysis.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-6 py-3">
              Subscribe Now
            </Link>
            <Link to="/blog" className="btn btn-secondary border border-white text-white hover:bg-primary-700 px-6 py-3">
              View All Articles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIMarket;