import { useState } from 'react';
import { ChevronDown, ChevronUp, Smartphone, Copy, Check } from 'lucide-react';

interface CallForwardingInstructionsProps {
  phoneNumber: string;
}

interface CarrierInfo {
  name: string;
  country: string;
  enableCode: string;
  disableCode: string;
  note?: string;
}

const CARRIERS: CarrierInfo[] = [
  { name: 'AT&T', country: 'US', enableCode: '*61*{NUMBER}#', disableCode: '#61#', note: 'Forwards on no answer' },
  { name: 'Verizon', country: 'US', enableCode: '*71{NUMBER}', disableCode: '*73', note: 'Forwards all unanswered calls' },
  { name: 'T-Mobile', country: 'US', enableCode: '**61*{NUMBER}#', disableCode: '##61#', note: 'Forwards on no answer (after 15-30 seconds)' },
  { name: 'Bell', country: 'CA', enableCode: '*92{NUMBER}', disableCode: '*93', note: 'Forward on busy/no answer' },
  { name: 'Rogers', country: 'CA', enableCode: '*61*{NUMBER}#', disableCode: '#61#', note: 'Forwards on no answer' },
  { name: 'Telus', country: 'CA', enableCode: '*61*{NUMBER}#', disableCode: '#61#', note: 'Forwards on no answer' },
];

export default function CallForwardingInstructions({ phoneNumber }: CallForwardingInstructionsProps) {
  const [expanded, setExpanded] = useState(true);
  const [copiedCarrier, setCopiedCarrier] = useState<string | null>(null);

  const cleanNumber = phoneNumber.replace(/\D/g, '');

  const getDialCode = (carrier: CarrierInfo) => {
    return carrier.enableCode.replace('{NUMBER}', cleanNumber);
  };

  const handleCopyCode = async (carrier: CarrierInfo) => {
    const code = getDialCode(carrier);
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedCarrier(carrier.name);
    setTimeout(() => setCopiedCarrier(null), 2000);
  };

  const usCarriers = CARRIERS.filter(c => c.country === 'US');
  const caCarriers = CARRIERS.filter(c => c.country === 'CA');

  return (
    <div className="rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Smartphone className="text-[#FFD700]" size={20} />
          <span className="text-white font-bold text-sm uppercase tracking-widest">
            Call Forwarding Setup
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="text-white/40" size={20} />
        ) : (
          <ChevronDown className="text-white/40" size={20} />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          <p className="text-white/50 text-sm leading-relaxed">
            Set up call forwarding on your personal phone so unanswered calls go to your AI agent.
            Open your phone's dialer app and dial the code for your carrier:
          </p>

          {/* US Carriers */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">United States</p>
            {usCarriers.map((carrier) => (
              <div key={carrier.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="space-y-1">
                  <p className="text-white font-bold text-sm">{carrier.name}</p>
                  <p className="text-[#FFD700] font-mono text-sm font-bold">{getDialCode(carrier)}</p>
                  {carrier.note && (
                    <p className="text-white/30 text-[10px]">{carrier.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCopyCode(carrier)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Copy dial code"
                >
                  {copiedCarrier === carrier.name ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-white/40" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Canadian Carriers */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Canada</p>
            {caCarriers.map((carrier) => (
              <div key={carrier.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="space-y-1">
                  <p className="text-white font-bold text-sm">{carrier.name}</p>
                  <p className="text-[#FFD700] font-mono text-sm font-bold">{getDialCode(carrier)}</p>
                  {carrier.note && (
                    <p className="text-white/30 text-[10px]">{carrier.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleCopyCode(carrier)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Copy dial code"
                >
                  {copiedCarrier === carrier.name ? (
                    <Check size={16} className="text-green-400" />
                  ) : (
                    <Copy size={16} className="text-white/40" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Disable instructions */}
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2">
              To Disable Forwarding
            </p>
            <p className="text-white/40 text-xs">
              AT&T: <span className="text-white/60 font-mono">#61#</span> &middot;
              Verizon: <span className="text-white/60 font-mono">*73</span> &middot;
              T-Mobile: <span className="text-white/60 font-mono">##61#</span> &middot;
              Bell: <span className="text-white/60 font-mono">*93</span> &middot;
              Rogers/Telus: <span className="text-white/60 font-mono">#61#</span>
            </p>
          </div>

          <p className="text-white/20 text-[10px] text-center">
            Don't see your carrier? Contact them and ask to set up "call forwarding on no answer" to {phoneNumber}
          </p>
        </div>
      )}
    </div>
  );
}
