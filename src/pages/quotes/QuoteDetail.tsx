import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Printer, Download, Send, 
  FileText, Calendar, Clock, User, DollarSign, Mail, MapPin,
  Copy, Check, X
} from 'lucide-react';
import { useQuoteStore } from '../../stores/quoteStore';
import { Quote } from '../../types/database.types';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import QuoteStatusBadge from '../../components/QuoteStatusBadge';
import { downloadQuotePDF, printQuotePDF } from '../../utils/pdfUtils';
import { sendQuoteEmail } from '../../utils/emailUtils';

const QuoteDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuoteById, updateQuoteStatus, deleteQuote, loading, error } = useQuoteStore();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    if (id) {
      getQuoteById(id)
        .then(data => {
          if (data) {
            setQuote(data);
          } else {
            toast.error('Quote not found');
            navigate('/quotes');
          }
        })
        .catch(err => {
          toast.error('Failed to load quote details');
        });
    }
  }, [id, getQuoteById, navigate]);
  
  const handleStatusChange = async (status: 'Sent' | 'Accepted' | 'Declined' | 'Expired') => {
    if (!id || !quote) return;
    
    try {
      const updatedQuote = await updateQuoteStatus(id, status);
      setQuote(updatedQuote);
      toast.success(`Quote marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update quote status');
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!id) return;
    
    try {
      await deleteQuote(id);
      toast.success('Quote deleted successfully');
      navigate('/quotes');
    } catch (error) {
      toast.error('Failed to delete quote');
    }
  };
  
  const handleDownloadPDF = () => {
    if (!quote) return;
    downloadQuotePDF(quote);
    toast.success('Quote PDF downloaded');
  };
  
  const handlePrintPDF = () => {
    if (!quote) return;
    printQuotePDF(quote);
  };
  
  const handleSendEmail = async () => {
    if (!quote) return;
    
    if (!quote.customer_email) {
      toast.error('Customer email is not available');
      return;
    }
    
    const success = await sendQuoteEmail(quote, emailMessage, true);
    
    if (success) {
      toast.success('Quote sent successfully');
      setShowEmailModal(false);
      setEmailMessage('');
      
      // If the quote is in draft status, update it to sent
      if (quote.status === 'Draft') {
        handleStatusChange('Sent');
      }
    } else {
      toast.error('Failed to send quote');
    }
  };
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading quote details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-lg">{error}</p>
        <Link to="/quotes" className="btn btn-primary mt-4">Back to Quotes</Link>
      </div>
    );
  }
  
  if (!quote) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">Quote not found</p>
        <Link to="/quotes" className="btn btn-primary mt-4">Back to Quotes</Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center space-x-4">
        <Link to="/quotes" className="btn btn-secondary p-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-white">Quote {quote.quote_number}</h1>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link to={`/quotes/${id}/edit`} className="btn btn-primary flex items-center space-x-2">
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
        {/* <button 
          onClick={() => setShowEmailModal(true)}
          className="btn btn-secondary flex items-center space-x-2"
          disabled={!quote.customer_email}
        >
          <Send size={16} />
          <span>Send to Customer</span>
        </button> */}
        {quote.status === 'Draft' && (
          <button 
            onClick={() => handleStatusChange('Sent')}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Send size={16} />
            <span>Mark as Sent</span>
          </button>
        )}
        {quote.status === 'Sent' && (
          <>
            <button 
              onClick={() => handleStatusChange('Accepted')}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Check size={16} />
              <span>Mark as Accepted</span>
            </button>
            <button 
              onClick={() => handleStatusChange('Declined')}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X size={16} />
              <span>Mark as Declined</span>
            </button>
          </>
        )}
        <button 
          onClick={handleDelete}
          className="btn btn-danger flex items-center space-x-2"
        >
          <X size={16} />
          <span>Delete</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote status card */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Quote Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Quote Date</p>
                <p className="text-white">{new Date(quote.date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Expiry Date</p>
                <p className="text-white">{new Date(quote.expiry_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <DollarSign size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Amount</p>
                <p className="text-xl font-semibold text-white">${quote.total.toLocaleString()}</p>
              </div>
            </div>
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
                <p className="text-white font-medium">{quote.customer_name}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="text-gray-400">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{quote.customer_email || 'No email provided'}</p>
              </div>
            </div>
            
            {quote.customer_address && (
              <div className="flex items-start space-x-3">
                <div className="text-gray-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p className="text-white">{quote.customer_address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Notes and Message */}
        <div className="card bg-dark-800 border border-dark-700">
          <h2 className="text-lg font-semibold text-white mb-4">Notes & Message</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-md font-medium text-white mb-2">Message to Customer</h3>
              <p className="text-gray-300">{quote.message || 'No message provided'}</p>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-white mb-2">Notes</h3>
              <p className="text-gray-300">{quote.notes || 'No notes provided'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quote items */}
      <div className="card bg-dark-800 border border-dark-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quote Items</h2>
        
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
              {quote.items.map((item, index) => (
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
                <td className="px-4 py-3 text-right text-sm font-medium text-white">${quote.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-dark-700/50">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">
                  Tax ({(quote.tax_rate * 100).toFixed(2)}%)
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-white">${quote.tax.toFixed(2)}</td>
              </tr>
              <tr className="bg-dark-700">
                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-300">Total</td>
                <td className="px-4 py-3 text-right text-base font-bold text-white">${quote.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Send Quote to Customer</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                To
              </label>
              <input
                type="text"
                className="input"
                value={quote.customer_email || ''}
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
                value={`Quote ${quote.quote_number} from Your Company`}
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete item?"
        message="Are you sure?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
        isDanger={true}
      />
    </div>
  );
};

export default QuoteDetail;