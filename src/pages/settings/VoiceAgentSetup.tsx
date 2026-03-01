import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Mic, Volume2, MessageSquare, Building2, Users, Settings2,
    ChevronRight, ChevronLeft, Check, Save, RefreshCw, Zap,
    Clock, AlertCircle, Play, Pause, CheckCircle, Phone, Loader2,
    BookOpen, Globe, Plus, Trash2, Link, FileText, Brain,
    Square, Search, Filter, Monitor
} from 'lucide-react';
import { useVoiceAgentStore, INDUSTRY_OPTIONS, TONE_DESCRIPTIONS, AgentTone, HandlingPreference, FallbackBehavior } from '@/stores/voiceAgentStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { INDUSTRY_TEMPLATES } from '@/config/modules.config';
import PhoneNumberReveal from '@/components/voice/PhoneNumberReveal';
import CallForwardingInstructions from '@/components/voice/CallForwardingInstructions';
import MemoryContextSettings, { type MemorySettings } from '@/components/voice/MemoryContextSettings';
import BookingAvailabilityEditor from '@/components/voice/BookingAvailabilityEditor';
import { type BookingAvailability, getDefaultBookingAvailability } from '@/utils/bookingPrompt';
import AgentPersonalizationPanel from '@/components/voice/AgentPersonalizationPanel';
import { useCoPilot } from '@/contexts/CoPilotContext';
import toast from 'react-hot-toast';

const STEPS = [
    { id: 0, title: 'Basic Info', description: 'Name your agent and business' },
    { id: 1, title: 'Tone & Style', description: 'Set personality and communication style' },
    { id: 2, title: 'Call Handling', description: 'Configure how calls are handled' },
    { id: 3, title: 'Review & Activate', description: 'Review settings and go live' },
];

export const VoiceAgentSetup = () => {
    const { currentOrganization } = useOrganizationStore();
    const {
        config,
        usage,
        loading,
        provisioning,
        fetchConfig,
        saveConfig,
        updateSetupStep,
        activateAgent,
        deactivateAgent,
        fetchUsage,
        isProvisioned,
        getPhoneNumber,
        provisionAgent,
        updateRetellAgent,
        fetchRetellPrompt,
        knowledgeBases,
        kbLoading,
        fetchKnowledgeBases,
        createKnowledgeBase,
        addTextToKB,
        addUrlToKB,
        deleteKnowledgeBase,
        attachKBsToAgent,
        voices,
        voicesLoading,
        currentVoiceId,
        fetchVoices,
        setVoice,
    } = useVoiceAgentStore();
    const { openPanel, setContext, clearMessages, sendMessage } = useCoPilot();

    const [currentStep, setCurrentStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'voice' | 'prompt' | 'knowledge' | 'memory' | 'scheduling'>('settings');
    const [memorySettings, setMemorySettings] = useState<MemorySettings>({
        memory_enabled: true,
        memory_call_history: true,
        memory_customer_notes: true,
        memory_calendar_tasks: true,
    });
    const [memorySaving, setMemorySaving] = useState(false);
    const [bookingAvailability, setBookingAvailability] = useState<BookingAvailability>(getDefaultBookingAvailability());
    const [schedulingSaving, setSchedulingSaving] = useState(false);
    // Voice selection state
    const [voiceSearch, setVoiceSearch] = useState('');
    const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'male' | 'female'>('all');
    const [voiceProviderFilter, setVoiceProviderFilter] = useState<string>('all');
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // Knowledge base form state
    const [kbName, setKbName] = useState('');
    const [kbTextTitle, setKbTextTitle] = useState('');
    const [kbTextContent, setKbTextContent] = useState('');
    const [kbUrl, setKbUrl] = useState('');
    const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        agent_name: '',
        business_name: '',
        industry: '',
        customIndustry: '',
        business_description: '',
        agent_tone: 'professional' as AgentTone,
        common_call_reasons: [] as string[],
        handling_preference: 'handle_automatically' as HandlingPreference,
        fallback_behavior: 'take_message' as FallbackBehavior,
        broker_phone: '',
        broker_name: '',
        general_prompt: '',
        begin_message: '',
    });
    const [newReason, setNewReason] = useState('');
    const [phoneError, setPhoneError] = useState('');

    // Phone formatting utilities for Twilio E.164 compatibility
    const formatPhoneDisplay = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        const cleaned = digits.startsWith('1') && digits.length > 10 ? digits.slice(1) : digits;
        if (cleaned.length <= 3) return cleaned;
        if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    };

    const toE164 = (value: string): string => {
        const digits = value.replace(/\D/g, '');
        const cleaned = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
        if (cleaned.length === 10) return `+1${cleaned}`;
        return value;
    };

    const isValidUSPhone = (value: string): boolean => {
        if (!value || !value.trim()) return true; // Empty is valid (optional field)
        const digits = value.replace(/\D/g, '');
        const cleaned = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;
        return cleaned.length === 10;
    };

    useEffect(() => {
        fetchConfig();
        fetchUsage();
        fetchKnowledgeBases();
        fetchVoices();
    }, [fetchConfig, fetchUsage, fetchKnowledgeBases, fetchVoices]);

    // Load booking availability from org metadata
    useEffect(() => {
        const meta = currentOrganization?.metadata as Record<string, unknown> | undefined;
        if (meta?.business_hours) {
            const bh = meta.business_hours as BookingAvailability;
            if (bh.timezone && bh.schedule) {
                setBookingAvailability(bh);
            }
        }
    }, [currentOrganization]);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const handlePlayPreview = useCallback((voiceId: string, previewUrl?: string) => {
        // If already playing this voice, stop it
        if (playingVoiceId === voiceId && audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingVoiceId(null);
            return;
        }

        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        if (!previewUrl) {
            toast.error('No preview available for this voice');
            return;
        }

        const audio = new Audio(previewUrl);
        audioRef.current = audio;
        setPlayingVoiceId(voiceId);

        audio.play().catch(() => {
            toast.error('Failed to play audio preview');
            setPlayingVoiceId(null);
        });

        audio.onended = () => {
            setPlayingVoiceId(null);
            audioRef.current = null;
        };

        audio.onerror = () => {
            setPlayingVoiceId(null);
            audioRef.current = null;
        };
    }, [playingVoiceId]);

    const handleSelectVoice = async (voiceId: string) => {
        if (!isProvisioned()) {
            toast.error('Please provision your agent first before changing the voice');
            return;
        }

        // Stop any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
            setPlayingVoiceId(null);
        }

        const result = await setVoice(voiceId);
        if (result.success) {
            toast.success('Voice updated!');
        } else {
            toast.error(result.error || 'Failed to update voice');
        }
    };

    const filteredVoices = voices.filter((v) => {
        if (voiceGenderFilter !== 'all' && v.gender !== voiceGenderFilter) return false;
        if (voiceProviderFilter !== 'all' && v.provider !== voiceProviderFilter) return false;
        if (voiceSearch) {
            const search = voiceSearch.toLowerCase();
            return (
                v.voice_name.toLowerCase().includes(search) ||
                v.provider.toLowerCase().includes(search) ||
                (v.accent && v.accent.toLowerCase().includes(search)) ||
                (v.age && v.age.toLowerCase().includes(search)) ||
                v.gender.toLowerCase().includes(search)
            );
        }
        return true;
    });

    const voiceProviders = [...new Set(voices.map(v => v.provider))].sort();

    useEffect(() => {
        if (config) {
            const isKnownIndustry = INDUSTRY_OPTIONS.includes(config.industry);
            setFormData({
                agent_name: config.agent_name || '',
                business_name: config.business_name || '',
                industry: isKnownIndustry ? config.industry : 'Other',
                customIndustry: isKnownIndustry ? '' : config.industry || '',
                business_description: config.business_description || '',
                agent_tone: config.agent_tone || 'professional',
                common_call_reasons: config.common_call_reasons || [],
                handling_preference: config.handling_preference || 'handle_automatically',
                fallback_behavior: config.fallback_behavior || 'take_message',
                broker_phone: config.broker_phone ? formatPhoneDisplay(config.broker_phone) : '',
                broker_name: config.broker_name || '',
                general_prompt: config.general_prompt || '',
                begin_message: config.begin_message || '',
            });
            setCurrentStep(config.setup_step || 0);

            // Load memory settings from config
            setMemorySettings({
                memory_enabled: config.memory_enabled ?? true,
                memory_call_history: config.memory_call_history ?? true,
                memory_customer_notes: config.memory_customer_notes ?? true,
                memory_calendar_tasks: config.memory_calendar_tasks ?? true,
            });

            // Auto-backfill: if agent is provisioned but prompt is empty in DB, fetch from Retell
            if (config.retell_agent_id && !config.general_prompt) {
                fetchRetellPrompt();
            }
        }
    }, [config]);

    // Strip non-DB fields before saving to voice_agent_configs table
    const getDbSafeFormData = () => {
        const { customIndustry: _ci, ...dbFields } = formData;
        return {
            ...dbFields,
            industry: formData.industry === 'Other' ? formData.customIndustry : formData.industry,
            broker_phone: formData.broker_phone ? toE164(formData.broker_phone) : '',
            broker_name: formData.broker_name?.trim() || '',
        };
    };

    const handleSaveStep = async () => {
        setSaving(true);
        try {
            await saveConfig({
                ...getDbSafeFormData(),
                setup_step: currentStep,
            });
            toast.success('Progress saved');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleNext = async () => {
        await handleSaveStep();
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
            await updateSetupStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleActivate = async () => {
        if (formData.broker_phone && !isValidUSPhone(formData.broker_phone)) {
            setPhoneError('Please enter a valid 10-digit US phone number');
            toast.error('Invalid phone number for SMS notifications');
            return;
        }
        setSaving(true);
        try {
            // Save config first
            await saveConfig({
                ...getDbSafeFormData(),
                setup_completed: true,
            });

            // If not yet provisioned with Retell, trigger provisioning
            if (!config?.retell_agent_id) {
                // Pull regionCode/countryCode from org metadata if available (set during onboarding)
                const orgMeta = currentOrganization?.metadata as Record<string, any> | undefined;
                const voiceConfig = orgMeta?.voice_config;
                const result = await provisionAgent({
                    agentName: formData.agent_name || 'AI Assistant',
                    businessName: formData.business_name || 'My Business',
                    industry: currentOrganization?.industry_template || undefined,
                    ownerPhone: formData.broker_phone,
                    ownerName: formData.broker_name || formData.agent_name,
                    agentInstructions: formData.business_description,
                    countryCode: currentOrganization?.country || voiceConfig?.countryCode || undefined,
                    areaCode: voiceConfig?.areaCode || undefined,
                    regionCode: voiceConfig?.regionCode || undefined,
                });

                if (result.success) {
                    toast.success(`Voice Agent activated! Your number: ${result.phoneNumber}`);
                } else {
                    toast.error(result.error || 'Provisioning failed. Try again or contact support.');
                }
            } else {
                await activateAgent();
                toast.success('Voice Agent activated!');
            }
        } catch {
            toast.error('Failed to activate');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async () => {
        if (formData.broker_phone && !isValidUSPhone(formData.broker_phone)) {
            setPhoneError('Please enter a valid 10-digit US phone number');
            toast.error('Invalid phone number for SMS notifications');
            return;
        }
        if (formData.broker_phone && !formData.broker_name?.trim()) {
            toast('Consider adding your name for personalized SMS summaries', { icon: 'ℹ️' });
        }
        setSaving(true);
        try {
            // Save to local DB
            await saveConfig(getDbSafeFormData());

            // If provisioned, sync ALL changes to Retell API (agent + LLM)
            if (isProvisioned()) {
                const result = await updateRetellAgent({
                    agentName: formData.agent_name,
                    businessName: formData.business_name,
                    brokerPhone: formData.broker_phone,
                    brokerName: formData.broker_name,
                    // Sync prompt to Retell LLM + DB
                    generalPrompt: formData.general_prompt || undefined,
                    beginMessage: formData.begin_message || undefined,
                    // Sync local-only fields to DB via edge function
                    agentTone: formData.agent_tone,
                    handlingPreference: formData.handling_preference,
                    fallbackBehavior: formData.fallback_behavior,
                    commonCallReasons: formData.common_call_reasons,
                    businessDescription: formData.business_description,
                });
                if (!result.success) {
                    toast.error(`Saved locally but Retell sync failed: ${result.error}`);
                    return;
                }
            }

            toast.success('Settings saved & synced to AI agent');
        } catch {
            toast.error('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateKB = async () => {
        if (!kbName.trim()) {
            toast.error('Please enter a knowledge base name');
            return;
        }
        const result = await createKnowledgeBase(kbName.trim());
        if (result.success) {
            toast.success('Knowledge base created!');
            setKbName('');
            if (result.knowledgeBaseId) {
                setSelectedKbId(result.knowledgeBaseId);
                // Auto-attach to agent
                await attachKBsToAgent([result.knowledgeBaseId]);
            }
        } else {
            toast.error(result.error || 'Failed to create knowledge base');
        }
    };

    const handleAddText = async () => {
        if (!selectedKbId || !kbTextTitle.trim() || !kbTextContent.trim()) {
            toast.error('Please fill in both title and content');
            return;
        }
        const result = await addTextToKB(selectedKbId, kbTextTitle.trim(), kbTextContent.trim());
        if (result.success) {
            toast.success('Text added to knowledge base');
            setKbTextTitle('');
            setKbTextContent('');
        } else {
            toast.error(result.error || 'Failed to add text');
        }
    };

    const handleAddUrl = async () => {
        if (!selectedKbId || !kbUrl.trim()) {
            toast.error('Please enter a URL');
            return;
        }
        const result = await addUrlToKB(selectedKbId, kbUrl.trim());
        if (result.success) {
            toast.success('URL added — content will be scraped shortly');
            setKbUrl('');
        } else {
            toast.error(result.error || 'Failed to add URL');
        }
    };

    const handleDeleteKB = async (kbId: string) => {
        const result = await deleteKnowledgeBase(kbId);
        if (result.success) {
            toast.success('Knowledge base deleted');
            if (selectedKbId === kbId) setSelectedKbId(null);
        } else {
            toast.error(result.error || 'Failed to delete');
        }
    };

    const handleToggleActive = async () => {
        setSaving(true);
        try {
            if (config?.is_active) {
                await deactivateAgent();
                toast.success('Voice Agent paused');
            } else {
                await activateAgent();
                toast.success('Voice Agent activated');
            }
        } catch {
            toast.error('Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    const addCallReason = () => {
        if (newReason.trim() && !formData.common_call_reasons.includes(newReason.trim())) {
            setFormData({
                ...formData,
                common_call_reasons: [...formData.common_call_reasons, newReason.trim()],
            });
            setNewReason('');
        }
    };

    const removeCallReason = (reason: string) => {
        setFormData({
            ...formData,
            common_call_reasons: formData.common_call_reasons.filter(r => r !== reason),
        });
    };

    // Industry guard: only show voice agent setup for industries with calls module
    const industryTemplate = currentOrganization?.industry_template || 'general_business';
    const hasCallsModule = INDUSTRY_TEMPLATES[industryTemplate]?.includes('calls');

    if (!hasCallsModule) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Phone className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Agent Not Available</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-md">
                    Voice agent features are not included in your current industry template.
                    Contact support if you'd like to add call management to your plan.
                </p>
            </div>
        );
    }

    if (loading && !config) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    const isSetupComplete = config?.setup_completed;

    const usagePercent = usage ? Math.min((usage.minutes_used / usage.minutes_included) * 100, 100) : 0;
    const usageColor = usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-yellow-500' : 'bg-purple-500';

    return (
        <>
        {/* Mobile gate — hidden on md+ */}
        <div className="block md:hidden">
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
                    <Monitor className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Desktop Required</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    Voice Agent configuration is optimized for desktop. Please switch to a computer for the best experience.
                </p>
            </div>
        </div>

        {/* Desktop layout — hidden on mobile */}
        <div className="hidden md:block space-y-5">
            {/* No Phone Number Banner */}
            {!isProvisioned() && !getPhoneNumber() && (
                <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-transparent p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white dark:text-white">No Phone Number Assigned</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isSetupComplete
                                    ? 'Your voice agent is configured but needs a phone number. Use the Provision button below to get one.'
                                    : 'Complete the setup wizard below to configure your AI voice agent and get a dedicated phone number.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Header — agent info + usage in one row */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    {/* Agent avatar */}
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mic className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>

                    {/* Agent name + status */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {isSetupComplete ? (config?.agent_name || 'AI Voice Agent') : 'Set Up Your Voice Agent'}
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isSetupComplete
                                ? <>
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${config?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                    {config?.is_active ? 'Active' : 'Paused'} &middot; Handling calls 24/7
                                  </>
                                : 'Configure your AI assistant in a few easy steps'}
                        </p>
                    </div>

                    {/* Toggle active button */}
                    {isSetupComplete && (
                        <button
                            onClick={handleToggleActive}
                            disabled={saving}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${config?.is_active
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                }`}
                        >
                            {config?.is_active ? (
                                <><Pause className="w-3 h-3 inline mr-1" />Pause</>
                            ) : (
                                <><Play className="w-3 h-3 inline mr-1" />Resume</>
                            )}
                        </button>
                    )}

                    {/* Inline usage */}
                    {usage && isSetupComplete && (
                        <div className="flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {usage.minutes_used.toFixed(1)} <span className="text-gray-400 font-normal">/ {usage.minutes_included} min</span>
                                </p>
                            </div>
                            <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${usageColor}`}
                                    style={{ width: `${usagePercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {/* Usage warning — only when approaching limit */}
                {usage && usage.minutes_used >= usage.minutes_included * 0.8 && (
                    <div className={`mt-3 px-3 py-2 rounded-lg text-xs flex items-center gap-2 ${
                        usage.minutes_used >= usage.minutes_included
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                    }`}>
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                            {usage.minutes_used >= usage.minutes_included
                                ? 'Voice minutes exceeded. Upgrade your plan to continue.'
                                : `${Math.round(usagePercent)}% of included minutes used this month.`
                            }
                        </span>
                    </div>
                )}
            </div>

            {/* Setup Wizard */}
            {!isSetupComplete && (
                <>
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-colors ${currentStep > index
                                    ? 'bg-green-500 text-white'
                                    : currentStep === index
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                    }`}>
                                    {currentStep > index ? <Check className="w-5 h-5" /> : index + 1}
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className={`text-sm font-medium ${currentStep >= index ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-gray-500">{step.description}</p>
                                </div>
                                {index < STEPS.length - 1 && (
                                    <div className={`hidden sm:block w-12 h-0.5 mx-4 ${currentStep > index ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Agent Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.agent_name}
                                            onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., Alex, Sarah, Max"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">This is how your AI will introduce itself</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Business Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.business_name}
                                            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="Your Company Name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Industry
                                    </label>
                                    <select
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="">Select your industry</option>
                                        {INDUSTRY_OPTIONS.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                        <option value="Other">Other</option>
                                    </select>
                                    {formData.industry === 'Other' && (
                                        <input
                                            type="text"
                                            placeholder="Enter your industry"
                                            value={formData.customIndustry}
                                            onChange={(e) => setFormData({ ...formData, customIndustry: e.target.value })}
                                            className="mt-2 w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Business Description
                                    </label>
                                    <textarea
                                        value={formData.business_description}
                                        onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                                        placeholder="Describe your business, services, and what makes you unique. This helps the AI represent your brand accurately."
                                    />
                                </div>

                                {/* Broker Contact Info */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        SMS Call Summary Notifications
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Your Name
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.broker_name}
                                                onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                                placeholder="e.g., John Smith"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Used in SMS call summary greetings</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Your Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.broker_phone}
                                                onChange={(e) => {
                                                    const formatted = formatPhoneDisplay(e.target.value);
                                                    setFormData({ ...formData, broker_phone: formatted });
                                                    if (phoneError) setPhoneError('');
                                                }}
                                                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 dark:text-white ${phoneError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                                                placeholder="(555) 123-4567"
                                                maxLength={14}
                                            />
                                            {phoneError ? (
                                                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                                            ) : (
                                                <p className="text-xs text-gray-500 mt-1">You'll receive SMS summaries after each AI call</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tone & Communication Style</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Agent Personality
                                    </label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {(Object.keys(TONE_DESCRIPTIONS) as AgentTone[]).map(tone => (
                                            <button
                                                key={tone}
                                                onClick={() => setFormData({ ...formData, agent_tone: tone })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.agent_tone === tone
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-semibold text-gray-900 dark:text-white capitalize">{tone}</p>
                                                <p className="text-sm text-gray-500 mt-1">{TONE_DESCRIPTIONS[tone]}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Call Handling Preferences</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Common Call Reasons
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={newReason}
                                            onChange={(e) => setNewReason(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && addCallReason()}
                                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., Pricing questions, Support, Schedule appointment"
                                        />
                                        <button
                                            onClick={addCallReason}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.common_call_reasons.map(reason => (
                                            <span key={reason} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                                                {reason}
                                                <button onClick={() => removeCallReason(reason)} className="hover:text-red-500">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Handling Preference
                                    </label>
                                    <div className="space-y-3">
                                        {[
                                            { value: 'handle_automatically', label: 'Handle Automatically', desc: 'AI handles most calls independently, creates tasks/appointments' },
                                            { value: 'notify_team', label: 'Notify Team', desc: 'AI takes info and immediately notifies team members' },
                                            { value: 'transfer_immediately', label: 'Transfer to Team', desc: 'AI greets and transfers calls to available team members' },
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setFormData({ ...formData, handling_preference: opt.value as HandlingPreference })}
                                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${formData.handling_preference === opt.value
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-semibold text-gray-900 dark:text-white">{opt.label}</p>
                                                <p className="text-sm text-gray-500">{opt.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        When AI Can't Help
                                    </label>
                                    <select
                                        value={formData.fallback_behavior}
                                        onChange={(e) => setFormData({ ...formData, fallback_behavior: e.target.value as FallbackBehavior })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="take_message">Take a message</option>
                                        <option value="transfer_to_voicemail">Transfer to voicemail</option>
                                        <option value="schedule_callback">Offer to schedule a callback</option>
                                        <option value="transfer_to_human">Transfer to human operator</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Review & Activate</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Agent Info</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.agent_name || 'Not set'}</span></p>
                                            <p><span className="text-gray-500">Business:</span> <span className="font-medium">{formData.business_name || 'Not set'}</span></p>
                                            <p><span className="text-gray-500">Industry:</span> <span className="font-medium">{formData.industry || 'Not set'}</span></p>
                                            <p><span className="text-gray-500">Tone:</span> <span className="font-medium capitalize">{formData.agent_tone}</span></p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Call Handling</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="text-gray-500">Preference:</span> <span className="font-medium capitalize">{formData.handling_preference.replace(/_/g, ' ')}</span></p>
                                            <p><span className="text-gray-500">Fallback:</span> <span className="font-medium capitalize">{formData.fallback_behavior.replace(/_/g, ' ')}</span></p>
                                            <p><span className="text-gray-500">Call Reasons:</span> <span className="font-medium">{formData.common_call_reasons.length} defined</span></p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-green-800 dark:text-green-200">Ready to Go Live!</h4>
                                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                                Your AI Voice Agent is configured and ready. Click "Activate Agent" to start answering calls.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Back
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={saving}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    {saving ? 'Saving...' : 'Continue'}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleActivate}
                                    disabled={saving}
                                    className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Zap className="w-4 h-4" />
                                    {saving ? 'Activating...' : 'Activate Agent'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Post-Setup: Full Configuration */}
            {isSetupComplete && (
                <div className="space-y-5">
                    {/* Phone Number & Call Forwarding */}
                    {isProvisioned() && getPhoneNumber() && (
                        <div className="space-y-3">
                            <PhoneNumberReveal
                                phoneNumber={getPhoneNumber()!}
                                phoneNumberPretty={getPhoneNumber()!}
                                compact
                            />
                            <CallForwardingInstructions phoneNumber={getPhoneNumber()!} defaultExpanded={false} />
                        </div>
                    )}

                    {/* Provisioning Status (if not yet provisioned) */}
                    {!isProvisioned() && config?.provisioning_status !== 'completed' && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Phone Agent Not Provisioned</h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        {config?.provisioning_status === 'failed'
                                            ? `Provisioning failed: ${config.provisioning_error || 'Unknown error'}. Click below to retry.`
                                            : 'Your AI phone agent has not been set up yet. Click below to provision a phone number and activate your agent.'
                                        }
                                    </p>
                                    <button
                                        onClick={handleActivate}
                                        disabled={saving || provisioning}
                                        className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {provisioning ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" />Provisioning...</>
                                        ) : (
                                            <><Zap className="w-4 h-4" />Provision Phone Agent</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                        {[
                            { id: 'settings' as const, label: 'General Settings', icon: Settings2 },
                            { id: 'voice' as const, label: 'Voice Selection', icon: Volume2 },
                            { id: 'prompt' as const, label: 'Prompt & Personality', icon: Brain },
                            { id: 'knowledge' as const, label: 'Knowledge Base', icon: BookOpen },
                            { id: 'memory' as const, label: 'Memory & Context', icon: Brain },
                            { id: 'scheduling' as const, label: 'Scheduling', icon: Clock },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab: General Settings */}
                    {activeTab === 'settings' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">General Settings</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Agent Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.agent_name}
                                        onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Agent Tone
                                    </label>
                                    <select
                                        value={formData.agent_tone}
                                        onChange={(e) => setFormData({ ...formData, agent_tone: e.target.value as AgentTone })}
                                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="professional">Professional</option>
                                        <option value="friendly">Friendly</option>
                                        <option value="casual">Casual</option>
                                        <option value="formal">Formal</option>
                                    </select>
                                </div>
                            </div>

                            {/* SMS Contact Info */}
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    SMS Call Summary Notifications
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.broker_name}
                                            onChange={(e) => setFormData({ ...formData, broker_name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., John Smith"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Your Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={formData.broker_phone}
                                            onChange={(e) => {
                                                const formatted = formatPhoneDisplay(e.target.value);
                                                setFormData({ ...formData, broker_phone: formatted });
                                                if (phoneError) setPhoneError('');
                                            }}
                                            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-800 dark:text-white ${phoneError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}`}
                                            placeholder="(555) 123-4567"
                                            maxLength={14}
                                        />
                                        {phoneError && (
                                            <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {saving ? 'Saving & Syncing...' : 'Save & Sync to Agent'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tab: Voice Selection */}
                    {activeTab === 'voice' && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Choose Your Agent's Voice</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Select a voice for your AI agent. Click the play button to hear a preview, then click "Use This Voice" to apply it.
                                    </p>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-wrap gap-3">
                                    {/* Search */}
                                    <div className="flex-1 min-w-[200px] relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={voiceSearch}
                                            onChange={(e) => setVoiceSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white text-sm"
                                            placeholder="Search voices by name, accent, provider..."
                                        />
                                    </div>

                                    {/* Gender Filter */}
                                    <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        {(['all', 'male', 'female'] as const).map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setVoiceGenderFilter(g)}
                                                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                                                    voiceGenderFilter === g
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {g === 'all' ? 'All' : g.charAt(0).toUpperCase() + g.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Provider Filter */}
                                    <select
                                        value={voiceProviderFilter}
                                        onChange={(e) => setVoiceProviderFilter(e.target.value)}
                                        className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white text-sm"
                                    >
                                        <option value="all">All Providers</option>
                                        {voiceProviders.map((p) => (
                                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Current Voice Badge */}
                                {currentVoiceId && (
                                    <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Current voice: <strong>{voices.find(v => v.voice_id === currentVoiceId)?.voice_name || currentVoiceId}</strong></span>
                                    </div>
                                )}

                                {/* Loading State */}
                                {voicesLoading && voices.length === 0 && (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                                        <span className="ml-3 text-gray-500">Loading voices...</span>
                                    </div>
                                )}

                                {/* Voice Grid */}
                                {filteredVoices.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-1">
                                        {filteredVoices.map((voice) => {
                                            const isCurrentVoice = currentVoiceId === voice.voice_id;
                                            const isPlaying = playingVoiceId === voice.voice_id;

                                            return (
                                                <div
                                                    key={voice.voice_id}
                                                    className={`relative p-4 rounded-xl border-2 transition-all ${
                                                        isCurrentVoice
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-300 dark:ring-purple-700'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    }`}
                                                >
                                                    {/* Current badge */}
                                                    {isCurrentVoice && (
                                                        <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                                                            Active
                                                        </div>
                                                    )}

                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                                {voice.voice_name}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                                    voice.gender === 'female'
                                                                        ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                }`}>
                                                                    {voice.gender === 'female' ? '♀ Female' : '♂ Male'}
                                                                </span>
                                                                {voice.accent && (
                                                                    <span className="text-xs text-gray-500">{voice.accent}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Provider & Age */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                                            {voice.provider}
                                                        </span>
                                                        {voice.age && (
                                                            <span className="text-xs text-gray-500">{voice.age}</span>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center gap-2">
                                                        {/* Preview Button */}
                                                        <button
                                                            onClick={() => handlePlayPreview(voice.voice_id, voice.preview_audio_url)}
                                                            disabled={!voice.preview_audio_url}
                                                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                                isPlaying
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                            } disabled:opacity-40 disabled:cursor-not-allowed`}
                                                        >
                                                            {isPlaying ? (
                                                                <><Square className="w-3.5 h-3.5" />Stop</>
                                                            ) : (
                                                                <><Play className="w-3.5 h-3.5" />Preview</>
                                                            )}
                                                        </button>

                                                        {/* Select Button */}
                                                        {!isCurrentVoice && (
                                                            <button
                                                                onClick={() => handleSelectVoice(voice.voice_id)}
                                                                disabled={voicesLoading}
                                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                                Use This
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* No Results from filters */}
                                {!voicesLoading && filteredVoices.length === 0 && voices.length > 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No voices match your filters. Try adjusting your search.</p>
                                    </div>
                                )}

                                {/* Empty state - no voices loaded at all */}
                                {!voicesLoading && voices.length === 0 && (
                                    <div className="text-center py-12">
                                        <Volume2 className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-40" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">
                                            Voice library is loading or unavailable
                                        </p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                                            Voice AI provisioning is being finalized. Try refreshing in a moment.
                                        </p>
                                        <button
                                            onClick={() => fetchVoices()}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                        >
                                            <Loader2 className={`w-4 h-4 ${voicesLoading ? 'animate-spin' : ''}`} />
                                            Retry Loading Voices
                                        </button>
                                    </div>
                                )}

                                {/* Result count */}
                                {filteredVoices.length > 0 && (
                                    <p className="text-xs text-gray-500 text-right">
                                        Showing {filteredVoices.length} of {voices.length} voices
                                    </p>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <Volume2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-800 dark:text-blue-200">Voice Tips</p>
                                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                                            Choose a voice that matches your brand. Professional services often prefer calm, mature voices. Customer-facing businesses may benefit from friendly, energetic voices. You can change the voice at any time.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Prompt & Personality */}
                    {activeTab === 'prompt' && (
                        <AgentPersonalizationPanel
                            formData={{
                                general_prompt: formData.general_prompt,
                                begin_message: formData.begin_message,
                                business_description: formData.business_description,
                            }}
                            setFormData={(updater) => setFormData((prev) => {
                                const partial = typeof updater === 'function' ? updater(prev) : updater;
                                return { ...prev, ...partial };
                            })}
                            onSave={handleSaveSettings}
                            saving={saving}
                            isProvisioned={isProvisioned()}
                            onOpenCoPilot={() => {
                                clearMessages();
                                setContext({
                                    page: 'VoiceAgentSetup',
                                    data: {
                                        personalizationMode: true,
                                        industry: currentOrganization?.industry_template || 'general_business',
                                        currentValues: config?.personalization_values || {},
                                        agentName: config?.agent_name || '',
                                        businessName: config?.business_name || currentOrganization?.name || '',
                                    },
                                });
                                openPanel();
                                setTimeout(() => {
                                    sendMessage('I want to personalize my AI phone agent.');
                                }, 200);
                            }}
                        />
                    )}

                    {/* Tab: Knowledge Base */}
                    {activeTab === 'knowledge' && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Knowledge Base</h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Give your AI agent access to your business information. Upload documents, add text, or scrape your website so the agent can answer questions accurately.
                                    </p>
                                </div>

                                {/* Existing Knowledge Bases */}
                                {knowledgeBases.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Your Knowledge Bases</h4>
                                        {knowledgeBases.map((kb) => (
                                            <div
                                                key={kb.knowledge_base_id}
                                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                                    selectedKbId === kb.knowledge_base_id
                                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }`}
                                                onClick={() => setSelectedKbId(
                                                    selectedKbId === kb.knowledge_base_id ? null : kb.knowledge_base_id
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <BookOpen className="w-5 h-5 text-purple-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{kb.knowledge_base_name}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {kb.status === 'complete' ? 'Ready' :
                                                             kb.status === 'in_progress' ? 'Processing...' :
                                                             kb.status === 'error' ? 'Error' : kb.status}
                                                            {kb.knowledge_base_sources && ` • ${kb.knowledge_base_sources.length} source(s)`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteKB(kb.knowledge_base_id); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Create New KB */}
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Create New Knowledge Base</h4>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={kbName}
                                            onChange={(e) => setKbName(e.target.value)}
                                            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., Company FAQ, Service Catalog"
                                            maxLength={40}
                                        />
                                        <button
                                            onClick={handleCreateKB}
                                            disabled={kbLoading || !kbName.trim()}
                                            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {kbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            Create
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Add Content to Selected KB */}
                            {selectedKbId && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Add Content to: {knowledgeBases.find(kb => kb.knowledge_base_id === selectedKbId)?.knowledge_base_name}
                                    </h3>

                                    {/* Add Text */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-500" />
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Text Content</h4>
                                        </div>
                                        <input
                                            type="text"
                                            value={kbTextTitle}
                                            onChange={(e) => setKbTextTitle(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                            placeholder="Title (e.g., Business Hours, Pricing, Services)"
                                        />
                                        <textarea
                                            value={kbTextContent}
                                            onChange={(e) => setKbTextContent(e.target.value)}
                                            rows={6}
                                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
                                            placeholder="Enter the content your agent should know about this topic..."
                                        />
                                        <button
                                            onClick={handleAddText}
                                            disabled={!kbTextTitle.trim() || !kbTextContent.trim()}
                                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add Text
                                        </button>
                                    </div>

                                    {/* Add URL */}
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-gray-500" />
                                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Scrape from Website</h4>
                                        </div>
                                        <div className="flex gap-3">
                                            <input
                                                type="url"
                                                value={kbUrl}
                                                onChange={(e) => setKbUrl(e.target.value)}
                                                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                                                placeholder="https://yourbusiness.com/about"
                                            />
                                            <button
                                                onClick={handleAddUrl}
                                                disabled={!kbUrl.trim()}
                                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Link className="w-4 h-4" />
                                                Add URL
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            The AI will scrape the page content and use it to answer caller questions.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Info Box */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                <div className="flex items-start gap-3">
                                    <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium text-blue-800 dark:text-blue-200">How Knowledge Bases Work</p>
                                        <p className="text-blue-700 dark:text-blue-300 mt-1">
                                            When a caller asks a question, your AI agent automatically searches through your knowledge base to find the most relevant information and uses it to answer. Add your FAQ, pricing, services, policies, and any other info your agent should know.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab: Memory & Context */}
                    {activeTab === 'memory' && (
                        <MemoryContextSettings
                            settings={memorySettings}
                            onChange={(updates) => setMemorySettings(prev => ({ ...prev, ...updates }))}
                            onSave={async () => {
                                setMemorySaving(true);
                                try {
                                    await saveConfig({
                                        memory_enabled: memorySettings.memory_enabled,
                                        memory_call_history: memorySettings.memory_call_history,
                                        memory_customer_notes: memorySettings.memory_customer_notes,
                                        memory_calendar_tasks: memorySettings.memory_calendar_tasks,
                                    });
                                    toast.success('Memory settings saved');
                                } catch {
                                    toast.error('Failed to save memory settings');
                                } finally {
                                    setMemorySaving(false);
                                }
                            }}
                            saving={memorySaving}
                            isProvisioned={isProvisioned()}
                        />
                    )}

                    {activeTab === 'scheduling' && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
                            <BookingAvailabilityEditor
                                value={bookingAvailability}
                                onChange={setBookingAvailability}
                                showPreview={true}
                            />

                            {/* Save Button */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    disabled={schedulingSaving || !isProvisioned()}
                                    onClick={async () => {
                                        setSchedulingSaving(true);
                                        try {
                                            const orgId = currentOrganization?.id;
                                            if (!orgId) throw new Error('No organization');

                                            // 1. Save to org metadata
                                            const token = (() => {
                                                for (const key of Object.keys(localStorage)) {
                                                    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                                                        try {
                                                            const parsed = JSON.parse(localStorage.getItem(key) || '');
                                                            return parsed?.access_token;
                                                        } catch { /* skip */ }
                                                    }
                                                }
                                                return null;
                                            })();

                                            if (!token) throw new Error('Not authenticated');

                                            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                                            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                                            // Merge with existing metadata
                                            const existingMeta = (currentOrganization?.metadata || {}) as Record<string, unknown>;
                                            const updatedMeta = { ...existingMeta, business_hours: bookingAvailability };

                                            const metaRes = await fetch(
                                                `${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}`,
                                                {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${token}`,
                                                        'apikey': supabaseKey || '',
                                                        'Prefer': 'return=minimal',
                                                    },
                                                    body: JSON.stringify({ metadata: updatedMeta }),
                                                }
                                            );

                                            if (!metaRes.ok) throw new Error('Failed to save availability');

                                            // 2. Update Retell agent prompt with new booking rules
                                            await updateRetellAgent({
                                                businessHours: bookingAvailability,
                                            });

                                            toast.success('Booking availability saved and agent updated');
                                        } catch (err) {
                                            console.error('Failed to save scheduling:', err);
                                            toast.error('Failed to save booking availability');
                                        } finally {
                                            setSchedulingSaving(false);
                                        }
                                    }}
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed
                                               text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {schedulingSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Availability
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Fix legacy Cal.com tools for existing agents */}
                            {isProvisioned() && (
                                <div className="border border-gray-700 rounded-lg p-4 bg-gray-900/30">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-300">Legacy Tool Migration</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                If your agent was set up before the booking system update, click here to convert legacy Cal.com tools to the new webhook-based tools.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    toast.loading('Fixing booking tools...', { id: 'fix-tools' });
                                                    await updateRetellAgent({ fixTools: true });
                                                    toast.success('Booking tools updated successfully', { id: 'fix-tools' });
                                                } catch {
                                                    toast.error('Failed to fix tools', { id: 'fix-tools' });
                                                }
                                            }}
                                            className="px-4 py-2 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-lg
                                                       hover:bg-amber-500/10 transition-colors whitespace-nowrap flex items-center gap-1.5"
                                        >
                                            <Zap className="h-3.5 w-3.5" />
                                            Fix Tools
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!isProvisioned() && (
                                <p className="text-sm text-amber-400">
                                    Provision your voice agent first to configure booking availability.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
        </>
    );
};

export default VoiceAgentSetup;
