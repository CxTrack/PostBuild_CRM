import { useState, useEffect } from 'react';
import { X, Cookie, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CookieConsent = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setShowBanner(true);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookie_consent', JSON.stringify({
            necessary: true,
            analytics: true,
            marketing: true,
            timestamp: new Date().toISOString(),
        }));
        setShowBanner(false);
    };

    const handleAcceptNecessary = () => {
        localStorage.setItem('cookie_consent', JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
        }));
        setShowBanner(false);
    };

    const handleReject = () => {
        localStorage.setItem('cookie_consent', JSON.stringify({
            necessary: true,
            analytics: false,
            marketing: false,
            timestamp: new Date().toISOString(),
        }));
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[200] p-4">
            <div className="max-w-2xl mx-auto bg-black/95 backdrop-blur-xl border border-[#FFD700]/20 rounded-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)] overflow-hidden">

                {/* Main banner */}
                <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-8 h-8 bg-[#FFD700]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Cookie className="w-4 h-4 text-[#FFD700]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-sm leading-relaxed">
                                We use cookies to enhance your experience and analyze site traffic.
                                By clicking "Accept All", you consent to our use of cookies.
                            </p>
                        </div>
                        <button
                            onClick={handleReject}
                            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                        >
                            <X className="w-4 h-4 text-white/40" />
                        </button>
                    </div>

                    {/* Expandable details */}
                    {showDetails && (
                        <div className="space-y-3 mb-4 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" checked readOnly className="w-3.5 h-3.5 rounded accent-[#FFD700]" />
                                <span className="text-white text-xs font-semibold">Necessary</span>
                                <span className="text-white/30 text-[10px]">(Required)</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded accent-[#FFD700]" />
                                <span className="text-white text-xs font-semibold">Analytics</span>
                                <span className="text-white/30 text-[10px]">Usage & performance</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" defaultChecked className="w-3.5 h-3.5 rounded accent-[#FFD700]" />
                                <span className="text-white text-xs font-semibold">Marketing</span>
                                <span className="text-white/30 text-[10px]">Personalized content</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleAcceptAll}
                            className="px-5 py-2 bg-[#FFD700] hover:bg-[#FFD700]/90 text-black text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                        >
                            Accept All
                        </button>
                        <button
                            onClick={handleAcceptNecessary}
                            className="px-5 py-2 bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.1] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
                        >
                            Necessary Only
                        </button>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className="px-4 py-2 text-white/50 hover:text-white/80 text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Info className="w-3.5 h-3.5" />
                            {showDetails ? 'Hide' : 'Customize'}
                        </button>
                        <Link
                            to="/privacy-policy"
                            className="px-3 py-2 text-[#FFD700]/60 hover:text-[#FFD700] text-xs font-medium transition-colors ml-auto"
                            onClick={() => setShowBanner(false)}
                        >
                            Privacy Policy
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
