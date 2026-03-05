import { useState } from 'react';
import { ChevronDown, ChevronUp, Smartphone, Copy, Check, X, Phone, AlertTriangle, ExternalLink, ChevronRight } from 'lucide-react';

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
  note: string;
  supportNumber: string;
  supportNumberDial: string; // what to actually dial from that carrier
  supportHours: string;
  requiresVoicemailDisable: boolean;
  voicemailNote: string;
  extraCharges: string;
  steps: string[];
}

const CARRIERS: CarrierInfo[] = [
  {
    name: 'AT&T',
    country: 'US',
    enableCode: '*61*{NUMBER}#',
    disableCode: '#61#',
    note: 'Forwards on no answer',
    supportNumber: '1-800-331-0500',
    supportNumberDial: '611',
    supportHours: 'Mon-Fri 7am-9pm, Sat-Sun 8am-9pm CT',
    requiresVoicemailDisable: false,
    voicemailNote: 'AT&T handles voicemail and call forwarding separately. No need to disable voicemail first.',
    extraCharges: 'No extra monthly fee on unlimited plans. Forwarded calls use your plan minutes.',
    steps: [
      'Open the Phone (dialer) app on your AT&T device',
      'Dial the forwarding code shown below and press Call',
      'Wait for a confirmation tone or message',
      'Your unanswered calls will now route to your AI agent',
    ],
  },
  {
    name: 'Verizon',
    country: 'US',
    enableCode: '*71{NUMBER}',
    disableCode: '*73',
    note: 'Forwards all unanswered calls',
    supportNumber: '1-800-922-0204',
    supportNumberDial: '611',
    supportHours: 'Mon-Sun 7am-11pm local time',
    requiresVoicemailDisable: false,
    voicemailNote: 'Verizon conditional forwarding works independently of voicemail. No changes needed.',
    extraCharges: 'No extra monthly fee on most current plans.',
    steps: [
      'Open the Phone (dialer) app on your Verizon device',
      'Dial the forwarding code shown below and press Call',
      'Wait for a confirmation tone or message',
      'Your unanswered calls will now route to your AI agent',
    ],
  },
  {
    name: 'T-Mobile',
    country: 'US',
    enableCode: '**61*{NUMBER}#',
    disableCode: '##61#',
    note: 'Forwards on no answer (after 15-30 seconds)',
    supportNumber: '1-800-937-8997',
    supportNumberDial: '611',
    supportHours: 'Mon-Sun 5am-11pm PT',
    requiresVoicemailDisable: false,
    voicemailNote: 'T-Mobile handles voicemail and forwarding as separate features. No need to disable voicemail.',
    extraCharges: 'Included on postpaid unlimited plans. Prepaid plan availability varies.',
    steps: [
      'Open the Phone (dialer) app on your T-Mobile device',
      'Dial the forwarding code shown below and press Call',
      'Wait for a confirmation tone or message',
      'Your unanswered calls will now route to your AI agent',
    ],
  },
  {
    name: 'Bell',
    country: 'CA',
    enableCode: '*92{NUMBER}',
    disableCode: '*93',
    note: 'Forward on busy/no answer',
    supportNumber: '1-888-466-2453',
    supportNumberDial: '*611',
    supportHours: 'Mon-Fri 7am-12am, Sat-Sun 7am-12am ET',
    requiresVoicemailDisable: true,
    voicemailNote: 'Bell\'s voicemail (Message Centre) intercepts calls before forwarding can activate. You must call Bell and ask them to remove voicemail from your account first, or the forwarding code will not work.',
    extraCharges: 'No extra fee on most postpaid plans. Pay-per-use plans may have per-minute charges.',
    steps: [
      'Call Bell at *611 and request voicemail (Message Centre) be removed from your line',
      'Wait for Bell to confirm voicemail has been disabled',
      'Open the Phone (dialer) app on your Bell device',
      'Dial the forwarding code shown below and press Call',
      'Wait for a confirmation tone or message',
      'Your unanswered calls will now route to your AI agent',
    ],
  },
  {
    name: 'Rogers',
    country: 'CA',
    enableCode: '*61*{NUMBER}#',
    disableCode: '#61#',
    note: 'Forwards on no answer',
    supportNumber: '1-888-764-3771',
    supportNumberDial: '611',
    supportHours: 'Mon-Sun 7am-12am ET',
    requiresVoicemailDisable: true,
    voicemailNote: 'Rogers\' voicemail intercepts calls before conditional forwarding activates. Contact Rogers and ask them to remove voicemail from your account before setting up forwarding.',
    extraCharges: 'Included on most postpaid plans (up to 2,500 min/month). Pay-as-you-go may incur per-minute fees.',
    steps: [
      'Call Rogers at 611 and request voicemail be removed from your line',
      'Wait for Rogers to confirm voicemail has been disabled',
      'Open the Phone (dialer) app on your Rogers device',
      'Dial the forwarding code shown below and press Call',
      'Wait for a confirmation tone or message',
      'Your unanswered calls will now route to your AI agent',
    ],
  },
  {
    name: 'Telus',
    country: 'CA',
    enableCode: '*61*{NUMBER}#',
    disableCode: '#61#',
    note: 'Forwards on no answer',
    supportNumber: '1-866-558-2273',
    supportNumberDial: '*611',
    supportHours: 'Mon-Fri 8am-10pm, Sat-Sun 9am-8pm ET',
    requiresVoicemailDisable: true,
    voicemailNote: 'Telus voicemail intercepts calls before forwarding rules can fire. Contact Telus and ask them to disable voicemail on your line before setting up forwarding.',
    extraCharges: 'No extra monthly fee on standard postpaid plans. Forwarded airtime counts against plan minutes on metered plans.',
    steps: [
      'Call Telus at *611 and request voicemail be removed from your line',
      'Wait for Telus to confirm voicemail has been disabled',
      'Open the Phone (dialer) app on your Telus device',
      'Dial the forwarding code shown below and press Call',
      'Wait for a confirmation tone or message',
      'Your unanswered calls will now route to your AI agent',
    ],
  },
];

export default function CallForwardingInstructions({ phoneNumber, countryCode, defaultExpanded = true }: CallForwardingInstructionsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierInfo | null>(null);

  const cleanNumber = phoneNumber.replace(/\D/g, '');

  const getDialCode = (carrier: CarrierInfo) => {
    return carrier.enableCode.replace('{NUMBER}', cleanNumber);
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const usCarriers = CARRIERS.filter(c => c.country === 'US');
  const caCarriers = CARRIERS.filter(c => c.country === 'CA');

  const CopyButton = ({ text, copyKey, size = 16 }: { text: string; copyKey: string; size?: number }) => (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy(text, copyKey); }}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copiedCode === copyKey ? (
        <Check size={size} className="text-green-500 dark:text-green-400" />
      ) : (
        <Copy size={size} className="text-gray-400 dark:text-gray-500" />
      )}
    </button>
  );

  const CarrierCard = ({ carrier }: { carrier: CarrierInfo }) => (
    <button
      onClick={() => setSelectedCarrier(carrier)}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:border-[#FFD700]/50 dark:hover:border-[#FFD700]/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <Phone size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <p className="text-gray-900 dark:text-white font-bold text-sm">{carrier.name}</p>
          <p className="text-gray-400 dark:text-gray-500 text-[10px]">{carrier.note}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {carrier.requiresVoicemailDisable && (
          <span className="hidden sm:inline-flex px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wide rounded-full border border-amber-500/20">
            Setup Required
          </span>
        )}
        <ChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-[#FFD700] transition-colors" />
      </div>
    </button>
  );

  return (
    <>
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
          <div className="px-6 pb-6 space-y-5">
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              Set up call forwarding on your personal phone so unanswered calls go to your AI agent.
              Select your carrier below for step-by-step instructions:
            </p>
            <p className="text-red-600 dark:text-red-400 text-xs font-bold">
              {'\u26A0\uFE0F'} Without call forwarding, your AI agent won't receive calls. Complete this step to activate.
            </p>

            {/* US Carriers */}
            {countryCode !== 'CA' && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">United States</p>
                {usCarriers.map((carrier) => (
                  <CarrierCard key={carrier.name} carrier={carrier} />
                ))}
              </div>
            )}

            {/* Canadian Carriers */}
            {countryCode !== 'US' && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Canada</p>
                {caCarriers.map((carrier) => (
                  <CarrierCard key={carrier.name} carrier={carrier} />
                ))}
              </div>
            )}

            <p className="text-gray-400 dark:text-gray-500 text-[10px] text-center">
              Don't see your carrier? Contact them and ask to set up "call forwarding on no answer" to {phoneNumber}
            </p>
          </div>
        )}
      </div>

      {/* Carrier Detail Dialog */}
      {selectedCarrier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedCarrier(null)}
          />

          {/* Dialog */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
                  <Phone size={18} className="text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg">{selectedCarrier.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{selectedCarrier.note}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCarrier(null)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X size={18} className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Voicemail Warning (Canadian carriers) */}
              {selectedCarrier.requiresVoicemailDisable && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 dark:text-amber-300 font-bold text-sm mb-1">Voicemail Must Be Disabled First</p>
                      <p className="text-amber-700 dark:text-amber-400/80 text-xs leading-relaxed">
                        {selectedCarrier.voicemailNote}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Support */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                  Contact {selectedCarrier.name} Support
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">From your phone:</span>
                      <a
                        href={`tel:${selectedCarrier.supportNumberDial}`}
                        className="text-[#FFD700] font-mono font-bold text-sm hover:underline"
                      >
                        {selectedCarrier.supportNumberDial}
                      </a>
                    </div>
                    <CopyButton text={selectedCarrier.supportNumberDial} copyKey={`dial-${selectedCarrier.name}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Toll-free:</span>
                      <a
                        href={`tel:${selectedCarrier.supportNumber.replace(/\D/g, '')}`}
                        className="text-[#FFD700] font-mono font-bold text-sm hover:underline"
                      >
                        {selectedCarrier.supportNumber}
                      </a>
                    </div>
                    <CopyButton text={selectedCarrier.supportNumber} copyKey={`toll-${selectedCarrier.name}`} />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-[10px]">{selectedCarrier.supportHours}</p>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-3">
                  Step-by-Step Setup
                </p>
                <div className="space-y-2">
                  {selectedCarrier.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFD700]/20 text-[#FFD700] text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dial Code */}
              <div className="p-4 rounded-2xl bg-gray-900 dark:bg-gray-800 border border-gray-700">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Enable Forwarding Code
                </p>
                <div className="flex items-center justify-between">
                  <a
                    href={`tel:${getDialCode(selectedCarrier)}`}
                    className="text-[#FFD700] font-mono text-lg font-bold hover:underline"
                  >
                    {getDialCode(selectedCarrier)}
                  </a>
                  <CopyButton text={getDialCode(selectedCarrier)} copyKey={`enable-${selectedCarrier.name}`} />
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">
                    Disable Forwarding Code
                  </p>
                  <div className="flex items-center justify-between">
                    <a
                      href={`tel:${selectedCarrier.disableCode}`}
                      className="text-gray-400 font-mono text-sm font-bold hover:underline"
                    >
                      {selectedCarrier.disableCode}
                    </a>
                    <CopyButton text={selectedCarrier.disableCode} copyKey={`disable-${selectedCarrier.name}`} />
                  </div>
                </div>
              </div>

              {/* Extra charges note */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700/50">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-1">
                  Charges
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                  {selectedCarrier.extraCharges}
                </p>
              </div>

              {/* Not your carrier note */}
              {!selectedCarrier.requiresVoicemailDisable && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                  <p className="text-blue-700 dark:text-blue-400 text-xs leading-relaxed">
                    <strong>Tip:</strong> If forwarding doesn't work after dialing the code, contact {selectedCarrier.name} at{' '}
                    <span className="font-mono">{selectedCarrier.supportNumberDial}</span> and ask them to enable
                    "call forwarding on no answer" as a feature on your line.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
