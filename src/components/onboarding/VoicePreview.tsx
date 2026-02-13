import { useState } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface VoicePreviewProps {
  agentName: string;
  gender: string;
  accent: string;
  companyName: string;
}

export default function VoicePreview({ agentName, companyName }: VoicePreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    // Voice preview will be implemented with ElevenLabs/OpenAI TTS later
    // For now, show visual feedback only
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setTimeout(() => setIsPlaying(false), 3000);
    }
  };

  return (
    <div className="p-8 rounded-3xl bg-[#FFD700]/5 border border-[#FFD700]/20 flex items-center gap-6">
      <button
        type="button"
        onClick={handlePlay}
        disabled={!agentName}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
          !agentName
            ? 'bg-white/5 cursor-not-allowed'
            : 'bg-[#FFD700] text-black shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105'
        }`}
      >
        {isPlaying ? (
          <Pause size={32} />
        ) : (
          <Play size={32} className="ml-1" />
        )}
      </button>

      <div className="flex-grow">
        <h4 className="text-[#FFD700] font-black uppercase tracking-widest text-xs mb-2">
          Voice Preview
        </h4>
        <p className="text-white/60 text-sm italic">
          &ldquo;Hi, this is {agentName || '...'} from {companyName || 'your company'}. How can I help you today?&rdquo;
        </p>

        {/* Waveform Visualization */}
        <div className="mt-4 flex items-end gap-[2px] h-4">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className={`w-[2px] bg-[#FFD700]/30 rounded-full ${isPlaying ? 'animate-pulse' : ''}`}
              style={{
                height: isPlaying ? `${Math.random() * 100}%` : `${20 + Math.random() * 40}%`,
                transition: 'height 0.2s ease',
              }}
            />
          ))}
        </div>

        {!agentName && (
          <p className="text-white/30 text-[10px] uppercase font-bold mt-2">
            Enter an agent name to enable preview
          </p>
        )}
      </div>
    </div>
  );
}
