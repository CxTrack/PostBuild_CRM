import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Phone, Bell, FileText, CheckCircle, Loader2,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Clock, Send
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { smsService, SMSSettings, SMSTemplate } from '@/services/sms.service';
import { usePipelineConfigStore } from '@/stores/pipelineConfigStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface SMSSettingsTabProps {
  organizationId: string;
  industry: string;
}

const SMSSettingsTab: React.FC<SMSSettingsTabProps> = ({ organizationId, industry }) => {
  const { stages } = usePipelineConfigStore();
  const [settings, setSettings] = useState<SMSSettings | null>(null);
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [activeSection, setActiveSection] = useState<'general' | 'pipeline' | 'templates' | 'history'>('general');
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  // Local state for toggles
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [pipelineSmsEnabled, setPipelineSmsEnabled] = useState(false);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [organizationId, industry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, templatesData, hasNum, logs] = await Promise.all([
        smsService.getSMSSettings(organizationId),
        smsService.fetchTemplates(industry),
        smsService.hasPhoneNumber(organizationId),
        smsService.getSMSLog(organizationId),
      ]);
      setSettings(settingsData);
      setTemplates(templatesData);
      setHasPhone(hasNum);
      setSmsLogs(logs);
      if (settingsData) {
        setSmsEnabled(settingsData.sms_enabled);
        setPipelineSmsEnabled(settingsData.pipeline_sms_enabled);
        setSelectedStages(settingsData.pipeline_stages_to_notify || []);
      }
    } catch (err) {
      console.error('Failed to load SMS settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await smsService.updateSMSPreferences(organizationId, {
        sms_enabled: smsEnabled,
        pipeline_sms_enabled: pipelineSmsEnabled,
        pipeline_stages_to_notify: selectedStages,
      });
      toast.success('SMS settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleStage = (stageKey: string) => {
    setSelectedStages(prev =>
      prev.includes(stageKey)
        ? prev.filter(s => s !== stageKey)
        : [...prev, stageKey]
    );
  };

  const nonTerminalStages = stages.filter(s => !s.is_terminal);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4" />
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phone Number Status */}
      <div className={`rounded-xl p-4 border ${hasPhone
        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          <Phone className={`w-5 h-5 ${hasPhone ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`} />
          <div>
            <p className={`font-medium ${hasPhone ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}`}>
              {hasPhone ? 'Phone number configured' : 'No phone number configured'}
            </p>
            <p className={`text-sm ${hasPhone ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {hasPhone
                ? 'Your SMS and calling features are ready to use.'
                : 'Set up a phone number in the Voice Agent tab to enable SMS features.'}
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'general' as const, label: 'General', icon: MessageSquare },
          { id: 'pipeline' as const, label: 'Pipeline SMS', icon: Bell },
          { id: 'templates' as const, label: 'Templates', icon: FileText },
          { id: 'history' as const, label: 'SMS History', icon: Clock },
        ].map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeSection === section.id
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeSection === 'general' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">SMS Settings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure how SMS messaging works across your CRM.
            </p>
          </div>

          {/* SMS Enabled Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">SMS Messaging</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable or disable all SMS functionality
              </p>
            </div>
            <button onClick={() => setSmsEnabled(!smsEnabled)} className="focus:outline-none">
              {smsEnabled
                ? <ToggleRight size={36} className="text-green-500" />
                : <ToggleLeft size={36} className="text-gray-400" />
              }
            </button>
          </div>

          {/* SMS Capabilities */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Available Features</p>
            {[
              { label: 'Send custom SMS to customers', description: 'Free-form text messages from customer profiles' },
              { label: 'Industry-specific templates', description: 'Pre-written messages tailored to your business' },
              { label: 'Quote & Invoice notifications', description: 'Notify customers when you send quotes or invoices' },
              { label: 'Pipeline stage change alerts', description: 'Auto-prompt SMS when deals move stages' },
            ].map(feature => (
              <div key={feature.label} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <CheckCircle size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{feature.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save Settings
            </Button>
          </div>
        </div>
      )}

      {/* Pipeline SMS Settings */}
      {activeSection === 'pipeline' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Pipeline SMS Notifications</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically prompt you to send an SMS when a deal moves to a new stage.
            </p>
          </div>

          {/* Pipeline SMS Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Pipeline SMS Triggers</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Show SMS dialog when deals change stage
              </p>
            </div>
            <button onClick={() => setPipelineSmsEnabled(!pipelineSmsEnabled)} className="focus:outline-none">
              {pipelineSmsEnabled
                ? <ToggleRight size={36} className="text-green-500" />
                : <ToggleLeft size={36} className="text-gray-400" />
              }
            </button>
          </div>

          {pipelineSmsEnabled && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select which stages should trigger an SMS prompt:
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If none are selected, all stage changes will trigger the SMS prompt.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nonTerminalStages.map(stage => (
                  <button
                    key={stage.stage_key}
                    onClick={() => toggleStage(stage.stage_key)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${
                      selectedStages.includes(stage.stage_key)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedStages.includes(stage.stage_key)
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedStages.includes(stage.stage_key) && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stage.stage_label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Save Pipeline SMS Settings
            </Button>
          </div>
        </div>
      )}

      {/* Templates */}
      {activeSection === 'templates' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">SMS Templates</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Pre-written templates for your industry. Use these when sending SMS from anywhere in the CRM.
            </p>
          </div>

          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No templates available for your industry</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(template => {
                const isExpanded = expandedTemplate === template.id;
                return (
                  <div
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedTemplate(isExpanded ? null : template.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                          template.category === 'pipeline_change' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                          template.category === 'welcome' ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                          template.category === 'payment' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                          template.category === 'appointment' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {template.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</span>
                      </div>
                      {isExpanded
                        ? <ChevronUp size={16} className="text-gray-400" />
                        : <ChevronDown size={16} className="text-gray-400" />
                      }
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {template.body}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(template.body.match(/\{\{[^}]+\}\}/g) || []).map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded font-mono">
                              {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SMS History */}
      {activeSection === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">SMS History</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Recent SMS messages sent from your organization.
            </p>
          </div>

          {smsLogs.length === 0 ? (
            <div className="text-center py-8">
              <Send size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No SMS messages sent yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Messages will appear here once you start sending</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {smsLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                    log.status === 'sent' || log.status === 'delivered'
                      ? 'bg-green-100 dark:bg-green-500/20'
                      : log.status === 'failed'
                      ? 'bg-red-100 dark:bg-red-500/20'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <MessageSquare size={14} className={
                      log.status === 'sent' || log.status === 'delivered'
                        ? 'text-green-600 dark:text-green-400'
                        : log.status === 'failed'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {log.recipient_phone}
                      </p>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${
                        log.status === 'sent' || log.status === 'delivered'
                          ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                          : log.status === 'failed'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {log.message_body}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span className="text-[10px] text-gray-400 capitalize">
                        {log.document_type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SMSSettingsTab;
