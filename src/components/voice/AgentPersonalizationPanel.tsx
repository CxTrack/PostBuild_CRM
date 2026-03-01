import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Eye, Save, ChevronDown, ChevronUp, AlertTriangle, Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useVoiceAgentStore } from '@/stores/voiceAgentStore';
import { supabase } from '@/lib/supabase';
import { interpolateTemplate } from '@/utils/interpolateTemplate';
import toast from 'react-hot-toast';

// ============================================================
// Types
// ============================================================
interface PersonalizationField {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  required: boolean;
  placeholder?: string;
}

interface IndustryTemplate {
  industry: string;
  default_instructions: string;
  default_greeting: string;
  agent_display_name: string;
  personalization_fields: PersonalizationField[];
}

// Human-readable industry names
const INDUSTRY_DISPLAY_NAMES: Record<string, string> = {
  tax_accounting: 'Tax & Accounting',
  distribution_logistics: 'Distribution & Logistics',
  gyms_fitness: 'Gyms & Fitness',
  contractors_home_services: 'Contractors & Home Services',
  healthcare: 'Healthcare',
  real_estate: 'Real Estate',
  legal_services: 'Legal Services',
  general_business: 'General Business',
  agency: 'Agency',
  mortgage_broker: 'Mortgage Broker',
  construction: 'Construction',
};

interface AgentPersonalizationPanelProps {
  formData: {
    general_prompt: string;
    begin_message: string;
    business_description: string;
  };
  setFormData: (updater: (prev: any) => any) => void;
  onSave: () => void;
  saving: boolean;
  isProvisioned: boolean;
  onOpenCoPilot?: () => void;
}

export default function AgentPersonalizationPanel({
  formData,
  setFormData,
  onSave,
  saving,
  isProvisioned,
  onOpenCoPilot,
}: AgentPersonalizationPanelProps) {
  const { currentOrganization } = useOrganizationStore();
  const { config, updateRetellAgent } = useVoiceAgentStore();

  const [template, setTemplate] = useState<IndustryTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [savingPersonalization, setSavingPersonalization] = useState(false);
  const [previewPrompt, setPreviewPrompt] = useState('');

  const industry = config?.industry || currentOrganization?.industry_template || 'general_business';
  const industryLabel = INDUSTRY_DISPLAY_NAMES[industry] || industry;

  // Fetch industry template and existing personalization values
  const fetchTemplate = useCallback(async () => {
    setLoadingTemplate(true);
    try {
      const { data, error } = await supabase
        .from('industry_voice_templates')
        .select('industry, default_instructions, default_greeting, agent_display_name, personalization_fields')
        .eq('industry', industry)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTemplate(data as IndustryTemplate);

        // Pre-fill values from saved personalization_values, or from org/config
        const saved = (config as any)?.personalization_values || {};
        const prefilled: Record<string, string> = {};

        const fields = (data.personalization_fields || []) as PersonalizationField[];
        for (const field of fields) {
          if (saved[field.key]) {
            prefilled[field.key] = saved[field.key];
          } else if (field.key === 'business_name') {
            prefilled[field.key] = config?.business_name || currentOrganization?.name || '';
          } else if (field.key === 'agent_name') {
            prefilled[field.key] = config?.agent_name || '';
          }
        }
        setFieldValues(prefilled);
      } else {
        // Fallback to general_business
        const { data: fallback } = await supabase
          .from('industry_voice_templates')
          .select('industry, default_instructions, default_greeting, agent_display_name, personalization_fields')
          .eq('industry', 'general_business')
          .eq('is_active', true)
          .maybeSingle();

        if (fallback) {
          setTemplate(fallback as IndustryTemplate);
        }
      }
    } catch (err) {
      console.error('Failed to fetch industry template:', err);
    } finally {
      setLoadingTemplate(false);
    }
  }, [industry, config, currentOrganization]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // Update a field value
  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  // Generate preview of interpolated prompt
  const handlePreview = () => {
    if (!template) return;
    const interpolated = interpolateTemplate(template.default_instructions, fieldValues);
    setPreviewPrompt(interpolated);
    setShowPreview(true);
  };

  // Save personalization: interpolate template, update Retell, save to DB
  const handleSavePersonalization = async () => {
    if (!template) return;

    setSavingPersonalization(true);
    try {
      // Interpolate the template with current field values
      const interpolatedPrompt = interpolateTemplate(template.default_instructions, fieldValues);
      const interpolatedGreeting = interpolateTemplate(template.default_greeting, fieldValues);

      // Update the form data so VoiceAgentSetup's save handler picks it up
      setFormData((prev: any) => ({
        ...prev,
        general_prompt: interpolatedPrompt,
        begin_message: interpolatedGreeting,
      }));

      // Save personalization_values to voice_agent_configs
      if (config?.id) {
        await supabase
          .from('voice_agent_configs')
          .update({
            personalization_values: fieldValues,
            general_prompt: interpolatedPrompt,
            begin_message: interpolatedGreeting,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);
      }

      // If provisioned, sync to Retell
      if (isProvisioned) {
        const result = await updateRetellAgent({
          generalPrompt: interpolatedPrompt,
          beginMessage: interpolatedGreeting,
        });
        if (!result.success) {
          toast.error(`Saved locally but Retell sync failed: ${result.error}`);
          setSavingPersonalization(false);
          return;
        }
      }

      toast.success('Agent personalized and synced');
    } catch (err) {
      console.error('Save personalization failed:', err);
      toast.error('Failed to save personalization');
    } finally {
      setSavingPersonalization(false);
    }
  };

  // Check if any required fields are empty
  const fields = (template?.personalization_fields || []) as PersonalizationField[];
  const hasRequiredEmpty = fields.some((f) => f.required && !fieldValues[f.key]?.trim());

  if (loadingTemplate) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-purple-500 mr-2" />
        <span className="text-sm text-gray-500">Loading personalization...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Personalize Your AI Agent
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your agent uses a <span className="font-semibold text-purple-600 dark:text-purple-400">{industryLabel}</span> optimized prompt.
              Fill in your details to make it yours.
            </p>
          </div>

          {onOpenCoPilot && (
            <button
              onClick={onOpenCoPilot}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4" />
              Personalize with AI
            </button>
          )}
        </div>
      </div>

      {/* Personalization fields */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                value={fieldValues[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder={field.placeholder}
              />
            ) : (
              <input
                type="text"
                value={fieldValues[field.key] || ''}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={handlePreview}
            disabled={!template}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            Preview Prompt
          </button>

          <button
            onClick={handleSavePersonalization}
            disabled={savingPersonalization || hasRequiredEmpty}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {savingPersonalization ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {savingPersonalization ? 'Saving...' : 'Save & Update Agent'}
          </button>
        </div>

        {hasRequiredEmpty && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Fill in all required fields before saving.
          </p>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200">How it works</p>
            <p className="text-blue-700 dark:text-blue-300 mt-1">
              Your agent's prompt was pre-built by CxTrack for the <strong>{industryLabel}</strong> industry.
              Fill in your specific details above and click <strong>Save & Update Agent</strong> to
              personalize it. Your agent will immediately start using your custom details on calls.
            </p>
          </div>
        </div>
      </div>

      {/* Advanced: Raw prompt editor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <span>Advanced: Edit Full Prompt</span>
          {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvanced && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
            {/* Warning banner */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Manual edits to the prompt below will be <strong>overwritten</strong> the next time you save via the personalization fields above.
                Only use this for advanced tweaks.
              </p>
            </div>

            {/* Opening Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Opening Message
              </label>
              <textarea
                value={formData.begin_message}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, begin_message: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none text-sm"
                placeholder="Hello! Thank you for calling. How can I help you today?"
              />
              <p className="text-xs text-gray-500 mt-1">
                The first thing your agent says when it answers. Leave empty for dynamic greeting.
              </p>
            </div>

            {/* Agent Instructions (System Prompt) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Instructions (System Prompt)
              </label>
              <textarea
                value={formData.general_prompt}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, general_prompt: e.target.value }))}
                rows={12}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white font-mono text-xs"
                placeholder="Full system prompt for your AI agent..."
              />
            </div>

            {/* Business Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Business Description
              </label>
              <textarea
                value={formData.business_description}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, business_description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 dark:text-white resize-none text-sm"
                placeholder="Describe your business, services, and what makes you unique..."
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={onSave}
                disabled={saving}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving & Syncing...' : 'Save & Sync to Agent'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Prompt Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono leading-relaxed">
                {previewPrompt}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
