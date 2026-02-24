import { useState } from 'react';
import { Phone, FileText, Calendar, Shield, Save, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export interface MemorySettings {
  memory_enabled: boolean;
  memory_call_history: boolean;
  memory_customer_notes: boolean;
  memory_calendar_tasks: boolean;
}

interface MemoryContextSettingsProps {
  settings: MemorySettings;
  onChange: (updates: Partial<MemorySettings>) => void;
  onSave: () => Promise<void>;
  saving: boolean;
  isProvisioned: boolean;
}

interface SourceToggleProps {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function SourceToggle({ icon: Icon, title, description, checked, onChange }: SourceToggleProps) {
  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
        checked
          ? 'border-purple-500/50 bg-purple-500/5 dark:border-purple-400/30 dark:bg-purple-900/10'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={() => onChange(!checked)}
    >
      <div className={`p-2 rounded-lg ${
        checked ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'
      }`}>
        <Icon className={`w-5 h-5 ${
          checked ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'
        }`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${
          checked ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
        }`}>
          {title}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onChange(!checked);
        }}
        className="flex-shrink-0 mt-1"
      >
        {checked ? (
          <ToggleRight className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        ) : (
          <ToggleLeft className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        )}
      </button>
    </div>
  );
}

export default function MemoryContextSettings({
  settings,
  onChange,
  onSave,
  saving,
  isProvisioned,
}: MemoryContextSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Memory & Context</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            When enabled, your AI agent recognizes returning callers and personalizes conversations
            using their history. The agent will never disclose internal notes or privileged information
            to callers.
          </p>
        </div>

        {/* Master Toggle */}
        <div
          className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
            settings.memory_enabled
              ? 'border-purple-500 bg-purple-500/5 dark:border-purple-400/50 dark:bg-purple-900/10'
              : 'border-gray-200 dark:border-gray-700'
          }`}
          onClick={() => onChange({ memory_enabled: !settings.memory_enabled })}
        >
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Enable Caller Memory</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically look up callers by phone number and provide relevant context to the agent
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange({ memory_enabled: !settings.memory_enabled });
            }}
            className="flex-shrink-0"
          >
            {settings.memory_enabled ? (
              <ToggleRight className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            ) : (
              <ToggleLeft className="w-10 h-10 text-gray-400 dark:text-gray-500" />
            )}
          </button>
        </div>

        {/* Granular Sources */}
        <div className={`space-y-3 transition-opacity ${
          !settings.memory_enabled ? 'opacity-40 pointer-events-none' : ''
        }`}>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Data Sources
          </h4>

          <SourceToggle
            icon={Phone}
            title="Past Call History & Transcripts"
            description="Include summaries, key topics, and action items from previous calls with this caller"
            checked={settings.memory_call_history}
            onChange={(v) => onChange({ memory_call_history: v })}
          />

          <SourceToggle
            icon={FileText}
            title="Customer Notes"
            description="Include internal notes from the customer's CRM profile (general, follow-up, meeting notes)"
            checked={settings.memory_customer_notes}
            onChange={(v) => onChange({ memory_customer_notes: v })}
          />

          <SourceToggle
            icon={Calendar}
            title="Calendar Events & Tasks"
            description="Include upcoming appointments and pending tasks associated with this caller"
            checked={settings.memory_calendar_tasks}
            onChange={(v) => onChange({ memory_calendar_tasks: v })}
          />
        </div>

        {/* Privacy Notice */}
        <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Privacy & Security</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">
              Context is only loaded for the matching customer based on their phone number.
              The agent is instructed to never reveal internal notes, organization data, or
              privileged information to callers. Data stays within your organization.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onSave}
            disabled={saving || !isProvisioned}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Memory Settings</>
            )}
          </button>
        </div>

        {!isProvisioned && (
          <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
            Memory settings will take effect after your voice agent is provisioned.
          </p>
        )}
      </div>
    </div>
  );
}
