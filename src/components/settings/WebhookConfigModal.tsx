import { useState, useEffect } from 'react';
import { X, Loader2, Globe, CheckCircle, Code } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { webhookService, Webhook } from '@/services/webhook.service';
import toast from 'react-hot-toast';

interface WebhookConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    webhook?: Webhook; // If provided, we are editing
    onSaved: () => void;
}

const AVAILABLE_EVENTS = [
    { id: 'customer.created', label: 'Customer Created' },
    { id: 'customer.updated', label: 'Customer Updated' },
    { id: 'deal.created', label: 'Deal Created' },
    { id: 'deal.updated', label: 'Deal Updated' },
    { id: 'invoice.created', label: 'Invoice Created' },
    { id: 'invoice.paid', label: 'Invoice Paid' },
    { id: 'quote.created', label: 'Quote Created' },
    { id: 'quote.accepted', label: 'Quote Accepted' },
];

export const WebhookConfigModal = ({ isOpen, onClose, organizationId, webhook, onSaved }: WebhookConfigModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        url: '',
        events: [] as string[],
        is_active: true
    });

    useEffect(() => {
        if (webhook) {
            setFormData({
                url: webhook.url,
                events: webhook.events,
                is_active: webhook.is_active
            });
        } else {
            setFormData({
                url: '',
                events: [],
                is_active: true
            });
        }
    }, [webhook, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.url) {
            toast.error('URL is required');
            return;
        }
        if (formData.events.length === 0) {
            toast.error('At least one event must be selected');
            return;
        }

        try {
            setLoading(true);
            if (webhook) {
                await webhookService.updateWebhook(webhook.id, formData);
                toast.success('Webhook updated successfully');
            } else {
                await webhookService.createWebhook(organizationId, formData);
                toast.success('Webhook created successfully');
            }
            onSaved();
            onClose();
        } catch (error) {
            toast.error('Failed to save webhook');
        } finally {
            setLoading(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.includes(eventId)
                ? prev.events.filter(id => id !== eventId)
                : [...prev.events, eventId]
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {webhook ? 'Edit Webhook' : 'Add Webhook'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Payload URL
                        </label>
                        <Input
                            type="url"
                            placeholder="https://your-server.com/webhook"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="font-mono text-sm"
                            required
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            The URL we should send event payloads to.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Events to monitor
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {AVAILABLE_EVENTS.map(event => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => toggleEvent(event.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${formData.events.includes(event.id)
                                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                                            : 'border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${formData.events.includes(event.id) ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 dark:border-gray-600'
                                        }`}>
                                        {formData.events.includes(event.id) && <CheckCircle size={12} />}
                                    </div>
                                    <span className="text-xs font-medium">{event.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Code className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">Webhook Security</p>
                            <p className="text-[10px] text-gray-500">Payloads will be signed with a secret key for validation.</p>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-1">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (webhook ? 'Update Webhook' : 'Create Webhook')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
