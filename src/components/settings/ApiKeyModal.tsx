import { useState } from 'react';
import { X, Loader2, Key, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { apiKeyService } from '@/services/apiKey.service';
import toast from 'react-hot-toast';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
    onCreated: () => void;
}

export const ApiKeyModal = ({ isOpen, onClose, organizationId, onCreated }: ApiKeyModalProps) => {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            toast.error('Name is required');
            return;
        }

        try {
            setLoading(true);
            const { key } = await apiKeyService.createApiKey(organizationId, name);
            setGeneratedKey(key);
            onCreated();
            toast.success('API key generated successfully');
        } catch (error) {
            toast.error('Failed to generate API key');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setCopied(true);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {generatedKey ? 'API Key Generated' : 'New API Key'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {!generatedKey ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Key Name
                                </label>
                                <Input
                                    placeholder="e.g. Production Mobile App"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Use a descriptive name to identify where this key is used.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Key'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                                <p className="text-xs font-bold text-yellow-800 dark:text-yellow-200 mb-1">Important Security Warning</p>
                                <p className="text-[10px] text-yellow-700 dark:text-yellow-300">
                                    This key will only be shown once. Please copy it and store it securely. You won't be able to see it again.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Your API Key
                                </label>
                                <div className="relative group">
                                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-mono text-sm break-all">
                                        <span className="flex-1 select-all">
                                            {showKey ? generatedKey : '•'.repeat(generatedKey.length - 8) + generatedKey.slice(-8)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setShowKey(!showKey)}
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
                                                title={showKey ? 'Hide key' : 'Show key'}
                                            >
                                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                            <button
                                                onClick={copyToClipboard}
                                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500"
                                                title="Copy to clipboard"
                                            >
                                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={onClose} className="w-full py-3 text-lg">
                                I've stored the key securely
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
