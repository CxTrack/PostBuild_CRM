import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useThemeStore } from '@/stores/themeStore';
import { Card, Button, Badge, Modal } from '@/components/theme/ThemeComponents';
import {
    Building2,
    Phone,
    Star,
    Clock,
    Plus,
    Edit
} from 'lucide-react';

interface Lender {
    id: string;
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    account_executive: string;
    ae_phone: string;
    ae_email: string;
    loan_types: string[];
    is_preferred: boolean;
    avg_turn_time_days: number;
    rating: number;
}

export const LenderDirectory: React.FC = () => {
    const { currentOrganization } = useOrganizationStore();
    const { theme } = useThemeStore();
    const [lenders, setLenders] = useState<Lender[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (currentOrganization?.id) {
            fetchLenders();
        }
    }, [currentOrganization]);

    const fetchLenders = async () => {
        if (!currentOrganization?.id) return;

        const { data, error } = await supabase
            .from('lenders')
            .select('*')
            .eq('organization_id', currentOrganization.id)
            .order('is_preferred', { ascending: false })
            .order('rating', { ascending: false });

        if (!error && data) {
            setLenders(data);
        }
        setLoading(false);
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <Star
                key={i}
                size={14}
                className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}
            />
        ));
    };

    // Theme-aware text colors
    const textPrimary = theme === 'soft-modern'
        ? 'text-slate-900'
        : 'text-gray-900 dark:text-white';

    const textSecondary = theme === 'soft-modern'
        ? 'text-slate-600'
        : 'text-gray-600 dark:text-gray-400';

    const textMuted = theme === 'soft-modern'
        ? 'text-slate-500'
        : 'text-gray-500 dark:text-gray-500';

    if (loading) {
        return (
            <div className={`animate-pulse ${textSecondary}`}>
                Loading lenders...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${textPrimary}`}>
                        Lender Directory
                    </h2>
                    <p className={textSecondary}>
                        Manage your lender relationships
                    </p>
                </div>
                <Button variant="primary" onClick={() => setShowForm(true)}>
                    <Plus size={18} className="mr-2" />
                    Add Lender
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lenders.map((lender) => (
                    <Card
                        key={lender.id}
                        hover
                        className={lender.is_preferred ? 'ring-2 ring-yellow-400' : ''}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${lender.is_preferred
                                    ? 'bg-yellow-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30'
                                    }`}>
                                    <Building2
                                        className={lender.is_preferred ? 'text-white' : 'text-blue-600 dark:text-blue-400'}
                                        size={20}
                                    />
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${textPrimary}`}>
                                        {lender.name}
                                    </h3>
                                    {lender.is_preferred && (
                                        <Badge variant="warning">Preferred</Badge>
                                    )}
                                </div>
                            </div>
                            <button
                                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
                            >
                                <Edit size={14} className={textMuted} />
                            </button>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            {lender.account_executive && (
                                <div className={textSecondary}>
                                    <span className="font-medium">AE:</span> {lender.account_executive}
                                </div>
                            )}
                            {lender.ae_phone && (
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <Phone size={12} />
                                    <a
                                        href={`tel:${lender.ae_phone}`}
                                        className="hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                        {lender.ae_phone}
                                    </a>
                                </div>
                            )}
                            {lender.avg_turn_time_days && (
                                <div className={`flex items-center gap-2 ${textMuted}`}>
                                    <Clock size={12} />
                                    <span>Avg: {lender.avg_turn_time_days} days</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                {renderStars(lender.rating || 0)}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {lender.loan_types?.slice(0, 2).map((type) => (
                                    <Badge key={type} variant="default">
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {lenders.length === 0 && (
                <Card className="text-center py-12">
                    <Building2 className={`mx-auto mb-4 ${textMuted}`} size={48} />
                    <h3 className={`text-lg font-medium ${textSecondary}`}>
                        No lenders yet
                    </h3>
                    <p className={`mb-4 ${textMuted}`}>
                        Add your first lender to start tracking relationships
                    </p>
                    <Button variant="primary" onClick={() => setShowForm(true)}>
                        Add First Lender
                    </Button>
                </Card>
            )}

            {/* Form Modal (Placeholder for now) */}
            <Modal
                isOpen={showForm}
                onClose={() => setShowForm(false)}
                title="Add New Lender"
            >
                <div className="p-4 text-center">
                    <p className={textSecondary}>Lender management form integration in progress...</p>
                    <Button className="mt-4" onClick={() => setShowForm(false)}>Close</Button>
                </div>
            </Modal>
        </div>
    );
};

export default LenderDirectory;
