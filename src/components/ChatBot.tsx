import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  type: 'bot' | 'user';
  text: string;
  options?: string[];
}

// Predefined responses based on keywords
const responses = {
  default: {
    text: "I'd be happy to help you learn more about CxTrack! We offer AI-powered business management solutions to help your business grow. What would you like to know?",
    options: [
      "Tell me about your features",
      "How much does it cost?",
      "Can I try it for free?",
      "Schedule a demo"
    ]
  },

  features: {
    text: "CxTrack offers a comprehensive suite of business management tools powered by AI:",
    options: [
      "Smart Invoicing & Collections",
      "Customer Relationship Management",
      "Inventory & Stock Management",
      "AI Growth Partner Features"
    ]
  },

  invoicing: {
    text: "Our smart invoicing system helps you create, send and track professional invoices:",
    options: [
      "Automated Payment Reminders",
      "Multiple Payment Options",
      "Invoice Templates",
      "See Pricing Plans"
    ]
  },

  customers: {
    text: "Our CRM system helps you build stronger customer relationships:",
    options: [
      "360° Customer View",
      "Communication Tracking",
      "Customer Analytics",
      "Learn More"
    ]
  },

  inventory: {
    text: "Keep track of your inventory in real-time:",
    options: [
      "Stock Level Monitoring",
      "Low Stock Alerts",
      "Purchase Order Management",
      "View Features"
    ]
  },

  pricing: {
    text: "We offer flexible plans to suit your business needs, starting with a free plan:",
    options: [
      "Free Plan (Basic features)",
      "Basic Plan ($19.99/mo)",
      "Business Plan ($99.99/mo)",
      "Enterprise (Custom Pricing)"
    ]
  },

  ai: {
    text: "Our AI Growth Partner technology transforms your business operations:",
    options: [
      "Voice Collection Calls",
      "Smart Payment Reminders",
      "Customer Service Assistant",
      "Learn More About AI"
    ]
  },

  trial: {
    text: "Start with our free plan today - no credit card required! You'll get:",
    options: [
      "Basic Invoicing Features",
      "Up to 5 Customers",
      "PDF Invoice Generation",
      "Start Free Trial"
    ]
  },

  demo: {
    text: "I'd be happy to arrange a personalized demo of CxTrack for you! Our demos cover:",
    options: [
      "Schedule Demo",
      "View Features",
      "Talk to Sales",
      "Start Free Trial"
    ]
  },

  support: {
    text: "I'm here to help! How can I assist you today?",
    options: [
      "Technical Support",
      "Billing Questions",
      "Feature Requests",
      "Contact Sales Team"
    ]
  }
};

const INITIAL_GREETING = {
  type: 'bot' as const,
  text: "👋 Hey there! I'm your AI sales assistant. I noticed you're checking us out - pretty exciting stuff we've got here at CxTrack! What brings you by today? I'd love to help you find the perfect solution for your business. 😊",
  options: [
    "Tell me about the AI features",
    "How can this help my business?",
    "What are the pricing plans?",
    "I need help with invoicing"
  ]
};

interface ChatBotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen: propIsOpen, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const getResponse = (input: string) => {
    const lowercaseInput = input.toLowerCase();
    
    try {
    // AI and Automation
    if (lowercaseInput.includes('ai') || lowercaseInput.includes('automation') || 
        lowercaseInput.includes('robot') || lowercaseInput.includes('assistant')) {
      return responses.ai;
    }
    } catch (error) {
      console.error('Error in AI response:', error);
      return {
        text: "I apologize, but I'm having technical difficulties at the moment. Please try again later or contact our support team.",
        options: ["Contact Support", "Try Again"]
      };
    }
    
    // Pricing and Plans
    if (lowercaseInput.includes('price') || lowercaseInput.includes('cost') || 
        lowercaseInput.includes('plan') || lowercaseInput.includes('subscription')) {
      return responses.pricing;
    }
    
    // Features
    if (lowercaseInput.includes('feature') || lowercaseInput.includes('what can') || 
        lowercaseInput.includes('how does') || lowercaseInput.includes('capabilities')) {
      return responses.features;
    }
    
    // Invoicing
    if (lowercaseInput.includes('invoice') || lowercaseInput.includes('billing') || 
        lowercaseInput.includes('payment')) {
      return responses.invoicing;
    }

    // Customers and CRM
    if (lowercaseInput.includes('customer') || lowercaseInput.includes('crm') || 
        lowercaseInput.includes('client')) {
      return responses.customers;
    }

    // Inventory
    if (lowercaseInput.includes('inventory') || lowercaseInput.includes('stock') || 
        lowercaseInput.includes('product')) {
      return responses.inventory;
    }

    // Trial and Free Plan
    if (lowercaseInput.includes('trial') || lowercaseInput.includes('try') || 
        lowercaseInput.includes('free') || lowercaseInput.includes('start')) {
      return responses.trial;
    }

    // Demo
    if (lowercaseInput.includes('demo') || lowercaseInput.includes('show') || 
        lowercaseInput.includes('presentation')) {
      return responses.demo;
    }

    // Support
    if (lowercaseInput.includes('help') || lowercaseInput.includes('support') || 
        lowercaseInput.includes('question')) {
      return responses.support;
    }
    
    return responses.default;
  };
  
  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleInitialGreeting();
    }
  }, [isOpen, messages.length]);

  const handleInitialGreeting = () => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages([INITIAL_GREETING]);
      setIsTyping(false);
    }, 1000);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);
  
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };
  const simulateTyping = async (response: Message) => {
    setIsTyping(true);
    // Calculate typing delay based on message length (50ms per character, min 1s, max 3s)
    const typingDelay = Math.min(Math.max(response.text.length * 50, 1000), 3000);
    await new Promise(resolve => setTimeout(resolve, typingDelay));
    setIsTyping(false);
    setMessages(prev => [...prev, response]);
  };

  const handleSendMessage = async (text: string = userInput) => {
    if (!text.trim()) return;

    // Handle demo scheduling request
    if (text.toLowerCase().includes('schedule demo') || text.toLowerCase().includes('schedule a demo')) {
      navigate('/demo');
      setShowChat(false);
      return;
    }

    // Add user message immediately
    setMessages(prev => [...prev, { type: 'user', text }]);
    setUserInput('');

    try {
      // Special action handling
      if (text.toLowerCase().includes('free plan') || text.toLowerCase().includes('try it for free') || text.toLowerCase().includes('start free')) {
        navigate('/register');
        return;
      }
      
      if (text.toLowerCase().includes('talk to sales') || text.toLowerCase().includes('contact sales')) {
        navigate('/contact');
        return;
      }

      // Get and display bot response
      const botResponse = getResponse(text);
      await simulateTyping(botResponse);

      // If the response includes demo options and user clicks "Schedule Now"
      if (botResponse.options?.includes('Schedule Now')) {
        botResponse.options = botResponse.options.map(option => 
          option === 'Schedule Now' ? 'Schedule Demo' : option
        );
      }

    } catch (error) {
      console.error('Error handling message:', error);
      await simulateTyping({
        type: 'bot',
        text: "I apologize, but I'm having trouble right now. Please try again or contact our support team.",
        options: ["Contact Support", "Try Again"]
      });
    }
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length === 0) {
      handleInitialGreeting();
    }
  };

  return (
    <>
      {/* Chat button - only show if not opened externally */}
      {propIsOpen === undefined && (
        <button
          onClick={handleButtonClick}
          className="fixed bottom-4 right-4 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-dark-800 rounded-lg shadow-xl border border-dark-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <div className="flex items-center">
              <Bot size={24} className="text-primary-500 mr-2" />
              <div>
                <h3 className="font-semibold text-white">CxTrack Assistant</h3>
                <p className="text-xs text-gray-400">Online</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${
                  message.type === 'user' 
                    ? 'bg-primary-600 text-white rounded-l-lg rounded-tr-lg' 
                    : 'bg-dark-700 text-gray-100 rounded-r-lg rounded-tl-lg'
                } p-3`}>
                  <p>{message.text}</p>
                  {message.options && (
                    <div className="mt-2 space-y-2">
                      {message.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(option)}
                          className="block w-full text-left px-3 py-2 rounded bg-dark-600 hover:bg-dark-500 transition-colors text-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-dark-700 text-gray-100 rounded-r-lg rounded-tl-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-dark-700">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-dark-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;