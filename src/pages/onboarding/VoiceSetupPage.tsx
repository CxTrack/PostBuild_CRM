import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, Settings, Volume2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

// 4 curated voices for quick onboarding — covers female/male, professional/friendly
const QUICK_VOICES = [
  {
    id: '11labs-Rachel',
    name: 'Rachel',
    description: 'Warm & Professional',
    gender: 'female' as const,
    provider: 'ElevenLabs',
    accent: 'American',
  },
  {
    id: '11labs-Sarah',
    name: 'Sarah',
    description: 'Friendly & Conversational',
    gender: 'female' as const,
    provider: 'ElevenLabs',
    accent: 'American',
  },
  {
    id: '11labs-Chris',
    name: 'Chris',
    description: 'Confident & Clear',
    gender: 'male' as const,
    provider: 'ElevenLabs',
    accent: 'American',
  },
  {
    id: '11labs-George',
    name: 'George',
    description: 'Calm & Authoritative',
    gender: 'male' as const,
    provider: 'ElevenLabs',
    accent: 'British',
  },
];

interface VoiceConfig {
  agentName: string;
  voiceId: string;
  voiceName: string;
}

function getAuthToken(): string | null {
  try {
    const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

export default function VoiceSetupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planFromUrl = searchParams.get('plan') || 'free';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [lead, setLead] = useState<any>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Available voices from Retell (fetched to get preview URLs)
  const [retellVoices, setRetellVoices] = useState<Record<string, string>>({});

  const [config, setConfig] = useState<VoiceConfig>({
    agentName: '',
    voiceId: QUICK_VOICES[0].id,
    voiceName: QUICK_VOICES[0].name,
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

  // Fetch preview URLs from list-voices edge function
  useEffect(() => {
    const fetchPreviews = async () => {
      const token = getAuthToken();
      if (!token) {
        console.log('[VoiceSetup] No auth token available for voice previews');
        return;
      }

      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/list-voices`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey || '',
          },
          body: JSON.stringify({}),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.voices) {
            const map: Record<string, string> = {};
            for (const v of data.voices) {
              if (v.preview_audio_url) {
                // Map by exact voice_id
                map[v.voice_id] = v.preview_audio_url;
                // Also map by provider-name pattern for fuzzy matching
                // Handles cases where Retell IDs differ slightly from our hardcoded ones
                if (v.voice_name) {
                  if (v.provider === 'elevenlabs') {
                    map[`11labs-${v.voice_name}`] = v.preview_audio_url;
                  }
                  // Also map lowercase variant
                  map[`11labs-${v.voice_name.toLowerCase()}`] = v.preview_audio_url;
                }
              }
            }

            // Debug: log which of our quick voices were found
            const quickIds = QUICK_VOICES.map((qv) => qv.id);
            const matches = quickIds.map((id) => `${id}=${!!map[id]}`).join(', ');
            console.log(`[VoiceSetup] Fetched ${data.voices.length} voices. Quick voice matches: ${matches}`);

            setRetellVoices(map);
          }
        } else {
          console.warn('[VoiceSetup] list-voices returned', res.status);
        }
      } catch (err) {
        console.warn('[VoiceSetup] Failed to fetch voice previews:', err);
      }
    };

    fetchPreviews();
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPreview = useCallback((voiceId: string) => {
    if (playingVoiceId === voiceId && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingVoiceId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const previewUrl = retellVoices[voiceId];
    if (!previewUrl) {
      toast.error('Preview not available for this voice');
      return;
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);

    audio.play().catch(() => {
      toast.error('Failed to play audio preview');
      setPlayingVoiceId(null);
    });

    audio.onended = () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    };
  }, [playingVoiceId, retellVoices]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.agentName.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    setIsSubmitting(true);

    try {
      // Save voice config to organization metadata via direct fetch
      if (lead?.organizationId) {
        const token = getAuthToken();
        if (token) {
          await fetch(
            `${supabaseUrl}/rest/v1/organizations?id=eq.${lead.organizationId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey || '',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                metadata: {
                  ...lead.metadata,
                  voice_config: config,
                  voice_setup_completed: true,
                },
              }),
            }
          );
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

      // Mark voice setup as skipped via direct fetch
      if (lead?.organizationId) {
        const token = getAuthToken();
        if (token) {
          await fetch(
            `${supabaseUrl}/rest/v1/organizations?id=eq.${lead.organizationId}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'apikey': supabaseAnonKey || '',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify({
                metadata: {
                  ...lead.metadata,
                  voice_setup_skipped: true,
                },
              }),
            }
          );
        }
      }

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

      <div className="max-w-3xl mx-auto space-y-12">
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
              Set Up Your <span className="text-[#FFD700]">AI Agent</span>
            </h1>
            <p className="text-white/60 text-lg">
              Name your agent, pick a voice, and you're ready to go. Takes 30 seconds.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          {/* Agent Name */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
              Agent Name
            </label>
            <input
              type="text"
              value={config.agentName}
              onChange={(e) => setConfig({ ...config, agentName: e.target.value })}
              className="w-full bg-white/[0.03] border border-white/10 text-white rounded-xl px-5 py-4 focus:outline-none focus:border-[#FFD700] placeholder:text-white/20 text-lg"
              placeholder="e.g. Sarah, Alex, Jordan"
              maxLength={20}
              autoFocus
            />
            <p className="text-white/30 text-xs">
              This is the name your agent will use when answering calls.
            </p>
          </div>

          {/* Voice Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                Choose a Voice
              </label>
              <span className="text-white/30 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Volume2 size={12} />
                Click to preview
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {QUICK_VOICES.map((voice) => {
                const isSelected = config.voiceId === voice.id;
                const isPlaying = playingVoiceId === voice.id;

                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => {
                      setConfig({ ...config, voiceId: voice.id, voiceName: voice.name });
                    }}
                    className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
                      isSelected
                        ? 'border-[#FFD700] bg-[#FFD700]/5 shadow-[0_0_30px_rgba(255,215,0,0.1)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#FFD700] flex items-center justify-center">
                        <Check size={14} className="text-black" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
                          voice.gender === 'female'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'bg-blue-500/20 text-blue-400'
                        }`}>
                          {voice.name[0]}
                        </div>
                        <div>
                          <div className="text-white font-bold text-sm">{voice.name}</div>
                          <div className="text-white/40 text-[11px]">{voice.description}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/25 font-bold">
                        <span>{voice.gender}</span>
                        <span className="text-white/10">|</span>
                        <span>{voice.accent}</span>
                        <span className="text-white/10">|</span>
                        <span>{voice.provider}</span>
                      </div>
                    </div>

                    {/* Preview button — always shown, graceful fallback if no URL */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(voice.id);
                      }}
                      className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                        isPlaying
                          ? 'bg-[#FFD700]/20 text-[#FFD700]'
                          : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause size={12} />
                          Playing...
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          Preview
                        </>
                      )}
                    </button>
                  </button>
                );
              })}
            </div>

            {/* More voices note */}
            <div className="flex items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <Settings size={14} className="text-white/30 shrink-0" />
              <p className="text-white/40 text-xs">
                Want more voices? You can browse 100+ voices and customize accent, speed, and personality in your <strong className="text-white/60">Settings &gt; Voice Agent</strong> tab after setup.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !config.agentName.trim()}
            className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-black py-6 rounded-2xl transition-all shadow-[0_15px_40px_rgba(255,215,0,0.2)] disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {isSubmitting ? 'SAVING...' : 'CONTINUE'}
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
