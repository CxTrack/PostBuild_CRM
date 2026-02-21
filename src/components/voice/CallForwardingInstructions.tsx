import { useState } from 'react';
import { ChevronDown, ChevronUp, Smartphone, Copy, Check } from 'lucide-react';

interface CallForwardingInstructionsProps {
  phoneNumber: string;
  countryCode?: string; // 'CA' or 'US' — filters shown carriers
  defaultExpanded?: boolean;
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

export default function CallForwardingInstructions({ phoneNumber, countryCode, defaultExpanded = true }: CallForwardingInstructionsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
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
    <div className="rounded-3xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Smartphone className="text-[#FFD700]" size={20} />
          <span className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-widest">
            Call Forwarding Setup
          </span>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/30 animate-pulse">
            Important!
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="text-gray-400 dark:text-gray-500" size={20} />
        ) : (
          <ChevronDown className="text-gray-400 dark:text-gray-500" size={20} />
        )}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-6">
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Set up call forwarding on your personal phone so unanswered calls go to your AI agent.
            Open your phone's dialer app and dial the code for your carrier:
          </p>
          <p className="text-red-600 dark:text-red-400 text-xs font-bold">
            {'\u26A0\uFE0F'} Without call forwarding, your AI agent won't receive calls. Complete this step to activate.
          </p>

          {/* US Carriers — hidden if user is in Canada */}
          {countryCode !== 'CA' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">United States</p>
              {usCarriers.map((carrier) => (
                <div key={carrier.name} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <p className="text-gray-900 dark:text-white font-bold text-sm">{carrier.name}</p>
                    <p className="text-[#B8860B] dark:text-[#FFD700] font-mono text-sm font-bold">{getDialCode(carrier)}</p>
                    {carrier.note && (
                      <p className="text-gray-400 dark:text-gray-500 text-[10px]">{carrier.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyCode(carrier)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Copy dial code"
                  >
                    {copiedCarrier === carrier.name ? (
                      <Check size={16} className="text-green-500 dark:text-green-400" />
                    ) : (
                      <Copy size={16} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Canadian Carriers — hidden if user is in US */}
          {countryCode !== 'US' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Canada</p>
              {caCarriers.map((carrier) => (
                <div key={carrier.name} className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                  <div className="space-y-1">
                    <p className="text-gray-900 dark:text-white font-bold text-sm">{carrier.name}</p>
                    <p className="text-[#B8860B] dark:text-[#FFD700] font-mono text-sm font-bold">{getDialCode(carrier)}</p>
                    {carrier.note && (
                      <p className="text-gray-400 dark:text-gray-500 text-[10px]">{carrier.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyCode(carrier)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Copy dial code"
                  >
                    {copiedCarrier === carrier.name ? (
                      <Check size={16} className="text-green-500 dark:text-green-400" />
                    ) : (
                      <Copy size={16} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Disable instructions — filtered by country */}
          <div className="p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-2">
              To Disable Forwarding
            </p>
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              {countryCode !== 'CA' && (
                <>
                  AT&T: <span className="text-gray-700 dark:text-gray-300 font-mono">#61#</span> &middot;{' '}
                  Verizon: <span className="text-gray-700 dark:text-gray-300 font-mono">*73</span> &middot;{' '}
                  T-Mobile: <span className="text-gray-700 dark:text-gray-300 font-mono">##61#</span>
                  {countryCode !== 'US' && <> &middot; </>}
                </>
              )}
              {countryCode !== 'US' && (
                <>
                  Bell: <span className="text-gray-700 dark:text-gray-300 font-mono">*93</span> &middot;{' '}
                  Rogers/Telus: <span className="text-gray-700 dark:text-gray-300 font-mono">#61#</span>
                </>
              )}
            </p>
          </div>

          <p className="text-gray-400 dark:text-gray-500 text-[10px] text-center">
            Don't see your carrier? Contact them and ask to set up "call forwarding on no answer" to {phoneNumber}
          </p>
        </div>
      )}
    </div>
  );
}
