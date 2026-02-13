import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Database, Bot, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { supabase } from '@/lib/supabase';

interface ConfigRequirements {
  currentCRM: string;
  integrationTypes: string[];
  priority: string;
  description: string;
  timeline: string;
}

const INTEGRATION_OPTIONS = [
  { id: 'api', label: 'API Integrations', icon: Database, description: 'Connect your existing tools via REST APIs' },
  { id: 'zapier', label: 'Zapier/Make Flows', icon: Zap, description: 'Automate workflows between apps' },
  { id: 'ai_agent', label: 'AI Agent Connections', icon: Bot, description: 'Connect AI assistants to your stack' },
  { id: 'data_sync', label: 'Data Sync', icon: RefreshCw, description: 'Keep data synchronized across platforms' },
];

const CRM_OPTIONS = [
  'Salesforce',
  'HubSpot',
  'Zoho CRM',
  'Pipedrive',
  'Monday.com',
  'Freshsales',
  'Custom/In-house',
  'No CRM currently',
  'Other',
];

const TIMELINE_OPTIONS = [
  { value: 'asap', label: 'As soon as possible' },
  { value: '1_month', label: 'Within 1 month' },
  { value: '3_months', label: 'Within 3 months' },
  { value: 'exploring', label: 'Just exploring options' },
];

export default function CustomConfigPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lead, setLead] = useState<any>(null);

  const [config, setConfig] = useState<ConfigRequirements>({
    currentCRM: '',
    integrationTypes: [],
    priority: '',
    description: '',
    timeline: 'exploring',
  });

  useEffect(() => {
    const leadData = sessionStorage.getItem('onboarding_lead');
    if (!leadData) {
      navigate('/register');
      return;
    }
    setLead(JSON.parse(leadData));
  }, [navigate]);

  const toggleIntegrationType = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      integrationTypes: prev.integrationTypes.includes(id)
        ? prev.integrationTypes.filter((t) => t !== id)
        : [...prev.integrationTypes, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.currentCRM) {
      toast.error('Please select your current CRM');
      return;
    }

    if (config.integrationTypes.length === 0) {
      toast.error('Please select at least one integration type');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save the configuration request to Supabase
      const { error } = await supabase.from('service_requests').insert({
        type: 'custom_configuration',
        email: lead?.email,
        company: lead?.company,
        phone: lead?.phone,
        first_name: lead?.firstName,
        last_name: lead?.lastName,
        current_crm: config.currentCRM,
        integration_types: config.integrationTypes,
        priority: config.priority,
        description: config.description,
        timeline: config.timeline,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to save request:', error);
        // Don't block the user, just log the error
      }

      // Update session storage
      const updatedLead = { ...lead, configRequest: config };
      sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

      // Navigate to success page
      navigate('/onboarding/success?type=config');
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Could not submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <button
            onClick={() => navigate('/onboarding/select-service')}
            className="flex items-center gap-2 text-white/40 hover:text-teal-400 transition-colors text-sm font-bold uppercase tracking-widest mb-4"
          >
            <span>&larr;</span> Back
          </button>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight italic">
              Custom <span className="text-teal-400">Configuration</span>
            </h1>
            <p className="text-white/60 text-lg max-w-2xl">
              Tell us about your existing stack and what you'd like to integrate. Our team will create a tailored solution for your workflow.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Current CRM */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-teal-400">
              Current CRM System
            </label>
            <select
              value={config.currentCRM}
              onChange={(e) => setConfig({ ...config, currentCRM: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-teal-400"
            >
              <option value="" className="bg-gray-900">Select your current CRM...</option>
              {CRM_OPTIONS.map((crm) => (
                <option key={crm} value={crm} className="bg-gray-900">
                  {crm}
                </option>
              ))}
            </select>
          </div>

          {/* Integration Types */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-teal-400">
              What do you need?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INTEGRATION_OPTIONS.map((option) => {
                const isSelected = config.integrationTypes.includes(option.id);
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleIntegrationType(option.id)}
                    className={`relative p-6 rounded-2xl border transition-all text-left group ${
                      isSelected
                        ? 'border-teal-400 bg-teal-500/10 shadow-[0_0_30px_rgba(45,212,191,0.1)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-teal-500/20' : 'bg-white/5'
                        }`}
                      >
                        <Icon size={20} className={isSelected ? 'text-teal-400' : 'text-white/40'} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">{option.label}</h4>
                        <p className="text-white/40 text-sm">{option.description}</p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-teal-400 bg-teal-400' : 'border-white/20'
                        }`}
                      >
                        {isSelected && <Check size={14} className="text-black" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority Description */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-teal-400">
              Top Priority Integration
            </label>
            <input
              type="text"
              value={config.priority}
              onChange={(e) => setConfig({ ...config, priority: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-teal-400 placeholder:text-white/20"
              placeholder="e.g. Sync contacts from HubSpot to our internal database"
            />
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-teal-400">
              Timeline
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TIMELINE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setConfig({ ...config, timeline: option.value })}
                  className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                    config.timeline === option.value
                      ? 'border-teal-400 bg-teal-500/10 text-teal-400'
                      : 'border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-teal-400">
              Additional Details
            </label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl px-6 py-5 focus:outline-none focus:border-teal-400 resize-none placeholder:text-white/20"
              placeholder="Describe your current workflow, pain points, and what you'd like to achieve with these integrations..."
              maxLength={1000}
            />
          </div>

          {/* Info Box */}
          <div className="p-6 rounded-2xl border border-teal-400/20 bg-teal-500/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0">
                <ArrowRight size={20} className="text-teal-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">What happens next?</h4>
                <p className="text-white/60 text-sm">
                  Our team will review your requirements and reach out within 1-2 business days to schedule a discovery call. We'll create a custom proposal based on your specific needs.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-400 hover:bg-teal-300 text-black font-black py-6 rounded-2xl transition-all shadow-[0_15px_40px_rgba(45,212,191,0.2)] hover:shadow-[0_20px_50px_rgba(45,212,191,0.3)] disabled:opacity-50 active:scale-[0.98]"
          >
            {isSubmitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </main>
  );
}
