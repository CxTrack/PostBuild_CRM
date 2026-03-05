import { useState, useEffect } from 'react';
import { X, Cookie, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';

export const CookieConsent = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const { theme } = useThemeStore();
    const isDark = theme === 'dark' || theme === 'midnight';

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
            <div className={`max-w-2xl mx-auto backdrop-blur-xl border rounded-2xl overflow-hidden ${
                isDark
                    ? 'bg-black/95 border-[#FFD700]/20 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]'
                    : 'bg-white/95 border-gray-200 shadow-[0_-8px_40px_rgba(0,0,0,0.1)]'
            }`}>

                {/* Main banner */}
                <div className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isDark ? 'bg-[#FFD700]/10' : 'bg-[#B8860B]/10'
                        }`}>
                            <Cookie className={`w-4 h-4 ${isDark ? 'text-[#FFD700]' : 'text-[#B8860B]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                                We use cookies to enhance your experience and analyze site traffic.
                                By clicking "Accept All", you consent to our use of cookies.
                            </p>
                        </div>
                        <button
                            onClick={handleReject}
                            className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                                isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                            }`}
                        >
                            <X className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                        </button>
                    </div>

                    {/* Expandable details */}
                    {showDetails && (
                        <div className={`space-y-3 mb-4 p-3 border rounded-xl ${
                            isDark
                                ? 'bg-white/[0.03] border-white/[0.06]'
                                : 'bg-gray-50 border-gray-200'
                        }`}>
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" checked readOnly className={`w-3.5 h-3.5 rounded ${isDark ? 'accent-[#FFD700]' : 'accent-[#B8860B]'}`} />
                                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Necessary</span>
                                <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>(Required)</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" defaultChecked className={`w-3.5 h-3.5 rounded ${isDark ? 'accent-[#FFD700]' : 'accent-[#B8860B]'}`} />
                                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</span>
                                <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Usage & performance</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <input type="checkbox" defaultChecked className={`w-3.5 h-3.5 rounded ${isDark ? 'accent-[#FFD700]' : 'accent-[#B8860B]'}`} />
                                <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Marketing</span>
                                <span className={`text-[10px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Personalized content</span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleAcceptAll}
                            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                                isDark
                                    ? 'bg-[#FFD700] hover:bg-[#FFD700]/90 text-black'
                                    : 'bg-[#B8860B] hover:bg-[#B8860B]/90 text-white'
                            }`}
                        >
                            Accept All
                        </button>
                        <button
                            onClick={handleAcceptNecessary}
                            className={`px-5 py-2 border text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                                isDark
                                    ? 'bg-white/[0.07] hover:bg-white/[0.12] border-white/[0.1] text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-700'
                            }`}
                        >
                            Necessary Only
                        </button>
                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={`px-4 py-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                                isDark ? 'text-white/50 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            <Info className="w-3.5 h-3.5" />
                            {showDetails ? 'Hide' : 'Customize'}
                        </button>
                        <Link
                            to="/privacy-policy"
                            className={`px-3 py-2 text-xs font-medium transition-colors ml-auto ${
                                isDark ? 'text-[#FFD700]/60 hover:text-[#FFD700]' : 'text-[#B8860B]/60 hover:text-[#B8860B]'
                            }`}
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
