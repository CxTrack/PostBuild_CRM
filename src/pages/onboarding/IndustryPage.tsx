import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, ArrowRight, Check } from 'lucide-react';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingPageWrapper, { staggerContainer, staggerItem } from '@/components/onboarding/OnboardingPageWrapper';
import { industries, COUNTRY_OPTIONS, detectCountryFromLocale } from '@/constants/onboarding';

export default function IndustryPage() {
    const navigate = useNavigate();
    const [selectedIndustry, setSelectedIndustry] = useState<string>('general_business');
    const [selectedCountry, setSelectedCountry] = useState<string>(() => detectCountryFromLocale());
    const [countryOpen, setCountryOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [lead, setLead] = useState<any>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const countryInfo = COUNTRY_OPTIONS.find(c => c.code === selectedCountry) || COUNTRY_OPTIONS[0];

    const filteredCountries = COUNTRY_OPTIONS.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.currency.toLowerCase().includes(countrySearch.toLowerCase())
    );

    useEffect(() => {
        const leadData = sessionStorage.getItem('onboarding_lead');
        if (!leadData) {
            navigate('/register');
            return;
        }
        const parsed = JSON.parse(leadData);
        setLead(parsed);
        if (parsed.industry) setSelectedIndustry(parsed.industry);
        if (parsed.country) setSelectedCountry(parsed.country);
    }, [navigate]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setCountryOpen(false);
                setCountrySearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Focus search when dropdown opens
    useEffect(() => {
        if (countryOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [countryOpen]);

    const handleContinue = () => {
        const updatedLead = {
            ...lead,
            industry: selectedIndustry,
            country: selectedCountry,
            currency: countryInfo.currency,
        };
        sessionStorage.setItem('onboarding_lead', JSON.stringify(updatedLead));
        navigate('/onboarding/plan');
    };

    return (
        <main className="min-h-screen bg-black pt-28 md:pt-32 pb-32 md:pb-20 px-4 md:px-6">
            <OnboardingHeader />
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

            <OnboardingPageWrapper>
                <div className="max-w-7xl mx-auto space-y-12 md:space-y-16">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center space-y-4">
                        <button
                            onClick={() => navigate('/onboarding/select-service')}
                            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest mb-2 md:mb-4 min-h-[48px]"
                        >
                            <span>&larr;</span> Back
                        </button>
                        <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight italic">
                            Tell Us About Your <span className="text-[#FFD700]">Business</span>
                        </h1>
                        <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
                            We'll tailor your CRM templates, AI logic, and workflows to fit your industry.
                        </p>
                    </div>

                    {/* Industry Selection */}
                    <section>
                        <div className="text-center mb-8 md:mb-12">
                            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4 italic tracking-tight">
                                What <span className="text-[#FFD700]">Industry</span> are we building for?
                            </h2>
                            <p className="text-white/40 text-xs md:text-sm uppercase tracking-widest font-bold">
                                Select your primary vertical
                            </p>
                        </div>

                        {/* Desktop: Grid layout */}
                        <motion.div
                            className="hidden sm:grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                        >
                            {industries.map((ind) => (
                                <motion.div
                                    key={ind.id}
                                    variants={staggerItem}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelectedIndustry(ind.id)}
                                    className={`relative p-5 md:p-6 rounded-2xl border cursor-pointer transition-colors ${
                                        selectedIndustry === ind.id
                                            ? 'bg-[#FFD700]/10 border-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.15)]'
                                            : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
                                    }`}
                                >
                                    {selectedIndustry === ind.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="absolute top-3 right-3 w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center"
                                        >
                                            <Check size={14} className="text-black" />
                                        </motion.div>
                                    )}
                                    <div className="space-y-3">
                                        <span className="material-icons text-3xl text-white/60">{ind.icon}</span>
                                        <h3 className={`font-bold text-lg ${selectedIndustry === ind.id ? 'text-[#FFD700]' : 'text-white'}`}>
                                            {ind.label}
                                        </h3>
                                        <p className="text-white/40 text-xs leading-relaxed">{ind.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Mobile: Horizontal card layout */}
                        <motion.div
                            className="sm:hidden space-y-2"
                            variants={staggerContainer}
                            initial="hidden"
                            animate="show"
                        >
                            {industries.map((ind) => (
                                <motion.div
                                    key={ind.id}
                                    variants={staggerItem}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedIndustry(ind.id)}
                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors min-h-[56px] ${
                                        selectedIndustry === ind.id
                                            ? 'bg-[#FFD700]/10 border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.1)]'
                                            : 'bg-white/[0.02] border-white/10 active:bg-white/[0.04]'
                                    }`}
                                >
                                    <span className={`material-icons text-2xl shrink-0 ${
                                        selectedIndustry === ind.id ? 'text-[#FFD700]' : 'text-white/50'
                                    }`}>
                                        {ind.icon}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm ${selectedIndustry === ind.id ? 'text-[#FFD700]' : 'text-white'}`}>
                                            {ind.label}
                                        </h3>
                                        <p className="text-white/40 text-xs truncate">{ind.description}</p>
                                    </div>
                                    {selectedIndustry === ind.id && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-6 h-6 bg-[#FFD700] rounded-full flex items-center justify-center shrink-0"
                                        >
                                            <Check size={14} className="text-black" />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    </section>

                    {/* Country / Locale Selection */}
                    <motion.section
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <div className="text-center mb-6 md:mb-8">
                            <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 md:mb-4 italic tracking-tight">
                                Where is your <span className="text-[#FFD700]">Business</span> located?
                            </h2>
                            <p className="text-white/40 text-xs md:text-sm uppercase tracking-widest font-bold">
                                We'll set your currency and locale preferences.
                            </p>
                        </div>

                        <div className="max-w-md mx-auto relative" ref={dropdownRef}>
                            {/* Selected country button */}
                            <button
                                onClick={() => setCountryOpen(!countryOpen)}
                                className={`w-full flex items-center justify-between gap-3 bg-white/[0.05] border rounded-xl px-5 py-4 text-white transition-all min-h-[56px] ${
                                    countryOpen
                                        ? 'border-[#FFD700]/50 ring-2 ring-[#FFD700]/20'
                                        : 'border-white/[0.1] hover:border-white/20'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{countryInfo.flag}</span>
                                    <span className="font-medium text-lg">{countryInfo.name}</span>
                                    <span className="text-white/40 text-sm">({countryInfo.currency})</span>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`text-white/40 transition-transform duration-200 ${countryOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown */}
                            <AnimatePresence>
                                {countryOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 z-50"
                                    >
                                        {/* Search */}
                                        <div className="p-3 border-b border-white/10">
                                            <div className="relative">
                                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    placeholder="Search countries..."
                                                    className="w-full bg-white/[0.05] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#FFD700]/30"
                                                />
                                            </div>
                                        </div>

                                        {/* Country list */}
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredCountries.map((c) => (
                                                <button
                                                    key={c.code}
                                                    onClick={() => {
                                                        setSelectedCountry(c.code);
                                                        setCountryOpen(false);
                                                        setCountrySearch('');
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[48px] ${
                                                        selectedCountry === c.code
                                                            ? 'bg-[#FFD700]/10 text-[#FFD700]'
                                                            : 'text-white hover:bg-white/[0.05]'
                                                    }`}
                                                >
                                                    <span className="text-xl">{c.flag}</span>
                                                    <span className="font-medium text-sm flex-1">{c.name}</span>
                                                    <span className="text-white/40 text-xs">{c.currency}</span>
                                                    {selectedCountry === c.code && (
                                                        <Check size={16} className="text-[#FFD700]" />
                                                    )}
                                                </button>
                                            ))}
                                            {filteredCountries.length === 0 && (
                                                <div className="px-4 py-6 text-center text-white/30 text-sm">
                                                    No countries found
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <p className="text-center text-white/30 text-xs mt-2">
                                Auto-detected from your browser. You can change this anytime in settings.
                            </p>
                        </div>
                    </motion.section>

                    {/* Desktop Continue Button */}
                    <div className="hidden md:flex justify-center pt-4">
                        <motion.button
                            onClick={handleContinue}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative px-12 py-5 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-lg rounded-2xl transition-all shadow-[0_20px_50px_rgba(255,215,0,0.2)] hover:shadow-[0_20px_50px_rgba(255,215,0,0.35)]"
                        >
                            <span className="flex items-center gap-3">
                                CONTINUE TO PRICING
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </motion.button>
                    </div>
                </div>
            </OnboardingPageWrapper>

            {/* Mobile Sticky CTA */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
                <div className="h-8 bg-gradient-to-t from-black to-transparent" />
                <div className="bg-black/95 backdrop-blur-md border-t border-white/10 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                    <button
                        onClick={handleContinue}
                        className="w-full py-4 bg-[#FFD700] hover:bg-yellow-400 text-black font-black text-base rounded-xl transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] flex items-center justify-center gap-2"
                    >
                        CONTINUE TO PRICING
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    );
}
