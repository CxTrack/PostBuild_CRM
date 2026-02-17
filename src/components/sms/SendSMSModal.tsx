import React, { useState, useEffect, useMemo } from 'react';
import { X, MessageSquare, Send, FileText, Edit3, AlertTriangle, Phone, Check } from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { smsService, substituteTemplateVars, type SMSTemplate } from '@/services/sms.service';
import { formatPhoneDisplay } from '@/utils/phone.utils';
import toast from 'react-hot-toast';

interface SendSMSModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerPhone?: string;
  customerName?: string;
  customerId?: string;
  preselectedTemplate?: string;
  context?: {
    stageName?: string;
    documentType?: string;
    documentId?: string;
  };
}

type TabType = 'templates' | 'custom';

const SendSMSModal: React.FC<SendSMSModalProps> = ({
  isOpen,
  onClose,
  customerPhone = '',
  customerName = '',
  customerId,
  preselectedTemplate,
  context,
}) => {
  const { currentOrganization } = useOrganizationStore();
  const [activeTab, setActiveTab] = useState<TabType>(preselectedTemplate ? 'templates' : 'custom');
  const [phone, setPhone] = useState(customerPhone);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasPhoneNumber, setHasPhoneNumber] = useState<boolean | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const industry = currentOrganization?.industry_template || 'general_business';
  const orgName = currentOrganization?.name || '';

  // Template variable substitution
  const templateVars: Record<string, string> = useMemo(() => ({
    customer_name: customerName,
    business_name: orgName,
    stage_name: context?.stageName || '',
    date: new Date().toLocaleDateString(),
    amount: '',
    ref: '',
    link: '',
  }), [customerName, orgName, context?.stageName]);

  useEffect(() => {
    if (!isOpen || !currentOrganization?.id) return;

    const init = async () => {
      setLoading(true);
      try {
        const [tmpl, hasNum] = await Promise.all([
          smsService.fetchTemplates(industry),
          smsService.hasPhoneNumber(currentOrganization.id),
        ]);
        setTemplates(tmpl);
        setHasPhoneNumber(hasNum);

        if (preselectedTemplate) {
          const found = tmpl.find(t => t.template_key === preselectedTemplate);
          if (found) {
            setSelectedTemplate(found);
            setActiveTab('templates');
          }
        }
      } catch (err) {
        console.error('Failed to load SMS data:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [isOpen, currentOrganization?.id, industry, preselectedTemplate]);

  useEffect(() => {
    setPhone(customerPhone);
  }, [customerPhone]);

  const categories = useMemo(() => {
    const cats = new Set(templates.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    if (filterCategory === 'all') return templates;
    return templates.filter(t => t.category === filterCategory);
  }, [templates, filterCategory]);

  const previewMessage = useMemo(() => {
    if (activeTab === 'custom') return customMessage;
    if (!selectedTemplate) return '';
    return substituteTemplateVars(selectedTemplate.body, templateVars);
  }, [activeTab, customMessage, selectedTemplate, templateVars]);

  const charCount = previewMessage.length;
  const segmentCount = charCount <= 160 ? 1 : Math.ceil(charCount / 153);

  const phoneValidation = useMemo(() => {
    if (!phone) return { valid: false, error: 'Phone number required' };
    return smsService.validatePhoneNumber(phone);
  }, [phone]);

  const canSend = phoneValidation.valid && previewMessage.trim().length > 0 && hasPhoneNumber;

  const handleSend = async () => {
    if (!canSend || !currentOrganization?.id) return;

    setSending(true);
    try {
      const result = await smsService.sendCustomSMS(
        currentOrganization.id,
        phone,
        previewMessage,
        {
          customerId,
          documentType: context?.documentType || (selectedTemplate ? 'custom' : 'custom'),
          documentId: context?.documentId,
          templateKey: selectedTemplate?.template_key,
          templateVariables: selectedTemplate ? templateVars : undefined,
        }
      );

      if (result.success) {
        toast.success('SMS sent successfully!');
        onClose();
      } else {
        toast.error(result.error || 'Failed to send SMS');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  };

  const formatCategoryLabel = (cat: string) => {
    return cat === 'all' ? 'All' : cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-500/20 rounded-lg">
              <MessageSquare size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Send SMS</h2>
              {customerName && (
                <p className="text-sm text-gray-500 dark:text-gray-400">to {customerName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* No phone number warning */}
        {hasPhoneNumber === false && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No phone number configured</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Set up a phone number in Settings &gt; Calls to send SMS messages.
              </p>
            </div>
          </div>
        )}

        {/* Phone input */}
        <div className="px-6 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Recipient Phone
          </label>
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
            />
            {phone && phoneValidation.valid && (
              <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
            )}
          </div>
          {phone && !phoneValidation.valid && (
            <p className="text-xs text-red-500 mt-1">{phoneValidation.error}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'templates'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <FileText size={14} />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Edit3 size={14} />
              Custom
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'templates' ? (
            <div className="space-y-3">
              {/* Category filter */}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                      filterCategory === cat
                        ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {formatCategoryLabel(cat)}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No templates available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((tmpl) => {
                    const preview = substituteTemplateVars(tmpl.body, templateVars);
                    const isSelected = selectedTemplate?.id === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(isSelected ? null : tmpl)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-green-500 bg-green-50 dark:bg-green-500/10 ring-1 ring-green-500'
                            : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{tmpl.name}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {formatCategoryLabel(tmpl.category)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{preview}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                placeholder="Type your message here..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Preview & char count */}
        {previewMessage && (
          <div className="px-6 pb-2">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Preview</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{previewMessage}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className={`text-xs ${charCount > 160 ? 'text-amber-600' : 'text-gray-500'}`}>
                {charCount} characters · {segmentCount} segment{segmentCount > 1 ? 's' : ''}
              </span>
              {charCount > 160 && (
                <span className="text-xs text-amber-600">Multi-segment SMS</span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={16} />
            {sending ? 'Sending...' : 'Send SMS'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendSMSModal;
