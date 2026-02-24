import { useEffect, useState } from 'react';
import {
  MessageSquare, Save, Loader2, Power, PowerOff, Sparkles, Brain,
  X, Plus, Info, MessageCircle, Phone, FileText, Zap
} from 'lucide-react';
import { useSmsAgentStore, TONE_DESCRIPTIONS } from '@/stores/smsAgentStore';
import type { AgentTone } from '@/stores/voiceAgentStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { INDUSTRY_OPTIONS } from '@/stores/voiceAgentStore';
import toast from 'react-hot-toast';

interface FormData {
  agent_name: string;
  agent_tone: AgentTone;
  business_name: string;
  industry: string;
  business_description: string;
  common_inquiry_types: string[];
  suggestions_enabled: boolean;
  auto_draft_enabled: boolean;
  call_summary_sms_enabled: boolean;
  max_response_length: number;
  custom_instructions: string;
  signature: string;
}

const DEFAULT_FORM: FormData = {
  agent_name: 'SMS Assistant',
  agent_tone: 'professional',
  business_name: '',
  industry: '',
  business_description: '',
  common_inquiry_types: [],
  suggestions_enabled: true,
  auto_draft_enabled: false,
  call_summary_sms_enabled: false,
  max_response_length: 320,
  custom_instructions: '',
  signature: '',
};

export default function SmsAgentSetup() {
  const { config, loading, saving, fetchConfig, saveConfig, activateAgent, deactivateAgent } = useSmsAgentStore();
  const { currentOrganization } = useOrganizationStore();

  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [newInquiryType, setNewInquiryType] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Sync config to form when loaded
  useEffect(() => {
    if (config) {
      setFormData({
        agent_name: config.agent_name || 'SMS Assistant',
        agent_tone: config.agent_tone || 'professional',
        business_name: config.business_name || '',
        industry: config.industry || '',
        business_description: config.business_description || '',
        common_inquiry_types: config.common_inquiry_types || [],
        suggestions_enabled: config.suggestions_enabled ?? true,
        auto_draft_enabled: config.auto_draft_enabled ?? false,
        call_summary_sms_enabled: config.call_summary_sms_enabled ?? false,
        max_response_length: config.max_response_length || 320,
        custom_instructions: config.custom_instructions || '',
        signature: config.signature || '',
      });
      setHasChanges(false);
    } else if (currentOrganization) {
      // Pre-fill from org data for new configs
      setFormData(prev => ({
        ...prev,
        business_name: currentOrganization.name || '',
        industry: (currentOrganization as any).industry_template || '',
      }));
    }
  }, [config, currentOrganization]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const addInquiryType = () => {
    const trimmed = newInquiryType.trim();
    if (!trimmed || formData.common_inquiry_types.includes(trimmed)) return;
    updateField('common_inquiry_types', [...formData.common_inquiry_types, trimmed]);
    setNewInquiryType('');
  };

  const removeInquiryType = (type: string) => {
    updateField('common_inquiry_types', formData.common_inquiry_types.filter(t => t !== type));
  };

  const handleSave = async () => {
    try {
      await saveConfig({
        ...formData,
        setup_completed: true,
      });
      setHasChanges(false);
      toast.success('SMS Agent settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    }
  };

  const handleToggleActive = async () => {
    try {
      if (config?.is_active) {
        await deactivateAgent();
        toast.success('SMS Agent deactivated');
      } else {
        // Save current form + activate
        await saveConfig({ ...formData, is_active: true, setup_completed: true });
        setHasChanges(false);
        toast.success('SMS Agent activated');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to toggle agent');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
      </div>
    );
  }

  const isActive = config?.is_active ?? false;

  return (
    <div className="space-y-5">
      {/* Header with status toggle */}
      <div className={`rounded-xl border p-5 transition-colors ${
        isActive
          ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40'
          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <MessageSquare className={`w-5 h-5 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">SMS Agent</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isActive ? 'Active - AI suggestions enabled in Team Chat' : 'Configure your SMS AI assistant'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isActive ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-6">
        {/* Agent Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Agent Name
          </label>
          <input
            type="text"
            value={formData.agent_name}
            onChange={(e) => updateField('agent_name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="e.g., SMS Assistant, Alex, Support Bot"
          />
          <p className="text-xs text-gray-500 mt-1">This name is used internally to identify your SMS agent</p>
        </div>

        {/* Tone Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            <span className="flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-purple-500" />
              Agent Tone & Personality
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(TONE_DESCRIPTIONS) as AgentTone[]).map(tone => (
              <button
                key={tone}
                onClick={() => updateField('agent_tone', tone)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.agent_tone === tone
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <p className="font-semibold text-gray-900 dark:text-white capitalize">{tone}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{TONE_DESCRIPTIONS[tone]}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Business Context Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Business Context
          </h4>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Name
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                placeholder="Your Company Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Business Description
            </label>
            <textarea
              value={formData.business_description}
              onChange={(e) => updateField('business_description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
              placeholder="Describe your business, services, and unique value proposition. This context helps the AI generate relevant, on-brand responses."
            />
          </div>
        </div>

        {/* Common Inquiry Types */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Common Customer Inquiry Types
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newInquiryType}
              onChange={(e) => setNewInquiryType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addInquiryType()}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Pricing, Appointment, Support, Follow-up"
            />
            <button
              onClick={addInquiryType}
              disabled={!newInquiryType.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.common_inquiry_types.map(type => (
              <span key={type} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                {type}
                <button onClick={() => removeInquiryType(type)} className="hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {formData.common_inquiry_types.length === 0 && (
              <p className="text-xs text-gray-400">Add common inquiry types to help the AI understand your typical customer interactions</p>
            )}
          </div>
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Custom Instructions
            </span>
          </label>
          <textarea
            value={formData.custom_instructions}
            onChange={(e) => updateField('custom_instructions', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none"
            placeholder="Add any specific instructions for your SMS agent. For example: 'Always mention our current 20% off promotion', 'Direct complex questions to call our office at 555-1234', etc."
          />
        </div>

        {/* Feature Toggles */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Features
          </h4>

          <ToggleRow
            label="AI Response Suggestions"
            description="Show AI-generated response options when customers text you in Team Chat"
            icon={<MessageCircle className="w-4 h-4 text-green-500" />}
            checked={formData.suggestions_enabled}
            onChange={(v) => updateField('suggestions_enabled', v)}
          />

          <ToggleRow
            label="Call Summary SMS"
            description="Automatically send AI-generated call summaries to customers via SMS after voice calls"
            icon={<FileText className="w-4 h-4 text-blue-500" />}
            checked={formData.call_summary_sms_enabled}
            onChange={(v) => updateField('call_summary_sms_enabled', v)}
          />

          <ToggleRow
            label="Auto-Draft Mode"
            description="Automatically draft responses through the AI when new inbound messages arrive (advanced)"
            icon={<Brain className="w-4 h-4 text-purple-500" />}
            checked={formData.auto_draft_enabled}
            onChange={(v) => updateField('auto_draft_enabled', v)}
          />
        </div>

        {/* Response Settings */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Response Length
              </label>
              <input
                type="number"
                value={formData.max_response_length}
                onChange={(e) => updateField('max_response_length', Number(e.target.value))}
                min={50}
                max={1600}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">SMS messages are 160 chars/segment. Default: 320 (2 segments)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SMS Signature
              </label>
              <input
                type="text"
                value={formData.signature}
                onChange={(e) => updateField('signature', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white"
                placeholder="e.g., - The CxTrack Team"
              />
              <p className="text-xs text-gray-500 mt-1">Optional sign-off appended to AI-generated responses</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white font-medium rounded-xl transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>
    </div>
  );
}

// Toggle row sub-component
function ToggleRow({ label, description, icon, checked, onChange }: {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}
