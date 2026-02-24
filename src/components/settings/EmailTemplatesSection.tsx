/**
 * EmailTemplatesSection
 * Manage email templates per organization/industry.
 * Lists system defaults + org overrides with create/edit/delete.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Edit2, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Loader2, Save, X } from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import toast from 'react-hot-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zkpfzrbbupgiqkzqydji.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

interface EmailTemplate {
  id: string;
  organization_id: string | null;
  industry: string;
  template_key: string;
  category: string;
  name: string;
  subject: string;
  body_text: string;
  variables: string[];
  is_active: boolean;
  sort_order: number;
}

const CATEGORY_OPTIONS = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'quote', label: 'Quotes' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'general', label: 'General' },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(CATEGORY_OPTIONS.map(o => [o.value, o.label]));

function getAuthHeaders() {
  const tokenKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  const raw = tokenKey ? localStorage.getItem(tokenKey) : null;
  const token = raw ? JSON.parse(raw)?.access_token : null;
  return {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

export default function EmailTemplatesSection() {
  const { currentOrganization } = useOrganizationStore();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate> | null>(null);
  const [saving, setSaving] = useState(false);

  const industry = currentOrganization?.industry_template || 'general_business';
  const orgId = currentOrganization?.id;

  const fetchTemplates = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const url = `${SUPABASE_URL}/rest/v1/email_templates?industry=eq.${industry}&or=(organization_id.is.null,organization_id.eq.${orgId})&order=category.asc,sort_order.asc`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      }
    } catch {
      toast.error('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, [industry, orgId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleSave = async () => {
    if (!editingTemplate || !orgId) return;
    if (!editingTemplate.name?.trim() || !editingTemplate.subject?.trim() || !editingTemplate.body_text?.trim()) {
      toast.error('Name, subject, and body are required');
      return;
    }

    setSaving(true);
    try {
      const templateKey = editingTemplate.template_key || editingTemplate.name!.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const payload = {
        organization_id: orgId,
        industry,
        template_key: templateKey,
        category: editingTemplate.category || 'general',
        name: editingTemplate.name!.trim(),
        subject: editingTemplate.subject!.trim(),
        body_text: editingTemplate.body_text!.trim(),
        variables: editingTemplate.variables || [],
        is_active: editingTemplate.is_active !== false,
        sort_order: editingTemplate.sort_order || 0,
      };

      if (editingTemplate.id && editingTemplate.organization_id) {
        // Update existing org template
        const res = await fetch(`${SUPABASE_URL}/rest/v1/email_templates?id=eq.${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { ...getAuthHeaders(), 'Prefer': 'return=minimal' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success('Template updated');
      } else {
        // Create new org template
        const res = await fetch(`${SUPABASE_URL}/rest/v1/email_templates`, {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Prefer': 'return=representation' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Create failed');
        toast.success('Template created');
      }

      setEditingTemplate(null);
      fetchTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!template.organization_id) {
      toast.error('Cannot delete system templates');
      return;
    }
    if (!confirm(`Delete template "${template.name}"?`)) return;

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/email_templates?id=eq.${template.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        toast.success('Template deleted');
        fetchTemplates();
      }
    } catch {
      toast.error('Failed to delete template');
    }
  };

  // Group templates by category
  const grouped = templates.reduce<Record<string, EmailTemplate[]>>((acc, t) => {
    const cat = t.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Templates</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pre-built email templates for your industry. Create custom templates or use the defaults.
          </p>
        </div>
        <button
          onClick={() => setEditingTemplate({ category: 'general', is_active: true, variables: [] })}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Edit/Create Modal */}
      {editingTemplate && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-primary-500 p-6 space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {editingTemplate.id ? 'Edit Template' : 'New Template'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Name</label>
              <input
                type="text"
                value={editingTemplate.name || ''}
                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                placeholder="e.g. Welcome Email"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
              <select
                value={editingTemplate.category || 'general'}
                onChange={e => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Subject <span className="text-gray-400">(supports {'{{variables}}'} )</span>
            </label>
            <input
              type="text"
              value={editingTemplate.subject || ''}
              onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
              placeholder="e.g. Welcome to {{business_name}}!"
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Body <span className="text-gray-400">(supports {'{{variables}}'} )</span>
            </label>
            <textarea
              value={editingTemplate.body_text || ''}
              onChange={e => setEditingTemplate({ ...editingTemplate, body_text: e.target.value })}
              placeholder="Hi {{customer_name}}..."
              rows={8}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:outline-none resize-y"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {editingTemplate.id ? 'Update' : 'Create'} Template
            </button>
            <button
              onClick={() => setEditingTemplate(null)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm"
            >
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template List */}
      {Object.entries(grouped).map(([category, categoryTemplates]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            {CATEGORY_LABELS[category] || category}
          </h4>
          <div className="space-y-2">
            {categoryTemplates.map(template => (
              <div
                key={template.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border ${
                  template.organization_id ? 'border-primary-200 dark:border-primary-800' : 'border-gray-200 dark:border-gray-700'
                } overflow-hidden`}
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className={template.organization_id ? 'text-primary-500' : 'text-gray-400'} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{template.name}</p>
                        {template.organization_id && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded">Custom</span>
                        )}
                        {!template.is_active && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{template.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {template.organization_id && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingTemplate(template); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} className="text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(template); }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </>
                    )}
                    {expandedId === template.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {expandedId === template.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="mt-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject:</p>
                      <p className="text-sm text-gray-900 dark:text-white mb-3">{template.subject}</p>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Body:</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{template.body_text}</p>
                      {template.variables && template.variables.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          <span className="text-xs text-gray-400">Variables:</span>
                          {template.variables.map(v => (
                            <span key={v} className="px-1.5 py-0.5 text-[10px] bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded font-mono">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No email templates found for your industry</p>
        </div>
      )}
    </div>
  );
}
