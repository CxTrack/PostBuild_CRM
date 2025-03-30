import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, FileText, Users, Package, Brain, Phone, MessageSquare, 
  BarChart2, Globe, Shield, Check, RefreshCw, Clock, Settings, 
  DollarSign, LogIn, UserPlus, ArrowRight, Calendar
} from 'lucide-react';
import PricingSection from '../components/PricingSection';
import ChatBot from '../components/ChatBot';

interface FeatureCardProps {
  icon: React.ComponentType<{ size: number; className: string }>;
  title: string;
  description: string;
  link: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description, link }) => (
  <Link 
    to={link} 
    className="feature-card bg-primary-800/30 p-4 rounded-lg hover:bg-primary-700/30 transition-all transform hover:scale-105 duration-300"
  >
    <div className="flex items-center space-x-3 mb-2">
      <div className="p-2 rounded-lg bg-primary-500/20">
        <Icon className="text-primary-300" size={20} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
    </div>
    <p className="text-primary-200 text-sm">{description}</p>
  </Link>
);

const AuthLayout: React.FC = () => {
  const [showChat, setShowChat] = useState(false);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '50px'
      }
    );

    document.querySelectorAll('.feature-section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  // Feature sections data
  const features = [
    {
      id: 'expenses',
      title: "Smart Expense Management",
      description: "Effortlessly track and manage expenses with AI-powered receipt scanning.",
      icon: DollarSign,
      color: "emerald",
      benefits: [
        "Instant receipt scanning & data extraction",
        "Drag & drop document processing",
        "Mobile camera integration",
        "Automatic expense categorization",
        "Real-time data validation",
        "Smart expense analytics"
      ],
      image: null,
      link: "/features/expenses"
    },
    {
      id: 'invoicing',
      title: "Smart Invoicing",
      description: "Create and manage professional invoices with automated payment tracking and reminders.",
      icon: FileText,
      color: "blue",
      benefits: [
        "Professional invoice templates",
        "Automated payment reminders",
        "Online payment processing",
        "Recurring billing automation",
        "Real-time payment tracking",
        "Multi-currency support"
      ],
      image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      link: "/features/invoicing"
    },
    {
      id: 'crm',
      title: "CRM System",
      description: "Build stronger customer relationships with our comprehensive CRM solution.",
      icon: Users,
      color: "purple",
      benefits: [
        "360° customer view",
        "Interaction tracking",
        "Sales pipeline management",
        "Customer segmentation",
        "Communication history",
        "Custom fields & tags"
      ],
      image: "https://images.unsplash.com/photo-1552581234-26160f608093?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      link: "/features/customer-management"
    },
    {
      id: 'calendar',
      title: "Calendar Integration",
      description: "Stay on top of important dates with our smart calendar system.",
      icon: Calendar,
      color: "green",
      benefits: [
        "Invoice due date tracking",
        "Payment schedules",
        "Task management",
        "Holiday awareness",
        "Event reminders",
        "Multi-timezone support"
      ],
      image: "https://images.unsplash.com/photo-1506784693919-ef06d93c28d2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80",
      link: "/features/calendar"
    },
    {
      id: 'quotes',
      title: "Professional Quote Management",
      description: "Create, send, and track professional quotes to win more business.",
      icon: FileText,
      color: "amber",
      benefits: [
        "Beautiful quote templates",
        "Quick quote generation",
        "Automated follow-ups",
        "Quote approval workflow",
        "Convert quotes to invoices",
        "Quote analytics & tracking"
      ],
      image: `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/public/images/quote-preview.jpg`,
      link: "/features/quotes"
    },
    {
      id: 'ai',
      title: "AI-Powered Automation",
      description: "Let our intelligent AI agents handle your routine tasks and communications.",
      icon: Brain,
      color: "indigo",
      benefits: [
        "Automated collections",
        "Smart payment reminders",
        "Customer service AI",
        "Voice call automation",
        "Sentiment analysis",
        "Predictive analytics"
      ],
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
      link: "/features/ai-growth-partner"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Auth Widget */}
      <div className="fixed-header">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-end items-center space-x-4 pr-4">
            <Link 
              to="/login" 
              className="btn btn-secondary flex items-center space-x-2 bg-dark-800/80 hover:bg-dark-700/80"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </Link>
            <Link 
              to="/register" 
              className="btn btn-primary flex items-center space-x-2 bg-primary-600/80 hover:bg-primary-700/80"
            >
              <UserPlus size={16} />
              <span>Sign Up</span>
            </Link>
            {/* Canadian Maple Leaf */}
            <svg 
              viewBox="0 0 375 375" 
              className="h-12 w-12 text-white opacity-80 flag-wave"
              fill="currentColor"
            >
              <path d="M 187.472656 112.507812 L 175.378906 135.132812 C 174.003906 137.59375 171.546875 137.363281 169.089844 135.992188 L 160.332031 131.441406 L 166.859375 166.191406 C 168.230469 172.542969 163.828125 172.542969 161.652344 169.796875 L 146.371094 152.644531 L 143.890625 161.355469 C 143.605469 162.5 142.347656 163.699219 140.457031 163.414062 L 121.136719 159.339844 L 126.210938 177.847656 C 127.296875 181.964844 128.144531 183.667969 125.113281 184.753906 L 118.226562 188.003906 L 151.492188 215.097656 C 152.808594 216.125 153.476562 217.96875 153.007812 219.636719 L 150.09375 229.21875 L 183.269531 225.386719 C 184.289062 225.375 184.953125 225.941406 184.945312 227.113281 L 182.902344 262.523438 L 192.050781 262.523438 L 190.007812 227.113281 C 190 225.941406 190.667969 225.375 191.6875 225.386719 L 224.863281 229.21875 L 221.949219 219.636719 C 221.480469 217.96875 222.144531 216.125 223.464844 215.097656 L 256.730469 188.003906 L 249.839844 184.753906 C 246.8125 183.667969 247.65625 181.964844 248.746094 177.847656 L 253.820312 159.339844 L 234.496094 163.414062 C 232.609375 163.699219 231.351562 162.5 231.066406 161.355469 L 228.582031 152.644531 L 213.300781 169.800781 C 211.128906 172.542969 206.722656 172.542969 208.097656 166.195312 L 214.625 131.445312 L 205.867188 135.992188 C 203.40625 137.367188 200.949219 137.59375 199.574219 135.136719 L 187.484375 112.515625 Z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-primary-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="container mx-auto px-6 pt-20 pb-24">
          {/* Logo Section */}
          <div className="flex items-center justify-center md:justify-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full animate-pulse"></div>
                <img 
                  src="/logo.svg" 
                  alt="CxTrack Logo" 
                  className="relative w-full h-full logo-glow"
                />
              </div>
              <h1 className="brand-logo text-5xl font-bold text-white brand-text">
                CxTrack
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Transform Your Business with AI-Powered Automation
              </h1>
              <p className="text-xl text-primary-200 mb-8">
                Streamline operations, boost sales, and deliver exceptional customer service with our integrated CRM platform and intelligent AI agents.
              </p>
              <div className="flex flex-wrap gap-4 mb-12">
                <Link 
                  to="/register" 
                  className="btn btn-primary bg-white text-primary-900 hover:bg-gray-100 px-8 py-3 rounded-lg text-lg transform transition-transform duration-300"
                >
                  Start Free
                </Link>
                <Link 
                  to="/demo" 
                  className="btn btn-secondary border-2 border-white text-white px-8 py-3 rounded-lg text-lg hover:bg-white/10 transform transition-transform duration-300"
                >
                  Schedule Demo
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FeatureCard
                  icon={Bot}
                  title="AI Agents"
                  description="24/7 intelligent sales & support"
                  link="/features/ai-growth-partner"
                />
                <FeatureCard
                  icon={FileText}
                  title="Smart Invoicing"
                  description="Automated billing & tracking"
                  link="/features/invoicing"
                />
                <FeatureCard
                  icon={Users}
                  title="CRM System"
                  description="Customer insights & automation"
                  link="/features/customer-management"
                />
                <FeatureCard
                  icon={Package}
                  title="Inventory"
                  description="Real-time stock management"
                  link="/features/inventory-tracking"
                />
                <FeatureCard
                  icon={DollarSign}
                  title="Expenses"
                  description="AI-powered receipt scanning"
                  link="/features/expenses"
                />
                <FeatureCard
                  icon={FileText}
                  title="Quotes"
                  description="Professional quote management"
                  link="/features/quotes"
                />
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                alt="Dashboard Preview"
                className="rounded-lg shadow-2xl"
              />
              <div 
                className="absolute -bottom-4 -right-4 bg-primary-800 p-4 rounded-lg shadow-xl cursor-pointer hover:bg-primary-700 transition-colors group"
                onClick={() => setShowChat(true)}
                role="button"
                tabIndex={0}
                aria-label="Chat with AI Agent"
              >
                <div className="flex items-center space-x-2">
                  <Bot className="text-primary-400 group-hover:text-primary-300" size={24} />
                  <div>
                    <p className="text-white font-semibold group-hover:text-primary-50">AI Agent Active</p>
                    <p className="text-sm text-primary-300 group-hover:text-primary-200">Click to chat with me</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Sections */}
      {features.map((feature, index) => (
        <section 
          key={feature.id}
          className={`feature-section py-24 ${index % 2 === 0 ? 'bg-dark-950' : 'bg-dark-900'}`}
        >
          <div className="container mx-auto px-6">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
              index % 2 === 0 ? '' : 'lg:flex-row-reverse'
            }`}>
              {index % 2 === 0 ? (
                <>
                  <div className="feature-content space-y-8">
                    <div className={`inline-flex items-center justify-center p-3 rounded-lg bg-${feature.color}-500/20`}>
                      <feature.icon className={`h-8 w-8 text-${feature.color}-400`} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">{feature.title}</h2>
                      <p className="text-xl text-gray-400 mb-8">{feature.description}</p>
                      <ul className="space-y-4">
                        {feature.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="text-primary-500 mt-1 mr-3" size={20} />
                            <span className="text-gray-300">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link 
                        to={feature.link}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        Learn More
                        <ArrowRight size={16} />
                      </Link>
                      <Link 
                        to="/register"
                        className="btn btn-secondary"
                      >
                        Try It Free
                      </Link>
                    </div>
                  </div>
                  <div className="feature-image-container">
                    {feature.id === 'expenses' ? (
                      <div className="relative bg-dark-800 rounded-lg p-8 border-2 border-dashed border-dark-600 hover:border-primary-500 transition-colors">
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
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity bg-primary-900/50 rounded-lg">
                          <div className="text-white text-xl font-medium">
                            Drop your files here
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={feature.image}
                        alt={feature.title}
                        className="feature-image rounded-lg shadow-xl"
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="feature-image-container">
                    <img 
                      src={feature.image}
                      alt={feature.title}
                      className="feature-image rounded-lg shadow-xl"
                    />
                  </div>
                  <div className="feature-content space-y-8">
                    <div className={`inline-flex items-center justify-center p-3 rounded-lg bg-${feature.color}-500/20`}>
                      <feature.icon className={`h-8 w-8 text-${feature.color}-400`} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-4">{feature.title}</h2>
                      <p className="text-xl text-gray-400 mb-8">{feature.description}</p>
                      <ul className="space-y-4">
                        {feature.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start">
                            <Check className="text-primary-500 mt-1 mr-3" size={20} />
                            <span className="text-gray-300">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link 
                        to={feature.link}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        Learn More
                        <ArrowRight size={16} />
                      </Link>
                      <Link 
                        to="/register"
                        className="btn btn-secondary"
                      >
                        Try It Free
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* Pricing Section */}
      <PricingSection />

      {/* Chat Bot - Only render when showChat is true */}
      <ChatBot 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
      />
    </div>
  );
};

export default AuthLayout;