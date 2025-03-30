import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Bot, FileText, Users, Building, DollarSign, Newspaper, Info, Lightbulb, History, Briefcase, Users2, Phone, Heart, Shield, Code, ListChecks, LogIn, UserPlus, Menu, X, ShoppingBag } from 'lucide-react';

const NavHeader: React.FC = () => {
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

  return (
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
                  <ChevronDown 
                    size={16} 
                    className={`transform transition-transform duration-200 ease-in-out ${
                      activeDropdown === key ? 'rotate-180' : ''
                    }`} 
                  />
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
                <ChevronDown size={16} className={`transform transition-transform duration-200 ${activeDropdown === 'enterprise' ? 'rotate-180' : ''}`} />
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
                      <ChevronDown 
                        size={16} 
                        className={`transform transition-transform duration-200 ${
                          activeDropdown === key ? 'rotate-180' : ''
                        }`} 
                      />
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
  );
};

export default NavHeader;