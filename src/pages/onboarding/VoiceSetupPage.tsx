import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UploadCloud, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import VoicePreview from '@/components/onboarding/VoicePreview';
import { supabase } from '@/lib/supabase';

interface VoiceConfig {
  agentName: string;
  gender: 'male' | 'female';
  accent: string;
  personality: string;
  agentInstructions: string;
}

export default function VoiceSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'free';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [lead, setLead] = useState<any>(null);

  const [config, setConfig] = useState<VoiceConfig>({
    agentName: '',
    gender: 'female',
    accent: 'canadian',
    personality: 'friendly_conversational',
    agentInstructions: '',
  });

  useEffect(() => {
    const leadData = sessionStorage.getItem('onboarding_lead');
    if (!leadData) {
      navigate('/register');
      return;
    }
    const parsed = JSON.parse(leadData);
    setLead(parsed);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.agentName.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save voice config to organization metadata
      if (lead?.organizationId) {
        const { error } = await supabase
          .from('organizations')
          .update({
            metadata: {
              ...lead.metadata,
              voice_config: config,
              voice_setup_completed: true,
            },
          })
          .eq('id', lead.organizationId);

        if (error) {
          console.error('Failed to save voice config:', error);
        }
      }

      // Update session storage
      const updatedLead = { ...lead, voiceConfig: config };
      sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));

      // Navigate based on plan
      const planId = lead?.planId || planFromUrl;
      if (planId === 'free') {
        navigate('/onboarding/success?plan=free&type=free');
      } else {
        navigate(`/onboarding/checkout?plan=${planId}`);
      }
    } catch (error) {
      console.error('Submission failed:', error);
      toast.error('Could not save configuration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      const planId = lead?.planId || planFromUrl;

      // Mark voice setup as skipped
      if (lead?.organizationId) {
        await supabase
          .from('organizations')
          .update({
            metadata: {
              ...lead.metadata,
              voice_setup_skipped: true,
            },
          })
          .eq('id', lead.organizationId);
      }

      // Navigate based on plan
      if (planId === 'free') {
        navigate('/onboarding/success?plan=free&type=free&skipped=voice');
      } else {
        navigate(`/onboarding/checkout?plan=${planId}`);
      }
    } catch (error) {
      console.error('Skip error:', error);
      setIsSkipping(false);
    }
  };

  return (
    <main className="min-h-screen bg-black pt-32 pb-20 px-6">
      <OnboardingHeader />

      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <button
            onClick={() => navigate('/onboarding/plan')}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-4"
          >
            <span>&larr;</span> Back
          </button>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight italic">
              Configure Your <span className="text-[#FFD700]">AI Agent</span>
            </h1>
            <p className="text-white/60 text-lg">
              Define the identity, voice, and behavior of your automated representative.
            </p>
          </div>
        </div>

        {/* Voice Preview */}
        <VoicePreview
          agentName={config.agentName}
          gender={config.gender}
          accent={config.accent}
          companyName={lead?.company || ''}
        />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Agent Name & Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                Agent Name
              </label>
              <input
                type="text"
                value={config.agentName}
                onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-[#FFD700] placeholder:text-white/20"
                placeholder="e.g. Sarah, Alex"
                maxLength={20}
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                Gender
              </label>
              <select
                value={config.gender}
                onChange={(e) => setConfig({ ...config, gender: e.target.value as 'male' | 'female' })}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-[#FFD700]"
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>
          </div>

          {/* Accent & Personality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                Voice Accent
              </label>
              <select
                value={config.accent}
                onChange={(e) => setConfig({ ...config, accent: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-[#FFD700]"
              >
                <option value="canadian">Canadian (Standard)</option>
                <option value="american_standard">American (Standard)</option>
                <option value="american_southern">American (Southern)</option>
                <option value="british_standard">British (Standard)</option>
                <option value="australian">Australian</option>
                <option value="neutral">Neutral / Global</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                Personality Bias
              </label>
              <select
                value={config.personality}
                onChange={(e) => setConfig({ ...config, personality: e.target.value })}
                className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-[#FFD700]"
              >
                <option value="friendly_conversational">Friendly & Conversational</option>
                <option value="professional_formal">Professional & Formal</option>
                <option value="energetic_upbeat">Energetic & Upbeat</option>
                <option value="calm_reassuring">Calm & Reassuring</option>
              </select>
            </div>
          </div>

          {/* Behavioral Instructions */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
              Behavioral Instructions
            </label>
            <textarea
              value={config.agentInstructions}
              onChange={(e) => setConfig({ ...config, agentInstructions: e.target.value })}
              rows={4}
              className="w-full bg-white/[0.03] border border-white/10 text-white rounded-2xl px-6 py-5 focus:outline-none focus:border-[#FFD700] resize-none placeholder:text-white/20"
              placeholder="e.g. Always be empathetic. If a customer is angry, transfer to a human immediately. Collect email and phone number first."
              maxLength={500}
            />
          </div>

          {/* Knowledge Base Upload */}
          <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <FileUp className="text-[#FFD700]" size={20} />
              <h4 className="text-white font-bold uppercase tracking-widest text-sm">
                Knowledge Base (Optional)
              </h4>
            </div>
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:border-[#FFD700]/30 transition-all cursor-pointer">
              <UploadCloud className="mx-auto mb-4 text-white/20" size={48} />
              <p className="text-white/40 text-sm">
                Drag & drop company documents (PDF, DOCX) to train your agent.
              </p>
              <p className="text-white/20 text-[10px] uppercase font-bold mt-2">
                Max 25MB per file
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-black py-6 rounded-2xl transition-all shadow-[0_15px_40px_rgba(255,215,0,0.2)] disabled:opacity-50"
          >
            {isSubmitting ? 'PROCESSING...' : 'CONTINUE'}
          </button>
        </form>

        {/* Skip Option */}
        <div className="text-center">
          <button
            type="button"
            disabled={isSkipping}
            onClick={handleSkip}
            className="text-white/40 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors underline underline-offset-4 disabled:opacity-50"
          >
            {isSkipping ? 'Processing...' : 'Skip for now — Configure later in Settings'}
          </button>
        </div>
      </div>
    </main>
  );
}
