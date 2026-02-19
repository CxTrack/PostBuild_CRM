import { useState } from 'react';
import { Phone, Copy, Check } from 'lucide-react';

interface PhoneNumberRevealProps {
  phoneNumber: string;
  phoneNumberPretty?: string;
  compact?: boolean;
}

export default function PhoneNumberReveal({ phoneNumber, phoneNumberPretty, compact }: PhoneNumberRevealProps) {
  const [copied, setCopied] = useState(false);

  const displayNumber = phoneNumberPretty || phoneNumber;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = phoneNumber;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Compact variant for Settings context — single horizontal row
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
          <Phone className="text-green-600 dark:text-green-400" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">AI Agent Phone Line</p>
          <p className="text-lg font-bold font-mono text-gray-900 dark:text-white truncate">{displayNumber}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors flex-shrink-0"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-600 dark:text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    );
  }

  // Full onboarding reveal variant
  return (
    <div className="relative p-8 rounded-3xl bg-white/[0.02] border border-[#FFD700]/20 overflow-hidden animate-in fade-in duration-700">
      {/* Gold glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-[#FFD700]/5 pointer-events-none" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative space-y-6 text-center">
        <div className="w-16 h-16 bg-[#FFD700]/10 rounded-2xl flex items-center justify-center mx-auto">
          <Phone className="text-[#FFD700]" size={28} />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFD700]">
            Your AI Agent's Phone Line
          </p>
          <p className="text-4xl md:text-5xl font-black text-white tracking-wider font-mono">
            {displayNumber}
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={16} />
              <span>Copy Number</span>
            </>
          )}
        </button>

        <p className="text-white/30 text-xs">
          Forward your missed calls to this number so your AI agent can handle them.
        </p>
      </div>
    </div>
  );
}
