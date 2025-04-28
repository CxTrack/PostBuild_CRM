import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bot, FileText, Users, Building, DollarSign, Newspaper, Info, Lightbulb, History, Briefcase, Users2, Phone, Heart, Shield, Code, ListChecks, LogIn, UserPlus, Menu, X, ShoppingBag, Calendar, Check, ArrowRight, Package
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Handle mouse enter/leave for entire nav item
  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActiveDropdown(key);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 300); // Increased delay before closing
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const dropdowns = {
    product: [
      { label: 'AI Agent', href: '/products/ai-agent' },
      { label: 'AI Workforce', href: '/products/ai-workforce' },
      { label: 'AI Tools', href: '/products/ai-tools' },
      { label: 'CRM', href: '/products/crm' }
    ],
    function: [
      { label: 'Sales', href: '/function/sales' },
      { label: 'Marketing', href: '/function/marketing' },
      { label: 'Customer Support', href: '/function/customer-support' },
      { label: 'Research', href: '/function/research' },
      { label: 'Operations', href: '/function/operations' }
    ],
    agents: [
      { label: 'AI BDR Agent', href: '/agents/bdr' },
      { label: 'Lifecycle Marketer', href: '/agents/marketer' },
      { label: 'Account Researcher', href: '/agents/researcher' },
      { label: 'CRM Enrichment', href: '/agents/crm' },
      { label: 'Inbound Qualification', href: '/agents/qualification' },
      { label: 'SEO', href: '/agents/seo' },
      { label: 'Inbox Manager', href: '/agents/inbox' }
    ],
    enterprise: [
      { label: 'Solutions', href: '/enterprise/solutions', icon: Building },
      { label: 'Security', href: '/enterprise/security', icon: Shield },
      { label: 'Custom Development', href: '/enterprise/custom', icon: Code }
    ],
    pricing: [
      { label: 'Plans & Features', href: '/pricing', icon: DollarSign },
      { label: 'Compare Plans', href: '/pricing/compare', icon: ListChecks },
      { label: 'Enterprise Pricing', href: '/pricing/enterprise', icon: Building },
      { label: 'Contact Sales', href: '/contact', icon: Phone }
    ],
    about: [
      { label: 'Our Story', href: '/about', icon: History },
      { label: 'Team', href: '/about/team', icon: Users2 },
      { label: 'Contact', href: '/contact', icon: Phone },
      { label: 'Careers', href: '/careers', icon: Heart },
      { label: 'Regional Availability', href: '/gdpr', icon: Info }
    ]
  };

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
      icon: Bot,
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
      {/* Header with navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-primary-900/95 to-primary-800/95 backdrop-blur-sm border-b border-primary-800/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between relative">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo.svg" alt="CxTrack Logo" className="h-8 w-8 logo-glow" />
              <span className="brand-logo text-xl font-bold text-white brand-text">CxTrack</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-white p-2 hover:bg-primary-800/50 rounded-lg"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Navigation Links - Centered */}
            <div className="hidden lg:flex items-center justify-center space-x-6">
              {Object.entries(dropdowns).map(([key, items]) => (
                key !== 'enterprise' && key !== 'pricing' && key !== 'blog' && key !== 'about' && (
                <div 
                  key={key}
                  className="relative"
                  ref={el => dropdownRefs.current[key] = el}
                  onMouseEnter={() => handleMouseEnter(key)} 
                  onMouseLeave={handleMouseLeave} 
                >
                  <button className="flex items-center space-x-1 text-gray-100 hover:text-white group-hover:text-white transition-all duration-200 ease-in-out">
                    {key === 'product' && <FileText size={18} className="mr-1" />}
                    {key === 'function' && <Users size={18} className="mr-1" />}
                    {key === 'agents' && <Bot size={18} className="mr-1" />}
                    <span className="capitalize">{key}</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className={`transform transition-transform duration-200 ease-in-out ${
                        activeDropdown === key ? 'rotate-180' : ''
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* Dropdown */}
                  <div 
                    className={`absolute left-1/2 transform -translate-x-1/2 mt-0.5 pt-2 w-56 transition-all duration-200 ease-in-out ${
                    activeDropdown === key ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                  >
                    <div className="bg-dark-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-dark-700 overflow-hidden">
                    {items.map((item, index) => (
                      <Link
                        key={index}
                        to={item.href}
                        className="block px-4 py-2.5 text-gray-300 hover:bg-dark-700/50 hover:text-white transition-all duration-200 ease-in-out cursor-pointer"
                        onClick={() => setActiveDropdown(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                    </div>
                  </div>
                </div>
                )
              ))}

              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('enterprise')} 
                onMouseLeave={handleMouseLeave} 
              >
                <button className="flex items-center space-x-1 text-gray-100 hover:text-white group-hover:text-white transition-all duration-200 ease-in-out">
                  <Building size={18} className="mr-1" />
                  <span>Enterprise</span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className={`transform transition-transform duration-200 ${activeDropdown === 'enterprise' ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div 
                  className={`absolute left-1/2 transform -translate-x-1/2 mt-0.5 pt-2 w-48 transition-all duration-200 ease-in-out ${
                  activeDropdown === 'enterprise' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                  onMouseEnter={() => handleMouseEnter('enterprise')}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="bg-dark-800/95 backdrop-blur-sm rounded-lg shadow-lg border border-dark-700 overflow-hidden">
                  {dropdowns.enterprise.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className="flex items-center px-4 py-2.5 text-gray-300 hover:bg-dark-700/50 hover:text-white transition-all duration-200 ease-in-out cursor-pointer"
                    >
                      <item.icon size={16} className="mr-2" />
                      {item.label}
                    </Link>
                  ))}
                  </div>
                </div>
              </div>

              <div 
                className="flex items-center"
              >
                <Link 
                  to="/pricing/compare"
                  className="flex items-center space-x-1 text-gray-100 hover:text-white group-hover:text-white transition-all duration-200 ease-in-out"
                >
                  <DollarSign size={18} className="mr-1" />
                  <span>Pricing</span>
                </Link>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link to="/login" className="btn btn-secondary flex items-center space-x-2">
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="btn btn-primary flex items-center space-x-2">
                <UserPlus size={16} />
                <span>Sign Up</span>
              </Link>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800/95 backdrop-blur-sm border-t border-dark-700 lg:hidden">
                <div className="py-4 px-4 space-y-4">
                  {/* Mobile Navigation Links */}
                  {Object.entries(dropdowns).map(([key, items]) => (
                    <div key={key} className="space-y-2">
                      <button
                        onClick={() => setActiveDropdown(activeDropdown === key ? null : key)}
                        className="w-full flex items-center justify-between text-gray-100 hover:text-white py-2"
                        key={key}
                      >
                        <span className="capitalize">{key}</span>
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          className={`transform transition-transform duration-200 ${
                            activeDropdown === key ? 'rotate-180' : ''
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>
                      
                      {activeDropdown === key && (
                        <div className="pl-4 space-y-2">
                          {items.map((item, index) => (
                            <Link
                              key={index}
                              to={item.href}
                              className="block text-gray-300 hover:text-white py-2"
                              onClick={() => {
                                setActiveDropdown(null);
                                setIsMobileMenuOpen(false);
                              }}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Mobile Auth Buttons */}
                  <div className="pt-4 border-t border-dark-700 space-y-2">
                    <Link 
                      to="/login" 
                      className="w-full btn btn-secondary flex items-center justify-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LogIn size={16} />
                      <span>Sign In</span>
                    </Link>
                    <Link 
                      to="/register" 
                      className="w-full btn btn-primary flex items-center justify-center space-x-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserPlus size={16} />
                      <span>Sign Up</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative bg-primary-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="container mx-auto px-6 pt-20 pb-24">
          {/* Logo Section */}
          <div className="flex items-center justify-center md:justify-start mb-8">
            <img 
              src="/logo.svg" 
              alt="CxTrack Logo" 
              className="h-16 w-16 logo-glow mr-4"
            />
            <h1 className="brand-logo text-5xl font-bold text-white brand-text">
              CxTrack
            </h1>
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
            <div className="relative hidden md:block">
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