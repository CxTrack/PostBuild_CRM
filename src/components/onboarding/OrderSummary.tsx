import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const pricingMap: Record<string, number> = {
  free: 0,
  business: 50,
  elite_premium: 350,
  enterprise: 1299,
};

const labelsMap: Record<string, string> = {
  free: 'FREE PLAN',
  business: 'BUSINESS PLAN',
  elite_premium: 'ELITE PREMIUM PLAN',
  enterprise: 'ENTERPRISE PLAN',
};

export default function OrderSummary() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const lead = JSON.parse(sessionStorage.getItem('onboarding_lead') || '{}');
    const plan = searchParams.get('plan') || lead.planId;
    const priceParam = searchParams.get('price');

    setData({
      lead,
      plan,
      price: priceParam ? parseInt(priceParam) : pricingMap[plan || ''] || 0,
      label: labelsMap[plan || ''] || 'SERVICE UPGRADE',
    });
  }, [searchParams]);

  if (!data) return null;

  const subtotal = data.price;
  const tax = subtotal * 0.05; // 5% GST/HST
  const total = subtotal + tax;

  return (
    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 sticky top-32">
      <h3 className="text-xl font-bold text-white mb-8 italic">
        Order <span className="text-[#FFD700]">Summary</span>
      </h3>

      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-white font-bold text-sm uppercase tracking-widest">
              {data.label}
            </div>
            <div className="text-white/40 text-[10px] uppercase font-bold mt-1 tracking-wider">
              {data.lead?.industry?.replace('_', ' ')} PACKAGE
            </div>
            {data.lead?.voiceConfig && (
              <div className="text-white/40 text-[10px] uppercase font-bold mt-1 tracking-wider">
                VOICE AGENT: {data.lead.voiceConfig.agentName}
              </div>
            )}
          </div>
          <div className="text-white font-bold text-sm">
            ${data.price.toLocaleString()}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FFD700]/5 border border-[#FFD700]/20">
          <p className="text-[10px] text-[#FFD700] font-black uppercase leading-relaxed">
            Recurring monthly subscription. Cancel anytime.
          </p>
        </div>

        <div className="pt-6 border-t border-white/5 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Subtotal</span>
            <span className="text-white">${subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/40">HST/GST (5%)</span>
            <span className="text-white">${tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between pt-4 border-t border-[#FFD700]/20">
            <span className="text-lg font-black text-white italic uppercase tracking-widest">
              Total
            </span>
            <span className="text-2xl font-black text-[#FFD700]">
              ${total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-[10px] text-white/20 uppercase font-black text-center tracking-[0.2em] leading-relaxed">
        Secure Transaction <br />
        CxTrack Payment Gateway
      </div>
    </div>
  );
}
