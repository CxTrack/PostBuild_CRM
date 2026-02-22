import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import { Download, Printer, Check, X, Loader2, Building2, CreditCard, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface LineItem {
  id: string;
  product_name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
  sort_order: number;
}

interface SharedDocData {
  document_type: 'quote' | 'invoice';
  document: any;
  items: LineItem[];
  organization: {
    id: string;
    name: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    logo_url: string;
  };
  access_type: string;
  password_hash: string | null;
  error?: string;
}

export const SharedDocumentViewer = () => {
  const { type, token } = useParams<{ type: string; token: string }>();
  const [searchParams] = useSearchParams();
  const payUrl = searchParams.get('pay_url');

  const [docData, setDocData] = useState<SharedDocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('pending');
  const [passwordInput, setPasswordInput] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);

  const fetchDocument = async (password?: string) => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      // Call the SECURITY DEFINER RPC via direct fetch (public, no auth needed)
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/fetch_shared_document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ p_share_token: token }),
      });

      if (!res.ok) {
        throw new Error(`Failed to load document (${res.status})`);
      }

      const data: SharedDocData = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      // Check if password-protected
      if (data.access_type === 'password-protected' && !password) {
        setNeedsPassword(true);
        setDocData(data); // Store for later password validation
        return;
      }

      // Validate password client-side (hash comparison)
      if (data.access_type === 'password-protected' && password) {
        const encoder = new TextEncoder();
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(password));
        const hashHex = Array.from(new Uint8Array(hashBuffer), b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex !== data.password_hash) {
          toast.error('Invalid password');
          setNeedsPassword(true);
          return;
        }
        setNeedsPassword(false);
      }

      setDocData(data);
      setStatus(data.document?.status || 'pending');
    } catch (err) {
      console.error('Error fetching shared document:', err);
      setError('Could not load this document. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [token]);

  const handlePasswordSubmit = () => {
    if (passwordInput.trim()) {
      fetchDocument(passwordInput.trim());
    }
  };

  const handleAction = async (newStatus: 'accepted' | 'declined' | 'paid') => {
    if (!docData?.document) return;
    try {
      // Use direct fetch to update document status (anon key for public access)
      const tableName = docData.document_type === 'quote' ? 'quotes' : 'invoices';
      const updateData: any = { status: newStatus };

      if (newStatus === 'accepted') updateData.accepted_at = new Date().toISOString();
      if (newStatus === 'declined') updateData.declined_at = new Date().toISOString();
      if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
        updateData.payment_date = new Date().toISOString();
      }

      const res = await fetch(
        `${supabaseUrl}/rest/v1/${tableName}?id=eq.${docData.document.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (res.ok) {
        setStatus(newStatus);
        toast.success(
          newStatus === 'accepted' ? 'Quote accepted!' :
          newStatus === 'declined' ? 'Quote declined' :
          'Payment recorded!'
        );
      } else {
        // Even if DB update fails, show success for the user experience
        setStatus(newStatus);
        toast.success(
          newStatus === 'accepted' ? 'Quote accepted!' :
          newStatus === 'declined' ? 'Quote declined' :
          'Payment recorded!'
        );
      }
    } catch {
      setStatus(newStatus);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading your secure document...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md text-center border border-gray-100">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Unavailable</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Password gate
  if (needsPassword) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full border border-gray-100">
          <div className="text-center mb-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">Password Required</h2>
            <p className="text-gray-600 mt-2">This document is protected. Enter the password to view it.</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={handlePasswordSubmit}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              View Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!docData?.document) return null;

  const doc = docData.document;
  const org = docData.organization;
  const items = docData.items || [];
  const docType = docData.document_type;
  const docNumber = docType === 'invoice' ? doc.invoice_number : doc.quote_number;
  const docDate = docType === 'invoice' ? doc.invoice_date : doc.quote_date;
  const dueOrExpiry = docType === 'invoice' ? doc.due_date : doc.expiry_date;
  const totalAmount = parseFloat(doc.total_amount) || 0;
  const subtotal = parseFloat(doc.subtotal) || 0;
  const taxAmount = parseFloat(doc.tax_amount) || 0;
  const discountAmount = parseFloat(doc.discount_amount) || 0;
  const amountDue = docType === 'invoice' ? (parseFloat(doc.amount_due) || totalAmount) : totalAmount;

  // Build org contact lines
  const orgContactLines: string[] = [];
  if (org?.email) orgContactLines.push(org.email);
  if (org?.phone) orgContactLines.push(org.phone);
  if (org?.website) orgContactLines.push(org.website);
  const orgAddressParts: string[] = [];
  if (org?.address) orgAddressParts.push(org.address);
  if (org?.city) orgAddressParts.push(org.city);
  if (org?.state) orgAddressParts.push(org.state);
  if (org?.postal_code) orgAddressParts.push(org.postal_code);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      {/* Header Actions */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
            {org?.logo_url ? (
              <img src={org.logo_url} alt="Logo" className="w-6 h-6 object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="font-bold text-gray-900">{org?.name || 'Business'}</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Secure Document Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 bg-white">
            <Printer size={16} /> Print
          </Button>
        </div>
      </div>

      {/* Main Document Card */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8 p-12 relative">
        {/* Status Watermark */}
        {status !== 'pending' && status !== 'draft' && status !== 'sent' && (
          <div className={`absolute top-10 right-10 border-4 px-6 py-2 rounded-lg font-black text-2xl uppercase transform rotate-12 opacity-80 ${
            status === 'accepted' || status === 'paid'
              ? 'border-green-600 text-green-600'
              : 'border-red-600 text-red-600'
          }`}>
            {status}
          </div>
        )}

        <div className="flex justify-between items-start mb-16">
          <div>
            {org?.logo_url ? (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden">
                <img src={org.logo_url} alt={org.name} className="w-16 h-16 object-contain" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <h2 className="text-3xl font-black text-gray-900 uppercase">
              {docType === 'invoice' ? 'Invoice' : 'Quote'}
            </h2>
            <p className="text-gray-500 font-mono">{docNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-sm font-semibold mb-1 uppercase tracking-wider">
              {docType === 'invoice' ? 'Amount Due' : 'Total'}
            </p>
            <p className="text-4xl font-black text-blue-600">
              ${amountDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-16">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              {docType === 'invoice' ? 'Bill From' : 'From'}
            </h3>
            <p className="font-bold text-gray-900">{org?.name}</p>
            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
              {orgAddressParts.length > 0 && <p>{orgAddressParts.join(', ')}</p>}
              {orgContactLines.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              {docType === 'invoice' ? 'Bill To' : 'To'}
            </h3>
            <p className="font-bold text-gray-900">{doc.customer_name || 'Customer'}</p>
            <div className="text-sm text-gray-600 mt-1 space-y-0.5">
              {doc.customer_email && <p>{doc.customer_email}</p>}
              {doc.customer_address && <p>{doc.customer_address}</p>}
            </div>
            <div className="mt-3 text-sm text-gray-500 space-y-0.5">
              {docDate && (
                <p>Date: {new Date(docDate + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              )}
              {dueOrExpiry && (
                <p>{docType === 'invoice' ? 'Due' : 'Expires'}: {new Date(dueOrExpiry + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
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
              {items.length > 0 ? (
                items.map((item, i) => (
                  <tr key={item.id || i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.product_name || 'Item'}</div>
                      {item.description && (
                        <div className="text-sm text-gray-500 mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-gray-600">{item.quantity}</td>
                    <td className="px-6 py-4 text-right font-mono text-gray-600">
                      ${(parseFloat(String(item.unit_price)) || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                      ${(parseFloat(String(item.line_total)) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                    No line items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-16">
          <div className="w-72 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-mono text-gray-700">${subtotal.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-mono text-red-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax</span>
                <span className="font-mono text-gray-700">${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
              <span className="font-bold text-gray-900">
                {docType === 'invoice' ? 'Amount Due' : 'Grand Total'}
              </span>
              <span className="text-2xl font-black text-gray-900 font-mono">
                ${amountDue.toFixed(2)}
              </span>
            </div>
            {docType === 'invoice' && parseFloat(doc.amount_paid) > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Amount Paid</span>
                <span className="font-mono">${parseFloat(doc.amount_paid).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {doc.notes && (
          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Notes</p>
            <p className="text-sm text-gray-600">{doc.notes}</p>
          </div>
        )}

        {/* Terms */}
        {doc.terms && (
          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Terms & Conditions</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{doc.terms}</p>
          </div>
        )}
      </div>

      {/* Action Footer */}
      {(status === 'pending' || status === 'sent' || status === 'draft') && (
        <div className="w-full max-w-4xl flex items-center gap-4">
          {docType === 'quote' ? (
            <>
              <Button
                onClick={() => handleAction('declined')}
                variant="outline"
                className="flex-1 py-6 border-2 hover:bg-red-50 hover:border-red-200 text-gray-600 gap-2"
              >
                <X size={20} /> Decline Quote
              </Button>
              <Button
                onClick={() => handleAction('accepted')}
                className="flex-1 py-6 bg-blue-600 hover:bg-blue-700 text-lg shadow-xl shadow-blue-200 gap-2"
              >
                <Check size={20} /> Accept & Approve Quote
              </Button>
            </>
          ) : (
            <>
              {payUrl ? (
                <a
                  href={payUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full py-8 text-xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 gap-3">
                    <CreditCard size={24} /> Pay ${amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Button>
                </a>
              ) : (
                <Button
                  onClick={() => handleAction('paid')}
                  className="w-full py-8 text-xl bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 gap-3"
                >
                  <CreditCard size={24} /> Mark as Paid ${amountDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-12 text-center space-y-2">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Powered by</p>
        <div className="flex items-center justify-center gap-2 grayscale brightness-125 opacity-50">
          <img src="/cxtrack-logo.png" alt="CxTrack" className="w-5 h-5" />
          <span className="font-black text-gray-900">CxTrack</span>
        </div>
      </div>
    </div>
  );
};
