import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, Send, CreditCard, 
  FileText, Calendar, Clock, User, DollarSign, Star,
  Mail, AlertCircle, Check, X, MoreHorizontal, Copy, MapPin
} from 'lucide-react';
import { useInvoiceStore } from '../../stores/invoiceStore';
import { useAuthStore } from '../../stores/authStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { Invoice, InvoiceStatus } from '../../types/database.types';
import { toast } from 'react-hot-toast';
import InvoiceStatusBadge from '../../components/InvoiceStatusBadge';
import InvoiceStatusDropdown from '../../components/InvoiceStatusDropdown';
import MarkAsDropdown from '../../components/MarkAsDropdown';
import FeatureGate from '../../components/FeatureGate';
import { downloadInvoicePDF, printInvoicePDF } from '../../utils/pdfUtils';
import { sendInvoiceEmail, sendPaymentReminder } from '../../utils/emailUtils';

const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getInvoiceById, updateInvoiceStatus, deleteInvoice, loading, error } = useInvoiceStore();
  const { currentSubscription } = useSubscriptionStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderDays, setReminderDays] = useState(5);
  const [publicLink, setPublicLink] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const { user } = useAuthStore();
  
  // Check if user has access to premium features
  const hasPremiumAccess = 
    // Check if user is admin
    user?.email === 'maniksharmawork@gmail.com' ||
    // Or has premium subscription
    (currentSubscription?.plan_id && ['business', 'enterprise'].includes(currentSubscription.plan_id));

  // Premium feature click handler
  const handlePremiumFeature = (feature: string, plan: string) => {
    if (!hasPremiumAccess) {
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-dark-900/80 backdrop-blur-sm flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-dark-800 rounded-lg p-8 max-w-md m-4 relative transform scale-100 transition-all duration-200">
          <div class="text-center">
            <div class="bg-gradient-to-r from-primary-600 to-primary-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-white mb-2">Premium Feature</h3>
            <p class="text-gray-300 text-lg mb-2">${feature} is available on ${plan}</p>
            <p class="text-gray-400 mb-6">Upgrade to access AI-powered automation and advanced features</p>
            <a href="/settings?tab=billing" class="btn btn-primary bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 px-8 py-3 text-lg font-medium inline-block">
              Upgrade Now
            </a>
          </div>
          <button class="absolute top-4 right-4 text-gray-400 hover:text-white">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('button')) {
          modal.remove();
        }
      });
    }
  };

  useEffect(() => {
    if (id) {
      getInvoiceById(id)
        .then(data => {
          if (data) {
            setInvoice(data);
            if (data.customer_email) {
              setReminderEmail(data.customer_email);
            }
          } else {
            toast.error('Invoice not found');
            navigate('/invoices');
          }
        })
        .catch(err => {
          toast.error('Failed to load invoice details');
        });
    }
  }, [id, getInvoiceById, navigate]);
  
  const handleStatusChange = async (status: InvoiceStatus) => {
    if (!id || !invoice) return;
    
    // Check if trying to mark as paid without premium access
    if (status === 'Paid' && !hasPremiumAccess) {
      toast.error('Marking invoices as paid is a premium feature. Please upgrade to access this feature.');
      return;
    }
    
    try {
      const updatedInvoice = await updateInvoiceStatus(id, status);
      setInvoice(updatedInvoice);
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update invoice status');
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(id);
        toast.success('Invoice deleted successfully');
        navigate('/invoices');
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };
  
  const handleDuplicate = async () => {
    if (!id) return;
    
    try {
      const duplicatedInvoice = await duplicateInvoice(id);
      toast.success('Invoice duplicated successfully');
      navigate(`/invoices/${duplicatedInvoice.id}`);
    } catch (error) {
      toast.error('Failed to duplicate invoice');
    }
  };
  
  const handleDownloadPDF = () => {
    if (!invoice) return;
    downloadInvoicePDF(invoice);
    toast.success('Invoice PDF downloaded');
  };
  
  const handlePrintPDF = () => {
    if (!invoice) return;
    printInvoicePDF(invoice);
  };
  
  const handleSendEmail = async () => {
    if (!invoice) return;
    
    if (!invoice.customer_email) {
      toast.error('Customer email is not available');
      return;
    }
    
    const success = await sendInvoiceEmail(invoice, emailMessage, true);
    
    if (success) {
      toast.success('Invoice sent successfully');
      setShowEmailModal(false);
      setEmailMessage('');
      
      // If the invoice is in draft status, update it to issued
      if (invoice.status === 'Draft') {
        handleStatusChange('Issued');
      }
    } else {
      toast.error('Failed to send invoice');
    }
  };
  
  const handleSetupReminder = async () => {
    if (!invoice) return;
    
    if (!reminderEmail) {
      toast.error('Please enter an email address for the reminder');
      return;
    }

    try {
      const success = await sendPaymentReminder(invoice, reminderEmail, reminderDays);
      
      if (success) {
        toast.success('Payment reminder scheduled');
        setShowReminderModal(false);
      }
    } catch (error: any) {
      // Show specific error message if available
      toast.error(error.message || 'Failed to schedule payment reminder');
      
      // If error is about email settings, offer to redirect
      if (error.message.includes('configure your email settings')) {
        if (window.confirm('Would you like to configure your email settings now?')) {
          navigate('/settings?tab=email');
        }
      }
    }
  };
  
  const handleGeneratePublicLink = async () => {
    if (!id) return;
    
    try {
      const link = await generatePublicLink(id);
      setPublicLink(link);
      setShowLinkModal(true);
    } catch (error) {
      toast.error('Failed to generate public link');
    }
  };
  
  const handleGeneratePaymentLink = async () => {
    if (!id) return;
    
    try {
      const link = await generatePaymentLink(id);
      setPaymentLink(link);
      setShowPaymentLinkModal(true);
    } catch (error) {
      toast.error('Failed to generate payment link');
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard');
  };

  // Check if the invoice is overdue
  const isOverdue = invoice && new Date(invoice.due_date) < new Date() && invoice.status !== 'Paid';
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading invoice details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
        <Link to="/invoices" className="btn btn-primary mt-4">Back to Invoices</Link>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Invoice not found</p>
        <Link to="/invoices" className="btn btn-primary mt-4">Back to Invoices</Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/invoices" className="btn btn-secondary p-2">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white">Invoice {invoice.invoice_number}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <MarkAsDropdown 
            currentStatus={invoice.status} 
            onStatusChange={handleStatusChange}
          />
          
          <div className="relative">
            <button 
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="btn btn-secondary p-2"
            >
              <MoreHorizontal size={20} />
            </button>
            
            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-md shadow-lg py-1 z-10 border border-dark-700">
                <button 
                  onClick={() => {
                    setShowActionsMenu(false);
                    handleDuplicate();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-700"
                >
                  Duplicate Invoice
                </button>
                <button 
                  onClick={() => {
                    setShowActionsMenu(false);
                    handleDelete();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-700"
                >
                  Delete Invoice
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/invoices/${id}/edit`} className="btn btn-primary flex items-center space-x-2">
          <Edit size={16} />
          <span>Edit</span>
        </Link>
        <button 
          onClick={handlePrintPDF}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Printer size={16} />
          <span>Print</span>
        </button>
        <button 
          onClick={handleDownloadPDF}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <Download size={16} />
          <span>PDF</span>
        </button>
        <button 
          onClick={() => setShowEmailModal(true)}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={!invoice.customer_email}
          onClick={() => {
            if (!hasPremiumAccess) {
              handlePremiumFeature('Email to Customer', 'Business or Enterprise');
            } else {
              setShowEmailModal(true);
            }
          }}
        >
          <div className="relative flex items-center">
            <Send size={16} className="mr-2" />
            <span>Email to Customer</span>
            {!hasPremiumAccess && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute -top-2 -right-2" />
            )}
          </div>
        </button>
        <button 
          onClick={handleGeneratePaymentLink}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={!hasPremiumAccess}
          onClick={() => handlePremiumFeature('Payment Link', 'Business or Enterprise')}
        >
          <div className="relative flex items-center">
            <CreditCard size={16} className="mr-2" />
            <span>Payment Link</span>
            {!hasPremiumAccess && (
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute -top-2 -right-2" />
            )}
          </div>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice status card */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Invoice Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Invoice Date</p>
                <p className="text-white">{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Due Date</p>
                <p className="text-white">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            {invoice.status === 'Paid' && invoice.payment_date && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-400">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Payment Date</p>
                  <p className="text-white">{new Date(invoice.payment_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Amount</p>
                <p className="text-xl font-semibold text-white">${invoice.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Payment reminder section */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <h3 className="text-md font-medium text-white mb-2">Payment Reminder</h3>
            {isOverdue && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-3 py-2 rounded-md mb-3">
                <div className="flex items-center">
                  <AlertCircle size={16} className="mr-2" />
                  <span>This invoice is overdue</span>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-400 mb-3">
              Send an automatic reminder to the customer before the due date.
            </p>
            <button 
              onClick={() => setShowReminderModal(true)}
              className={`btn w-full ${
                !invoice?.customer_email || invoice?.status === 'Paid' || invoice?.status === 'Cancelled'
                  ? 'btn-secondary opacity-50 cursor-not-allowed'
                  : 'btn-primary'
              }`}
              disabled={!invoice?.customer_email || ['Paid', 'Cancelled'].includes(invoice?.status || '')}
            >
              {!invoice?.customer_email 
                ? 'No Email Available'
                : invoice?.status === 'Paid'
                ? 'Invoice Paid'
                : invoice?.status === 'Cancelled'
                ? 'Invoice Cancelled' 
                : 'Schedule Reminder'}
            </button>
            {!invoice?.customer_email && (
              <p className="mt-2 text-sm text-red-400">
                Customer email is required to schedule reminders
              </p>
            )}
          </div>
        </div>
        
        {/* Customer info */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Customer</p>
                <p className="text-white font-medium">{invoice?.customer_name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{invoice?.customer_email || 'No email provided'}</p>
              </div>
            </div>
            
            {invoice?.customer_address && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p className="text-white">{invoice?.customer_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Notes */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Notes</h2>
          <p className="text-gray-300">{invoice?.notes || 'No notes provided'}</p>
          
          {/* Attachments section */}
          <div className="mt-6 pt-6 border-t border-dark-700">
            <h3 className="text-md font-medium text-white mb-2">Attachments</h3>
            <p className="text-sm text-gray-400">
              No attachments
            </p>
          </div>
        </div>
      </div>
      
      {/* Invoice items */}
      <div className="card bg-dark-800 border border-dark-700">
        <h2 className="text-lg font-semibold text-white mb-4">Invoice Items</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Item</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {invoice?.items.map((item, index) => (
                <tr key={index} className="hover:bg-dark-700/50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-white">{item.description}</span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300 text-right">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-dark-700/50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Subtotal</td>
                <td className="px-4 py-3 text-right text-sm font-medium text-white">${invoice?.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-dark-700/50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                  Tax ({(invoice?.tax_rate || 0 * 100).toFixed(2)}%)
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-white">${invoice?.tax.toFixed(2)}</td>
              </tr>
              <tr className="bg-dark-700">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total</td>
                <td className="px-4 py-3 text-right text-base font-bold text-white">${invoice?.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Send Invoice to Customer</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                To
              </label>
              <input
                type="text"
                className="input"
                value={invoice.customer_email || ''}
                disabled
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                className="input"
                value={`Invoice ${invoice.invoice_number} from Your Company`}
                disabled
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Message (Optional)
              </label>
              <textarea
                className="input"
                rows={4}
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Add a personal message to the customer..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowEmailModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="btn btn-primary"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Schedule Payment Reminder</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Send reminder to
              </label>
              <input
                type="email"
                className="input"
                value={reminderEmail}
                onChange={(e) => setReminderEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Days before due date
              </label>
              <input
                type="number"
                className="input"
                value={reminderDays}
                onChange={(e) => setReminderDays(parseInt(e.target.value))}
                min={1}
                max={30}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReminderModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSetupReminder}
                className="btn btn-primary flex items-center space-x-1"
              >
                <span className="text-yellow-300">★</span>
                <span>Schedule reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Public Link Modal */}
      {showLinkModal && publicLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Public Invoice Link</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                Share this link with anyone to view the invoice. No account required.
              </p>
              <div className="flex">
                <input
                  type="text"
                  className="input rounded-r-none"
                  value={publicLink}
                  readOnly
                />
                <button
                  onClick={() => copyToClipboard(publicLink)}
                  className="btn btn-primary rounded-l-none"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowLinkModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Payment Link Modal */}
      {showPaymentLinkModal && paymentLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Payment Link</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                Share this link with your customer to allow them to pay the invoice online.
              </p>
              <div className="flex">
                <input
                  type="text"
                  className="input rounded-r-none"
                  value={paymentLink}
                  readOnly
                />
                <button
                  onClick={() => copyToClipboard(paymentLink)}
                  className="btn btn-primary rounded-l-none"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowPaymentLinkModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;