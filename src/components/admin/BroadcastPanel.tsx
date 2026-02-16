import { useState, useEffect, useCallback } from 'react';
import {
    Send, Clock, X,
    RefreshCw, FileText, Plus,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// Direct fetch helper (AbortController workaround)
const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* ignore */ }
    }
  }
  return null;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    type: string;
    is_dismissible: boolean;
    created_at: string;
    expires_at: string;
}

const TEMPLATES = [
    { id: 't1', name: 'Maintenance Notice', title: 'Scheduled Maintenance', message: 'We will be performing scheduled maintenance on [DATE] from [TIME] to [TIME]. During this period, the service may be temporarily unavailable.', priority: 'high' as const },
    { id: 't2', name: 'New Feature', title: 'New Feature Available', message: "We're excited to announce [FEATURE NAME]! Check it out in your dashboard.", priority: 'normal' as const },
    { id: 't3', name: 'Security Alert', title: 'Important Security Notice', message: 'For your security, please [ACTION]. If you have any questions, contact support.', priority: 'urgent' as const },
    { id: 't4', name: 'Holiday Notice', title: 'Holiday Schedule', message: 'Our offices will be closed on [DATE]. We will resume normal operations on [DATE].', priority: 'low' as const },
];

export const BroadcastPanel = () => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [broadcastType, setBroadcastType] = useState('site_wide');
    const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
    const [expiresIn, setExpiresIn] = useState(24);
    const [activeTab, setActiveTab] = useState<'compose' | 'history' | 'templates'>('compose');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sending, setSending] = useState(false);

    const loadBroadcasts = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const token = getAuthToken();
            if (!token) return;
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/broadcasts?order=created_at.desc&limit=50`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                setBroadcasts(data || []);
            }
        } catch {
            // Silently fail
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        loadBroadcasts();
    }, [loadBroadcasts]);

    const sendBroadcast = async () => {
        if (!title.trim() || !message.trim()) {
            toast.error('Please enter a title and message');
            return;
        }

        setSending(true);
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + expiresIn);

        try {
            const token = getAuthToken();
            if (!token) throw new Error('Not authenticated');

            const res = await fetch(`${SUPABASE_URL}/rest/v1/broadcasts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${token}`,
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    title,
                    message,
                    priority,
                    type: broadcastType,
                    expires_at: expiresAt.toISOString(),
                    is_dismissible: true,
                }),
            });

            if (!res.ok) throw new Error('Insert failed');

            toast.success('Broadcast sent successfully');
            setTitle('');
            setMessage('');
            setPriority('normal');
            setBroadcastType('site_wide');
            loadBroadcasts();
        } catch {
            toast.error('Failed to send broadcast');
        } finally {
            setSending(false);
        }
    };

    const applyTemplate = (template: typeof TEMPLATES[0]) => {
        setTitle(template.title);
        setMessage(template.message);
        setPriority(template.priority);
        setActiveTab('compose');
        toast.success(`Template "${template.name}" applied`);
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getBroadcastStatus = (b: Broadcast): 'active' | 'expired' => {
        return new Date(b.expires_at) > new Date() ? 'active' : 'expired';
    };

    const filteredBroadcasts = broadcasts.filter(b => {
        const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase());
        const status = getBroadcastStatus(b);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const priorityColors = {
        low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        normal: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        high: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        urgent: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
                {[
                    { id: 'compose', label: 'Compose', icon: Plus },
                    { id: 'history', label: 'History', icon: Clock },
                    { id: 'templates', label: 'Templates', icon: FileText },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    {activeTab === 'compose' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                                    <Send className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Quick Broadcast</h3>
                                    <p className="text-xs text-gray-500">Send to all users</p>
                                </div>
                            </div>

                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Broadcast title..."
                                className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500/50"
                            />

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Your message..."
                                rows={3}
                                className="w-full px-3 py-2.5 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none resize-none focus:ring-2 focus:ring-blue-500/50"
                            />

                            <div className="flex items-center gap-2 flex-wrap">
                                <select value={broadcastType} onChange={(e) => setBroadcastType(e.target.value)}
                                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0">
                                    <option value="site_wide">Everyone</option>
                                    <option value="organization">Organization</option>
                                    <option value="user_specific">Specific User</option>
                                </select>

                                <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}
                                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0">
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>

                                <select value={expiresIn} onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                                    className="px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0">
                                    <option value="1">1 hour</option>
                                    <option value="6">6 hours</option>
                                    <option value="24">24 hours</option>
                                    <option value="72">3 days</option>
                                    <option value="168">1 week</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <button onClick={sendBroadcast} disabled={sending}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                                    <Send className="w-4 h-4" />
                                    {sending ? 'Sending...' : 'Send Now'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Quick Templates</h3>
                            {TEMPLATES.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template)}
                                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${priorityColors[template.priority]}`}>
                                            {template.priority}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{template.message}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="lg:hidden text-center py-4">
                            <p className="text-sm text-gray-500">Scroll down for broadcast history.</p>
                        </div>
                    )}
                </div>

                {/* Right Panel - History */}
                <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search broadcasts..."
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500" />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 border-0">
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="expired">Expired</option>
                            </select>
                            <button onClick={loadBroadcasts} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" title="Refresh">
                                <RefreshCw className={`w-4 h-4 text-gray-400 ${loadingHistory ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                        {loadingHistory && broadcasts.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-400">
                                <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-30" />
                                <p className="text-sm">Loading broadcasts...</p>
                            </div>
                        )}

                        {filteredBroadcasts.map(broadcast => {
                            const status = getBroadcastStatus(broadcast);
                            return (
                                <div key={broadcast.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{broadcast.title}</h4>
                                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${priorityColors[broadcast.priority]}`}>
                                                    {broadcast.priority}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                                    status === 'active'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                                }`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-1 mb-2">{broadcast.message}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(broadcast.created_at)}
                                                </span>
                                                <span>Expires: {new Date(broadcast.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {!loadingHistory && filteredBroadcasts.length === 0 && (
                            <div className="px-4 py-8 text-center text-gray-400">
                                <Send className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">No broadcasts found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
