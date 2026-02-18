import { X, ExternalLink, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface ZapierIntegrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    organizationId: string;
}

export const ZapierIntegrationModal = ({ isOpen, onClose, organizationId }: ZapierIntegrationModalProps) => {
    if (!isOpen) return null;

    const zapierUrl = `https://zapier.com/apps/cxtrack/integrations?org_id=${organizationId}`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Zapier Integration
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-center gap-8 py-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-sm">
                                <img src="/cx-icon.png" alt="CxTrack" className="w-10 h-10 object-contain" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500">CxTrack</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="h-[2px] w-12 bg-gray-200 dark:bg-gray-700 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 p-1">
                                    <ArrowRight size={14} className="text-gray-400" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-2xl border-2 border-orange-100 dark:border-orange-900/30 flex items-center justify-center shadow-sm">
                                <Zap className="w-10 h-10 text-orange-500" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500">Zapier</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 dark:text-white">What can you do with Zapier?</h4>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                'Sync customers with Google Sheets or Airtable',
                                'Create tasks in Trello/Asana from new leads',
                                'Send Slack notifications for new deals',
                                'Register webinar attendees from bookings'
                            ].map((feature, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl">
                        <p className="text-xs text-orange-800 dark:text-orange-300 leading-relaxed text-center">
                            Connect CxTrack to 6,000+ apps. You'll need your <strong>API Key</strong> to authorize the connection in Zapier.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Maybe Later
                        </Button>
                        <Button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white gap-2" onClick={() => window.open(zapierUrl, '_blank')}>
                            Connect Now <ExternalLink size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
