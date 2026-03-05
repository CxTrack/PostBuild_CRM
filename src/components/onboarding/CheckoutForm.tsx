import { useState } from 'react';
import { CreditCard, Check, ShieldCheck, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { stripeBillingService } from '@/services/stripeBilling.service';

interface CheckoutFormProps {
  amount: number;
  planId: string;
  metadata: {
    organizationId?: string;
    email?: string;
    industry?: string;
    voiceConfig?: string;
  };
}

export default function CheckoutForm({ planId, metadata }: CheckoutFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const successUrl = `${window.location.origin}/onboarding/success?plan=${planId}&type=paid&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${window.location.origin}/onboarding/checkout?plan=${planId}`;

      const data = await stripeBillingService.createCheckoutSession(
        planId,
        successUrl,
        cancelUrl,
        metadata.organizationId
      );

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to create checkout session. Please try again.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Unable to connect to payment processor. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#FFD700]/10 flex items-center justify-center">
            <CreditCard className="text-[#FFD700]" size={24} />
          </div>
          <div>
            <p className="text-white font-bold">Secure Stripe Checkout</p>
            <p className="text-white/40 text-xs uppercase tracking-widest">
              256-bit SSL encryption
            </p>
          </div>
        </div>

        <div className="space-y-4 text-white/60 text-sm">
          <div className="flex items-center gap-3">
            <Check className="text-green-500" size={16} />
            <span>All major credit cards accepted</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="text-green-500" size={16} />
            <span>Cancel anytime from your dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Check className="text-green-500" size={16} />
            <span>Instant access after payment</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase font-black tracking-widest px-4">
        <ShieldCheck size={20} className="text-green-500" />
        Powered by Stripe - PCI DSS Compliant
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-black py-6 rounded-2xl transition-all shadow-[0_15px_40px_rgba(255,215,0,0.2)] disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            REDIRECTING TO CHECKOUT...
          </>
        ) : (
          <>
            PROCEED TO PAYMENT
            <ArrowRight size={20} />
          </>
        )}
      </button>

      <p className="text-center text-[10px] text-white/20 uppercase font-bold tracking-widest">
        By continuing, you agree to our{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#FFD700] underline underline-offset-2 transition-colors">
          Terms of Service
        </a>{' '}and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#FFD700] underline underline-offset-2 transition-colors">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}
