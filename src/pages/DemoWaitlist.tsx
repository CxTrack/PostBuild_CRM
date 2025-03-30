import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { Bot, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';

interface DemoWaitlistFormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  location: string;
  source: string;
  interests: string[];
  message: string;
}

const DemoWaitlist: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DemoWaitlistFormData>();

  const onSubmit = async (data: DemoWaitlistFormData) => {
    setIsSubmitting(true);
    try {
      const response = await emailjs.send(
        "service_c6f51s2", // Your EmailJS service ID
        "template_pq8e2on", // Your EmailJS template ID
        {
          to_email: "maniksharmawork@gmail.com",
          from_name: data.full_name,
          from_email: data.email,
          phone: data.phone,
          company: data.company,
          location: data.location,
          source: data.source,
          interests: Array.isArray(data.interests) ? data.interests.join(', ') : data.interests,
          message: data.message || 'No additional message provided',
          reply_to: data.email
        },
        "8EWVDKAGb6WUEW3UR" // Your EmailJS public key
      );

      if (response.status === 200) {
        toast.success('Thank you for your interest! We will contact you shortly about the demo.');
        reset();
      } else {
        throw new Error('Failed to send demo request');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header Section */}
      <div className="bg-gradient-to-b from-primary-900 to-primary-800 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-white hover:text-primary-200"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <Link to="/" className="flex items-center space-x-3">
              <img src="/logo.svg" alt="CxTrack Logo" className="h-8 w-8 logo-glow" />
              <span className="brand-logo text-xl font-bold text-white brand-text">CxTrack</span>
            </Link>
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Schedule a Demo
            </h1>
            <p className="text-xl text-primary-200">
              Join our demo program to experience the power of CxTrack's AI-driven business management platform.
            </p>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-8">
            <div className="flex items-center space-x-4 mb-8">
              <div className="p-3 rounded-lg bg-primary-500/20">
                <Bot className="text-primary-400 h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Request a Demo</h2>
                <p className="text-gray-400">Fill out the form below to schedule your personalized demo</p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  className="input"
                  {...register('full_name', { required: 'Full name is required' })}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-red-400">{errors.full_name.message}</p>
                )}
              </div>

              <div>
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

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  {...register('phone', { required: 'Phone number is required' })}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="company"
                  type="text"
                  className="input"
                  {...register('company', { required: 'Company name is required' })}
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-400">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  className="input"
                  placeholder="City, Country"
                  {...register('location', { required: 'Location is required' })}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-400">{errors.location.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-1">
                  How did you hear about us? <span className="text-red-500">*</span>
                </label>
                <select
                  id="source"
                  className="input"
                  {...register('source', { required: 'Please select an option' })}
                >
                  <option value="">Select an option</option>
                  <option value="search">Search Engine</option>
                  <option value="social">Social Media</option>
                  <option value="referral">Referral</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="other">Other</option>
                </select>
                {errors.source && (
                  <p className="mt-1 text-sm text-red-400">{errors.source.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  What features are you most interested in? <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="invoicing"
                      {...register('interests', { required: 'Please select at least one feature' })}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-300">Smart Invoicing & Quotes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="crm"
                      {...register('interests')}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-300">CRM & Customer Management</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="ai_agents"
                      {...register('interests')}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-300">AI Agents & Automation</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      value="quotes"
                      {...register('interests')}
                      className="h-4 w-4 rounded border-gray-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-300">Quote Management</span>
                  </label>
                </div>
                {errors.interests && (
                  <p className="mt-1 text-sm text-red-400">{errors.interests.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">
                  Additional Information
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="input"
                  placeholder="Tell us about your business needs..."
                  {...register('message')}
                ></textarea>
              </div>

              <div className="flex items-center justify-between">
                <Link to="/register" className="text-primary-400 hover:text-primary-300 text-sm">
                  Or start with a free trial instead
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
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
                    'Request Demo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoWaitlist;