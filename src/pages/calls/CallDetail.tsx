import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Phone, ArrowLeft, Download, Share2, Play, Pause,
    User, UserPlus, TrendingUp, TrendingDown, Minus,
    MessageSquare, CheckCircle, Volume2, FileText, HelpCircle
} from 'lucide-react';
import { useCallStore } from '@/stores/callStore';
import { useThemeStore } from '@/stores/themeStore';
import { Call, CallSummary } from '@/types/database.types';
import toast from 'react-hot-toast';
import QuickAddCustomerModal from '@/components/shared/QuickAddCustomerModal';

// Tooltip Component for explanatory hints
const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
    <div className="relative group inline-flex items-center">
        {children}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-normal w-48 text-center z-50 shadow-lg">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </div>
    </div>
);

export const CallDetail = () => {
    const { callId } = useParams();
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const { currentCall, currentCallSummary, loading, error, fetchCallById, fetchCallSummary, updateCall } = useCallStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (callId) {
            fetchCallById(callId);
            fetchCallSummary(callId);
        }
    }, [callId, fetchCallById, fetchCallSummary]);

    // Derived data from call + call_summary
    const call = currentCall;
    const summary = currentCallSummary;

    const customerName = call?.customers
        ? [call.customers.first_name, call.customers.last_name].filter(Boolean).join(' ') || call.customers.name || call.customers.company
        : null;

    const displayPhone = call?.customer_phone || call?.phone_number || '';
    const sentiment = summary?.sentiment || call?.sentiment || null;
    const sentimentScore = summary?.sentiment_score ?? call?.sentiment_score ?? null;
    const summaryText = summary?.summary_text || call?.summary || call?.call_summary || '';
    const transcript = summary?.transcript_object || [];
    const keyTopics = summary?.key_topics || [];
    const actionItems = summary?.action_items || [];
    const recordingUrl = summary?.recording_url || call?.recording_url || null;
    const durationMs = summary?.duration_ms || (call?.duration_seconds ? call.duration_seconds * 1000 : 0);
    const startTime = call?.started_at ? new Date(call.started_at) : null;

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
    };

    const handleCustomerCreated = async (newCustomer: any) => {
        if (callId && newCustomer?.id) {
            await updateCall(callId, {
                customer_id: newCustomer.id,
                customer_phone: newCustomer.phone || displayPhone,
            });
            await fetchCallById(callId);
            toast.success('Customer linked to this call');
        }
        setShowQuickAddCustomer(false);
    };

    const handleExport = () => {
        if (!call) return;

        const lines = [
            `Call Details - ${startTime?.toLocaleString() || 'Unknown'}`,
            `ID: ${call.id}`,
            `Duration: ${formatDuration(durationMs)}`,
            sentiment ? `Sentiment: ${sentiment}${sentimentScore != null ? ` (${(sentimentScore * 100).toFixed(0)}%)` : ''}` : '',
            '',
            summaryText ? `Summary:\n${summaryText}` : '',
            keyTopics.length ? `\nKey Topics:\n${keyTopics.join(', ')}` : '',
            actionItems.length ? `\nAction Items:\n${actionItems.map((item, i) => `${i + 1}. ${typeof item === 'string' ? item : item.description}`).join('\n')}` : '',
            transcript.length ? `\nTranscript:\n${transcript.map(m => `[${formatTime(m.timestamp || 0)}] ${m.role.toUpperCase()}: ${m.content}`).join('\n')}` : '',
        ].filter(Boolean).join('\n');

        const blob = new Blob([lines.trim()], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `call_${call.id}_export.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Call details exported!');
    };

    const isDark = theme === 'dark' || theme === 'midnight';

    // Card classes using Tailwind dark: prefix so midnight.css can override
    const cardClass = 'rounded-2xl border-2 p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none';
    const sideCardClass = 'rounded-2xl p-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-none';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (!call) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <p className="text-lg text-gray-600 dark:text-gray-400">Call not found</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const handlePlaybackRateChange = (rate: number) => {
        if (audioRef.current) {
            audioRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const SentimentIcon = sentiment === 'positive' ? TrendingUp : sentiment === 'negative' ? TrendingDown : Minus;
    const sentimentColor = sentiment === 'positive' ? 'text-green-600' : sentiment === 'negative' ? 'text-red-600' : 'text-gray-600';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6">
            <div className="max-w-[1920px] mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">Call Details</h1>
                                {customerName && (
                                    call.customer_id ? (
                                        <span
                                            onClick={() => navigate(`/dashboard/customers/${call.customer_id}`)}
                                            className={`px-2 py-0.5 rounded-lg text-xs font-bold cursor-pointer hover:ring-2 transition-all ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:ring-blue-400/50' : 'bg-blue-50 text-blue-700 border border-blue-100 hover:ring-blue-400'}`}
                                            title="View customer profile"
                                        >
                                            {customerName}
                                        </span>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isDark ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                            {customerName}
                                        </span>
                                    )
                                )}
                                {!call.customer_id && displayPhone && (
                                    <button
                                        onClick={() => setShowQuickAddCustomer(true)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all hover:ring-2 ${isDark
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:ring-green-400/50 hover:bg-green-500/20'
                                            : 'bg-green-50 text-green-700 border border-green-100 hover:ring-green-400 hover:bg-green-100'
                                        }`}
                                        title="Save this phone number as a new customer"
                                    >
                                        <UserPlus className="w-3.5 h-3.5" />
                                        Add as Customer
                                    </button>
                                )}
                                {call.call_type === 'ai_agent' && (
                                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${isDark ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-700 border border-purple-100'}`}>
                                        AI Agent
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {startTime?.toLocaleString() || 'Unknown time'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 border-2 rounded-xl flex items-center gap-2 transition-colors border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                        <button
                            onClick={handleShare}
                            className="px-4 py-2 border-2 rounded-xl flex items-center gap-2 transition-colors border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Audio Player */}
                        {recordingUrl && (
                            <div className={cardClass}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-bold flex items-center gap-2">
                                        <Volume2 className="w-5 h-5 text-blue-600" />
                                        Call Recording
                                    </h2>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDuration(durationMs)}
                                    </span>
                                </div>

                                <div className="rounded-xl p-6 border bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30">
                                    <audio
                                        src={recordingUrl}
                                        ref={audioRef}
                                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                                        onEnded={() => setIsPlaying(false)}
                                    />

                                    <div className="mb-4">
                                        <div className="w-full rounded-full h-2 bg-gray-200 dark:bg-gray-700">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-100"
                                                style={{ width: durationMs > 0 ? `${(currentTime / (durationMs / 1000)) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs mt-2 text-gray-600 dark:text-gray-400">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(durationMs / 1000)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-6">
                                        <button
                                            onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10 }}
                                            className="p-2 rounded-lg transition-colors hover:bg-white/50 dark:hover:bg-gray-700"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" /></svg>
                                        </button>
                                        <button
                                            onClick={togglePlay}
                                            className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                                        </button>
                                        <button
                                            onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10 }}
                                            className="p-2 rounded-lg transition-colors hover:bg-white/50 dark:hover:bg-gray-700"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" /></svg>
                                        </button>

                                        {/* Playback Rate Selector */}
                                        <div className="flex bg-gray-200/50 dark:bg-gray-800/50 rounded-lg p-1 ml-4 gap-1">
                                            {[0.5, 1, 1.5, 2].map((rate) => (
                                                <button
                                                    key={rate}
                                                    onClick={() => handlePlaybackRateChange(rate)}
                                                    className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${playbackRate === rate
                                                        ? 'bg-blue-600 text-white shadow-sm'
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-white'
                                                        }`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* No Recording Available */}
                        {!recordingUrl && (
                            <div className={cardClass}>
                                <div className="flex items-center gap-2 text-center justify-center py-8">
                                    <Volume2 className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    <p className="text-gray-400 dark:text-gray-500">No recording available for this call</p>
                                </div>
                            </div>
                        )}

                        {/* AI Summary */}
                        <div className={cardClass}>
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-purple-600" />
                                AI Summary
                            </h2>
                            {summaryText ? (
                                <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                    {summaryText}
                                </p>
                            ) : (
                                <div className="flex items-center gap-3 py-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                        <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            No AI summary available
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">
                                            AI summaries are generated automatically for new calls handled by your voice agent
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Transcript */}
                        {transcript.length > 0 && (
                            <div className={cardClass}>
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Full Transcript
                                </h2>
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {transcript.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex gap-4 ${message.role === 'agent' ? 'flex-row' : 'flex-row-reverse'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${message.role === 'agent'
                                                ? 'bg-blue-100 text-blue-600'
                                                : 'bg-indigo-100 text-indigo-600'
                                                }`}>
                                                {message.role === 'agent' ? <Phone className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                            </div>
                                            <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                <div className="flex items-center gap-2 mb-1 justify-inherit">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                                        {message.role === 'agent' ? (call.agent_name || 'AI Agent') : 'Customer'}
                                                    </span>
                                                    {message.timestamp != null && (
                                                        <span className="text-[10px] text-gray-400">{formatTime(message.timestamp)}</span>
                                                    )}
                                                </div>
                                                <div className={`inline-block px-4 py-3 rounded-2xl text-sm border ${message.role === 'agent'
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/50'
                                                    : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/50'
                                                    }`}>
                                                    <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Plain text transcript fallback */}
                        {transcript.length === 0 && (call?.transcript || summary?.transcript) && (
                            <div className={cardClass}>
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Transcript
                                </h2>
                                <p className="whitespace-pre-wrap leading-relaxed text-sm text-gray-700 dark:text-gray-300">
                                    {summary?.transcript || call?.transcript}
                                </p>
                            </div>
                        )}

                        {/* Action Items */}
                        {actionItems.length > 0 && (
                            <div className={cardClass}>
                                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    Action Items
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {actionItems.map((item, index) => {
                                        const text = typeof item === 'string' ? item : item.description;
                                        return (
                                            <div key={index} className="flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600">
                                                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                                    {index + 1}
                                                </div>
                                                <p className="text-sm font-medium">{text}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Metadata & Analytics */}
                    <div className="space-y-6">

                        {/* Sentiment Analysis */}
                        {sentiment && (
                            <div className={cardClass}>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-lg font-bold">Sentiment Analysis</h3>
                                    <Tooltip text="AI-analyzed emotional tone of the conversation. Shows how the customer felt throughout the call.">
                                        <HelpCircle className="w-4 h-4 cursor-help text-gray-400 dark:text-gray-500" />
                                    </Tooltip>
                                </div>

                                <div className={`p-4 rounded-xl border-2 ${sentiment === 'positive'
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/50'
                                    : sentiment === 'negative'
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/50'
                                        : 'bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600'
                                    }`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Overall</span>
                                        <SentimentIcon className={`w-5 h-5 ${sentimentColor}`} />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-2xl font-black ${sentimentColor}`}>
                                            {sentiment.toUpperCase()}
                                        </span>
                                        {sentimentScore != null && (
                                            <span className="text-xs text-gray-500 font-bold">{(sentimentScore * 100).toFixed(0)}%</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Call Metadata */}
                        <div className={sideCardClass}>
                            <h3 className="text-sm font-medium tracking-tight mb-6 text-gray-500 dark:text-gray-400">Call Information</h3>
                            <div className="space-y-5">
                                {/* Duration - Hero stat */}
                                <div className="text-center pb-5 border-b border-gray-100 dark:border-gray-700">
                                    <p className="text-4xl font-light tracking-tight text-gray-900 dark:text-white">
                                        {formatDuration(durationMs)}
                                    </p>
                                    <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Duration</p>
                                </div>

                                {/* Clean metadata rows */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Direction</span>
                                        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">{call.direction}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Type</span>
                                        <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                                            {call.call_type === 'ai_agent' ? 'AI Agent' : 'Human'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-500">Status</span>
                                        <span className={`text-sm font-medium capitalize ${call.status === 'completed' ? 'text-green-600' : 'text-gray-900 dark:text-white'}`}>{call.status}</span>
                                    </div>
                                    {displayPhone && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Phone</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{displayPhone}</span>
                                        </div>
                                    )}
                                    {call.agent_name && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Agent</span>
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{call.agent_name}</span>
                                        </div>
                                    )}
                                    {call.outcome && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">Outcome</span>
                                            <span className={`text-sm font-medium capitalize ${
                                                call.outcome === 'positive' ? 'text-green-600' :
                                                call.outcome === 'negative' ? 'text-red-600' :
                                                'text-gray-900 dark:text-white'
                                            }`}>{call.outcome}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Key Topics */}
                        {keyTopics.length > 0 && (
                            <div className={sideCardClass}>
                                <div className="flex items-center gap-2 mb-4">
                                    <h3 className="text-sm font-medium tracking-tight text-gray-500 dark:text-gray-400">Topics</h3>
                                    <Tooltip text="Main subjects discussed during the call, automatically extracted by AI.">
                                        <HelpCircle className="w-3 h-3 cursor-help text-gray-400 dark:text-gray-500" />
                                    </Tooltip>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {keyTopics.map((topic, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {call.tags && call.tags.length > 0 && (
                            <div className={sideCardClass}>
                                <h3 className="text-sm font-medium tracking-tight mb-4 text-gray-500 dark:text-gray-400">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {call.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800/30"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {call.notes && (
                            <div className={sideCardClass}>
                                <h3 className="text-sm font-medium tracking-tight mb-4 text-gray-500 dark:text-gray-400">Notes</h3>
                                <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{call.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <QuickAddCustomerModal
                isOpen={showQuickAddCustomer}
                onClose={() => setShowQuickAddCustomer(false)}
                onCustomerCreated={handleCustomerCreated}
                initialPhone={displayPhone}
            />
        </div>
    );
};



// Helper functions
const formatDuration = (ms: number) => {
    if (!ms || ms <= 0) return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const formatTime = (seconds: number) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};
