import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Bot, Brain, Zap, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init("8EWVDKAGb6WUEW3UR");

interface WaitlistFormData {
  email: string;
  source: string;
  message?: string;
}

const WaitlistForm: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<WaitlistFormData>();

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    try {
      // First insert into waitlist table
      const { error } = await supabase
        .from('waitlist')
        .insert([{
          email: data.email,
          source: data.source,
          message: data.message,
          plan_type: 'enterprise'
        }]);

      if (error) throw error;
      
      // Then send email notification
      const emailResponse = await emailjs.send(
        "service_c6f51s2",
        "template_pq8e2on",
        {
          to_email: "maniksharmawork@gmail.com",
          from_email: data.email,
          source: data.source,
          message: data.message || 'No additional message',
          reply_to: data.email
        },
        "8EWVDKAGb6WUEW3UR"
      );

      if (emailResponse.status !== 200) {
        throw new Error('Failed to send email notification');
      }

      toast.success('Successfully joined the waitlist! We\'ll be in touch soon.');
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Developer Login Button */}
      <div className="fixed top-4 right-4 z-50 transform transition-transform duration-200 hover:scale-105">
        <Link 
          to="/login" 
          className="btn btn-secondary bg-dark-800/80 hover:bg-dark-700/80 backdrop-blur-sm flex items-center space-x-2 transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/10"
        >
          <Star className="w-4 h-4" />
          <span>Developer Login</span>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-900/90 to-dark-950 py-24 sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.5
        }}></div>
        
        <div className="relative">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-4">
                  <img src="/logo.svg" alt="CxTrack Logo" className="h-20 w-20 logo-glow" />
                  <span className="brand-logo text-5xl font-bold text-white brand-text">CxTrack</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-primary-300 to-primary-500">
                The World's Most Powerful CRM
              </h1>
              <p className="mt-6 text-lg leading-8 text-primary-200">
                Platforming Vertical AI Integration for Your Next-Gen Workforce
              </p>
            </div>

            <div className="mt-16 flow-root sm:mt-24">
              <div className="rounded-xl bg-dark-800/50 border border-primary-800/50 backdrop-blur-sm p-8 lg:p-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="flex flex-col items-center text-center p-6 rounded-lg bg-dark-800/50 border border-dark-700 transition-all duration-300 hover:bg-dark-700/50 hover:border-primary-700/50 hover:transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/10">
                    <Bot className="h-10 w-10 text-primary-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Automation</h3>
                    <p className="text-gray-400">Intelligent agents that work 24/7 to streamline your operations</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-6 rounded-lg bg-dark-800/50 border border-dark-700 transition-all duration-300 hover:bg-dark-700/50 hover:border-primary-700/50 hover:transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/10">
                    <Brain className="h-10 w-10 text-primary-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Smart Analytics</h3>
                    <p className="text-gray-400">Deep insights and predictive analysis for better decision making</p>
                  </div>

                  <div className="flex flex-col items-center text-center p-6 rounded-lg bg-dark-800/50 border border-dark-700 transition-all duration-300 hover:bg-dark-700/50 hover:border-primary-700/50 hover:transform hover:scale-105 hover:shadow-lg hover:shadow-primary-500/10">
                    <Zap className="h-10 w-10 text-primary-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Seamless Integration</h3>
                    <p className="text-gray-400">CxTrack connects and scales your business model effortlessly</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="flex space-x-4">
                    <div className="flex-1">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="input"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-1">
                        How did you hear about us? <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="source"
                        className="input"
                        {...register('source', { required: 'Please select an option' })}
                      >
                        <option value="">Select an option</option>
                        <option value="google">Search Engine</option>
                        <option value="social">Social Media</option>
                        <option value="referral">Referral</option>
                        <option value="advertisement">Advertisement</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.source && (
                        <p className="mt-1 text-sm text-red-400">{errors.source.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn btn-primary w-full max-w-md"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        'Join Waitlist'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistForm;