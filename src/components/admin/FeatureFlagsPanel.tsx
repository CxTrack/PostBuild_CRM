import { useEffect, useState, useCallback } from 'react';
import {
  Flag, Plus, ToggleLeft, ToggleRight, ChevronDown, ChevronRight,
  Clock, Users, Layers, Percent, Trash2, Edit2, X, Check, AlertTriangle,
  Shield, History
} from 'lucide-react';
import { useAdminStore, type FeatureFlag, type FlagAuditEntry } from '../../stores/adminStore';
import { invalidateFeatureFlagCache } from '../../hooks/useFeatureFlag';
import toast from 'react-hot-toast';

const INDUSTRY_OPTIONS = [
  'tax_accounting', 'distribution_logistics', 'gyms_fitness', 'contractors_home_services',
  'healthcare', 'real_estate', 'legal_services', 'general_business', 'agency',
  'mortgage_broker', 'construction',
];

const TIER_OPTIONS = ['free_trial', 'business', 'elite_premium', 'enterprise'];

export const FeatureFlagsPanel = () => {
  const {
    featureFlags, flagAudit, loading,
    fetchFeatureFlags, upsertFeatureFlag, toggleFeatureFlag, fetchFlagAudit,
  } = useAdminStore();

  const [showCreate, setShowCreate] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatureFlags();
  }, []);

  const handleToggle = useCallback(async (flag: FeatureFlag) => {
    const result = await toggleFeatureFlag(flag.flag_key, !flag.is_enabled);
    if (result.success) {
      invalidateFeatureFlagCache();
      toast.success(`${flag.flag_key} ${!flag.is_enabled ? 'enabled' : 'disabled'}`);
    } else {
      toast.error(result.error || 'Failed to toggle flag');
    }
  }, [toggleFeatureFlag]);

  const handleAuditExpand = useCallback(async (flagKey: string) => {
    if (expandedAudit === flagKey) {
      setExpandedAudit(null);
      return;
    }
    setExpandedAudit(flagKey);
    await fetchFlagAudit(flagKey);
  }, [expandedAudit, fetchFlagAudit]);

  const isLoading = loading.featureFlags;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-purple-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Feature Flags</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Control feature rollouts with kill switches and targeting rules
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditingFlag(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New Flag
        </button>
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editingFlag) && (
        <FlagForm
          flag={editingFlag}
          onSave={async (params) => {
            const result = await upsertFeatureFlag(params);
            if (result.success) {
              invalidateFeatureFlagCache();
              toast.success(editingFlag ? 'Flag updated' : 'Flag created');
              setShowCreate(false);
              setEditingFlag(null);
            } else {
              toast.error(result.error || 'Failed to save flag');
            }
          }}
          onCancel={() => { setShowCreate(false); setEditingFlag(null); }}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Flag list */}
      {!isLoading && featureFlags.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Flag className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">No feature flags</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Create your first feature flag to control rollouts.
          </p>
        </div>
      )}

      {!isLoading && featureFlags.length > 0 && (
        <div className="space-y-3">
          {featureFlags.map((flag) => (
            <div
              key={flag.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
                flag.is_expired
                  ? 'border-gray-300 dark:border-gray-600 opacity-60'
                  : flag.is_enabled
                  ? 'border-green-200 dark:border-green-800'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Flag header */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-bold font-mono text-gray-900 dark:text-white">
                      {flag.flag_key}
                    </code>
                    {flag.is_expired && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                        EXPIRED
                      </span>
                    )}
                    {flag.rollout_percentage < 100 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded flex items-center gap-0.5">
                        <Percent className="w-2.5 h-2.5" />
                        {flag.rollout_percentage}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingFlag(flag)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggle(flag)}
                      className={`p-1 rounded-lg transition-colors ${
                        flag.is_enabled
                          ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                      title={flag.is_enabled ? 'Disable' : 'Enable'}
                    >
                      {flag.is_enabled ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                {flag.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{flag.description}</p>
                )}

                {/* Targeting info */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {flag.target_org_ids.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded">
                      <Users className="w-2.5 h-2.5" />
                      {flag.target_org_ids.length} org{flag.target_org_ids.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {flag.target_industry_templates.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 rounded">
                      <Layers className="w-2.5 h-2.5" />
                      {flag.target_industry_templates.join(', ')}
                    </span>
                  )}
                  {flag.target_subscription_tiers.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 rounded">
                      <Shield className="w-2.5 h-2.5" />
                      {flag.target_subscription_tiers.join(', ')}
                    </span>
                  )}
                  {flag.expires_at && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-medium bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded">
                      <Clock className="w-2.5 h-2.5" />
                      Expires {new Date(flag.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Audit history toggle */}
                <button
                  onClick={() => handleAuditExpand(flag.flag_key)}
                  className="flex items-center gap-1 mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <History className="w-3 h-3" />
                  {flag.audit_count || 0} change{(flag.audit_count || 0) !== 1 ? 's' : ''}
                  {expandedAudit === flag.flag_key ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Audit history */}
              {expandedAudit === flag.flag_key && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/50 space-y-2 max-h-48 overflow-y-auto">
                  {loading.flagAudit ? (
                    <div className="text-xs text-gray-400 animate-pulse">Loading audit history...</div>
                  ) : flagAudit.length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">No changes recorded.</p>
                  ) : (
                    flagAudit.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-2 text-xs">
                        <span className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5">
                          {new Date(entry.created_at).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {entry.changed_by_email || 'System'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-medium ${
                          entry.action === 'created' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : entry.action === 'toggled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {entry.action}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Flag Create/Edit Form
// ---------------------------------------------------------------------------
const FlagForm = ({
  flag,
  onSave,
  onCancel,
}: {
  flag: FeatureFlag | null;
  onSave: (params: any) => Promise<void>;
  onCancel: () => void;
}) => {
  const [flagKey, setFlagKey] = useState(flag?.flag_key || '');
  const [description, setDescription] = useState(flag?.description || '');
  const [isEnabled, setIsEnabled] = useState(flag?.is_enabled || false);
  const [rolloutPercentage, setRolloutPercentage] = useState(flag?.rollout_percentage ?? 100);
  const [targetIndustries, setTargetIndustries] = useState<string[]>(flag?.target_industry_templates || []);
  const [targetTiers, setTargetTiers] = useState<string[]>(flag?.target_subscription_tiers || []);
  const [expiresAt, setExpiresAt] = useState(flag?.expires_at ? flag.expires_at.split('T')[0] : '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!flagKey.trim()) {
      toast.error('Flag key is required');
      return;
    }
    // Validate key format
    if (!/^[a-z][a-z0-9_]*$/.test(flagKey)) {
      toast.error('Flag key must be lowercase, start with a letter, and use only a-z, 0-9, _');
      return;
    }
    setSaving(true);
    await onSave({
      flagKey: flagKey.trim(),
      description: description.trim() || undefined,
      isEnabled,
      rolloutPercentage,
      targetOrgIds: flag?.target_org_ids || [],
      targetIndustryTemplates: targetIndustries,
      targetSubscriptionTiers: targetTiers,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-purple-200 dark:border-purple-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
          {flag ? 'Edit Flag' : 'Create Flag'}
        </h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Flag key */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Flag Key *</label>
          <input
            value={flagKey}
            onChange={(e) => setFlagKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            disabled={!!flag}
            className="w-full px-3 py-2 text-sm font-mono bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            placeholder="new_voice_ui"
          />
        </div>

        {/* Rollout percentage */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rollout: {rolloutPercentage}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={rolloutPercentage}
            onChange={(e) => setRolloutPercentage(Number(e.target.value))}
            className="w-full accent-purple-600"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
          placeholder="What does this flag control?"
        />
      </div>

      {/* Target industries */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Industries (empty = all)</label>
        <div className="flex flex-wrap gap-1.5">
          {INDUSTRY_OPTIONS.map((ind) => (
            <button
              key={ind}
              onClick={() => setTargetIndustries(
                targetIndustries.includes(ind)
                  ? targetIndustries.filter((i) => i !== ind)
                  : [...targetIndustries, ind]
              )}
              className={`px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                targetIndustries.includes(ind)
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {ind.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Target tiers */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Target Subscription Tiers (empty = all)</label>
        <div className="flex flex-wrap gap-1.5">
          {TIER_OPTIONS.map((tier) => (
            <button
              key={tier}
              onClick={() => setTargetTiers(
                targetTiers.includes(tier)
                  ? targetTiers.filter((t) => t !== tier)
                  : [...targetTiers, tier]
              )}
              className={`px-2 py-1 text-[10px] font-medium rounded-lg transition-colors ${
                targetTiers.includes(tier)
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {tier.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Expires at */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Expires At (optional)</label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Enable immediately</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !flagKey.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {saving ? (
            <>Saving...</>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              {flag ? 'Update Flag' : 'Create Flag'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
