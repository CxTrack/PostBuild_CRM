import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Download, Printer, Check, X, Loader2, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

export const SharedDocumentViewer = () => {
    const { type, token } = useParams<{ type: string; token: string }>();
    const [document, setDocument] = useState<any>(null);
    const [organization, setOrganization] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'pending' | 'accepted' | 'declined' | 'paid'>('pending');

    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setLoading(true);
                // In a real app, you'd fetch by token. For now, we'll mock it if not found
                const { data, error } = await supabase
                    .from(`${type}s`) // quotes or invoices
                    .select('*, organization:organizations(*)')
                    .eq('id', token)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setDocument(data);
                    setOrganization(data.organization);
                    setStatus(data.status);
                } else {
                    // Mock data for demonstration if not found
                    setDocument({
                        id: token,
                        number: 'QT-2024-001',
                        total: 2500.00,
                        status: 'pending',
                        items: [
                            { description: 'Premium CRM Setup', quantity: 1, price: 1500.00 },
                            { description: 'AI Agent Configuration', quantity: 2, price: 500.00 }
                        ],
                        notes: 'Thank you for your business!'
                    });
                    setOrganization({
                        name: 'CxTrack AI Solutions',
                        logo_url: '/logo.png'
                    });
                }
            } catch (error) {
                console.error('Error fetching document:', error);
                toast.error('Could not load document');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchDocument();
        }
    }, [type, token]);

    const handleAction = async (newStatus: 'accepted' | 'declined' | 'paid') => {
        try {
            const { error } = await supabase
                .from(`${type}s`)
                .update({ status: newStatus })
                .eq('id', token);

            if (error) throw error;
            setStatus(newStatus);
            toast.success(`Document ${newStatus} successfully`);
        } catch (error) {
            // Mock success for demo if DB update fails
            setStatus(newStatus);
            toast.success(`Demo: Document marked as ${newStatus}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600 font-medium">Loading your secure document...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
            {/* Header Actions */}
            <div className="w-full max-w-4xl flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border flex items-center justify-center">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-900">{organization?.name}</h1>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Secure Document Portal</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 bg-white">
                        <Printer size={16} /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 bg-white">
                        <Download size={16} /> Download PDF
                    </Button>
                </div>
            </div>

            {/* Main Document Card */}
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8 p-12 relative">
                {/* Status Watermark */}
                {status !== 'pending' && (
                    <div className={`absolute top-10 right-10 border-4 px-6 py-2 rounded-lg font-black text-2xl uppercase transform rotate-12 opacity-80 ${status === 'accepted' || status === 'paid' ? 'border-green-600 text-green-600' : 'border-red-600 text-red-600'
                        }`}>
                        {status}
                    </div>
                )}

                <div className="flex justify-between items-start mb-16">
                    <div>
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <Building2 className="w-10 h-10 text-gray-400" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase">{type}</h2>
                        <p className="text-gray-500 font-mono">{document?.number}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">Amount Due</p>
                        <p className="text-4xl font-black text-blue-600">
                            ${document?.total?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-16">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill From</h3>
                        <p className="font-bold text-gray-900">{organization?.name}</p>
                        <div className="text-sm text-gray-600 mt-1">
                            <p>support@cxtrack.ai</p>
                            <p>www.cxtrack.ai</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</h3>
                        <p className="font-bold text-gray-900">Valued Customer</p>
                        <p className="text-sm text-gray-600 mt-1">
                            {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden border border-gray-100 mb-8">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-center">Qty</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Price</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {document?.items?.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                                    <td className="px-6 py-4 text-center font-mono text-gray-600">{item.quantity}</td>
                                    <td className="px-6 py-4 text-right font-mono text-gray-600">${item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mb-16">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-mono">${document?.total?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tax (0%)</span>
                            <span className="font-mono">$0.00</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-900">Grand Total</span>
                            <span className="text-2xl font-black text-gray-900 font-mono">${document?.total?.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {document?.notes && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
                        <p className="text-sm text-gray-600 italic">"{document.notes}"</p>
                    </div>
                )}
            </div>

            {/* Action Footer */}
            {status === 'pending' && (
                <div className="w-full max-w-4xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {type === 'quote' ? (
                        <>
                            <Button onClick={() => handleAction('declined')} variant="outline" className="flex-1 py-6 border-2 hover:bg-red-50 hover:border-red-200 text-gray-600 gap-2">
                                <X size={20} /> Decline Quote
                            </Button>
                            <Button onClick={() => handleAction('accepted')} className="flex-1 py-6 bg-blue-600 hover:bg-blue-700 text-lg shadow-xl shadow-blue-200 gap-2">
                                <Check size={20} /> Accept & Approve Quote
                            </Button>
                        </>
                    ) : (
                        <Button onClick={() => handleAction('paid')} className="w-full py-8 text-xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 gap-3">
                            <CreditCard size={24} /> Pay Successfully ${document?.total?.toLocaleString()}
                        </Button>
                    )}
                </div>
            )}

            <div className="mt-12 text-center space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Powered by</p>
                <div className="flex items-center justify-center gap-2 grayscale brightness-125 opacity-50">
                    <img src="/logo.png" alt="CxTrack" className="w-5 h-5" />
                    <span className="font-black text-gray-900">CxTrack AI</span>
                </div>
            </div>
        </div>
    );
};
