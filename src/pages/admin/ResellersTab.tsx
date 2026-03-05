import { useState, useEffect, useMemo } from 'react';
import {
  Users, DollarSign, TrendingUp, Plus, ExternalLink,
  RefreshCw, Search, MoreVertical, CheckCircle, Clock,
  AlertTriangle, XCircle, Eye, Edit2, Loader2, X,
  Building2, Percent, Calendar, ArrowRight, CreditCard,
  Handshake, ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { useAdminStore, ResellerPartner, ResellerSourcedOrg, ResellerCommission } from '@/stores/adminStore';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import toast from 'react-hot-toast';

// ── Helpers ──────────────────────────────────────────────────

const fmt = (cents: number, currency = 'CAD') =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency }).format(cents / 100);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paused: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusColors[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

// ── Auth helper ──────────────────────────────────────────────

function getAuthToken(): string | null {
  const ref = (import.meta.env.VITE_SUPABASE_URL || '').split('//')[1]?.split('.')[0];
  const key = ref ? `sb-${ref}-auth-token` : Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
  if (!key) return null;
  try { return JSON.parse(localStorage.getItem(typeof key === 'string' ? key : '') || '').access_token || null; } catch { return null; }
}

// ── Main Component ───────────────────────────────────────────

export const ResellersTab = () => {
  const {
    resellerSummary, resellerPartners, resellerSourcedOrgs, resellerCommissions,
    loading, fetchResellerSummary, fetchResellerPartners, fetchResellerSourcedOrgs,
    fetchResellerCommissions, createResellerPartner, updateResellerPartner,
    addSourcedOrg, createCommissionRecord, updateCommissionStatus,
  } = useAdminStore();

  const [view, setView] = useState<'overview' | 'partner-detail' | 'commissions'>('overview');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showAddCommission, setShowAddCommission] = useState(false);
  const [allOrgs, setAllOrgs] = useState<Array<{ id: string; name: string; subscription_tier: string }>>([]);

  // Load data
  useEffect(() => {
    fetchResellerSummary();
    fetchResellerPartners();
  }, [fetchResellerSummary, fetchResellerPartners]);

  // Fetch all orgs for linking dropdown
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    fetch(`${supabaseUrl}/rest/v1/organizations?select=id,name,subscription_tier&status=eq.active&order=name`, {
      headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` },
    }).then(r => r.json()).then(setAllOrgs).catch(() => {});
  }, []);

  const selectedPartner = resellerPartners.find(p => p.id === selectedPartnerId);

  const openPartnerDetail = (id: string) => {
    setSelectedPartnerId(id);
    setView('partner-detail');
    fetchResellerSourcedOrgs(id);
    fetchResellerCommissions(id);
  };

  const filteredPartners = useMemo(() => {
    if (!search) return resellerPartners;
    const q = search.toLowerCase();
    return resellerPartners.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.company_name && p.company_name.toLowerCase().includes(q))
    );
  }, [resellerPartners, search]);

  // ── KPI Cards ──────────────────────────────────────────────

  const KPICards = () => {
    if (!resellerSummary) return null;
    const cards = [
      { label: 'Active Partners', value: resellerSummary.active_partners, icon: Handshake, color: 'from-purple-600 to-blue-600' },
      { label: 'Sourced Orgs', value: resellerSummary.total_sourced_orgs, icon: Building2, color: 'from-blue-600 to-cyan-600' },
      { label: 'Total Paid Out', value: fmt(resellerSummary.total_commissions_paid_cents), icon: DollarSign, color: 'from-green-600 to-emerald-600' },
      { label: 'Pending Payouts', value: fmt(resellerSummary.total_commissions_pending_cents), icon: Clock, color: 'from-yellow-600 to-orange-600' },
      { label: 'This Month', value: fmt(resellerSummary.commissions_this_month_cents), icon: TrendingUp, color: 'from-pink-600 to-rose-600' },
    ];
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                <c.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{c.value}</p>
          </div>
        ))}
      </div>
    );
  };

  // ── Add Partner Modal ──────────────────────────────────────

  const AddPartnerModal = () => {
    const [form, setForm] = useState({ name: '', email: '', company_name: '', phone: '', default_commission_rate: '30', stripe_connected_account_id: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
      if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
      setSaving(true);
      const payload: any = {
        name: form.name,
        email: form.email,
        default_commission_rate: parseFloat(form.default_commission_rate) || 30,
      };
      if (form.company_name) payload.company_name = form.company_name;
      if (form.phone) payload.phone = form.phone;
      if (form.stripe_connected_account_id) {
        payload.stripe_connected_account_id = form.stripe_connected_account_id;
        payload.stripe_onboarding_complete = true;
        payload.status = 'active';
      }
      if (form.notes) payload.notes = form.notes;

      const result = await createResellerPartner(payload);
      setSaving(false);
      if (result.success) {
        toast.success('Partner added');
        setShowAddPartner(false);
      } else {
        toast.error(result.error || 'Failed to add partner');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Reseller Partner</h3>
            <button onClick={() => setShowAddPartner(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            {[
              { key: 'name', label: 'Full Name', required: true },
              { key: 'email', label: 'Email', required: true, type: 'email' },
              { key: 'company_name', label: 'Company Name' },
              { key: 'phone', label: 'Phone' },
              { key: 'default_commission_rate', label: 'Default Commission Rate (%)', type: 'number' },
              { key: 'stripe_connected_account_id', label: 'Stripe Connected Account ID', placeholder: 'acct_...' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type={f.type || 'text'}
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowAddPartner(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Partner
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Add Sourced Org Modal ──────────────────────────────────

  const AddSourcedOrgModal = () => {
    const [form, setForm] = useState({
      organization_id: '', commission_rate: selectedPartner?.default_commission_rate?.toString() || '30',
      commission_type: 'hybrid', recurring_months_cap: '12', one_time_amount_cents: '', notes: '',
    });
    const [saving, setSaving] = useState(false);

    // Filter out orgs already linked to this reseller
    const linkedOrgIds = new Set(resellerSourcedOrgs.map(s => s.organization_id));
    const availableOrgs = allOrgs.filter(o => !linkedOrgIds.has(o.id));

    const handleSubmit = async () => {
      if (!form.organization_id || !selectedPartnerId) { toast.error('Select an organization'); return; }
      setSaving(true);
      const payload: any = {
        reseller_id: selectedPartnerId,
        organization_id: form.organization_id,
        commission_rate: parseFloat(form.commission_rate) || 30,
        commission_type: form.commission_type,
        recurring_months_cap: parseInt(form.recurring_months_cap) || 12,
      };
      if (form.one_time_amount_cents) payload.one_time_amount_cents = Math.round(parseFloat(form.one_time_amount_cents) * 100);
      if (form.notes) payload.notes = form.notes;

      const result = await addSourcedOrg(payload);
      setSaving(false);
      if (result.success) {
        toast.success('Organization linked');
        setShowAddOrg(false);
        if (selectedPartnerId) fetchResellerSourcedOrgs(selectedPartnerId);
      } else {
        toast.error(result.error || 'Failed to link organization');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Link Sourced Organization</h3>
            <button onClick={() => setShowAddOrg(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Organization <span className="text-red-500">*</span></label>
              <select
                value={form.organization_id}
                onChange={e => setForm(prev => ({ ...prev, organization_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Select organization...</option>
                {availableOrgs.map(o => (
                  <option key={o.id} value={o.id}>{o.name} ({o.subscription_tier || 'free'})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Type</label>
                <select
                  value={form.commission_type}
                  onChange={e => setForm(prev => ({ ...prev, commission_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="one_time">One-Time Only</option>
                  <option value="recurring">Recurring Only</option>
                  <option value="hybrid">Hybrid (One-Time + Recurring)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Rate (%)</label>
                <input
                  type="number" step="0.01" value={form.commission_rate}
                  onChange={e => setForm(prev => ({ ...prev, commission_rate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            {(form.commission_type === 'recurring' || form.commission_type === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recurring Months Cap</label>
                <input
                  type="number" value={form.recurring_months_cap}
                  onChange={e => setForm(prev => ({ ...prev, recurring_months_cap: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            )}
            {(form.commission_type === 'one_time' || form.commission_type === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">One-Time Commission Amount ($)</label>
                <input
                  type="number" step="0.01" value={form.one_time_amount_cents} placeholder="e.g. 1050.00"
                  onChange={e => setForm(prev => ({ ...prev, one_time_amount_cents: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
                <p className="text-[11px] text-gray-500 mt-1">Flat amount for the one-time setup commission</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={form.notes} rows={2}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowAddOrg(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Link Organization
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Record Commission Modal ────────────────────────────────

  const RecordCommissionModal = () => {
    const [form, setForm] = useState({
      sourced_org_id: '', commission_type: 'one_time_setup' as string,
      gross_amount: '', notes: '',
    });
    const [saving, setSaving] = useState(false);

    const selectedOrg = resellerSourcedOrgs.find(o => o.id === form.sourced_org_id);
    const commissionRate = selectedOrg?.commission_rate || selectedPartner?.default_commission_rate || 30;
    const grossCents = Math.round((parseFloat(form.gross_amount) || 0) * 100);
    const commissionCents = Math.round(grossCents * commissionRate / 100);

    const handleSubmit = async () => {
      if (!form.sourced_org_id || !form.gross_amount || !selectedPartnerId) {
        toast.error('Select an organization and enter the gross amount');
        return;
      }
      if (!selectedOrg) return;
      setSaving(true);

      const payload: any = {
        reseller_id: selectedPartnerId,
        sourced_org_id: form.sourced_org_id,
        organization_id: selectedOrg.organization_id,
        commission_type: form.commission_type,
        gross_amount_cents: grossCents,
        commission_rate: commissionRate,
        commission_amount_cents: commissionCents,
        currency: 'cad',
      };
      if (form.commission_type === 'recurring_monthly') {
        payload.recurring_month_number = (selectedOrg.recurring_months_paid || 0) + 1;
      }
      if (form.notes) payload.notes = form.notes;

      const result = await createCommissionRecord(payload);
      setSaving(false);
      if (result.success) {
        toast.success(`Commission of ${fmt(commissionCents)} recorded`);
        setShowAddCommission(false);
        if (selectedPartnerId) {
          fetchResellerCommissions(selectedPartnerId);
          fetchResellerSourcedOrgs(selectedPartnerId);
        }
      } else {
        toast.error(result.error || 'Failed to record commission');
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-lg mx-4">
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Record Commission</h3>
            <button onClick={() => setShowAddCommission(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sourced Organization</label>
              <select
                value={form.sourced_org_id}
                onChange={e => setForm(prev => ({ ...prev, sourced_org_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Select...</option>
                {resellerSourcedOrgs.filter(o => o.status === 'active').map(o => (
                  <option key={o.id} value={o.id}>
                    {o.org_name} ({o.commission_rate}% - {o.recurring_months_paid}/{o.recurring_months_cap} months)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={form.commission_type}
                  onChange={e => setForm(prev => ({ ...prev, commission_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="one_time_setup">One-Time Setup</option>
                  <option value="recurring_monthly">Recurring Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gross Invoice Amount ($)</label>
                <input
                  type="number" step="0.01" value={form.gross_amount} placeholder="e.g. 3500.00"
                  onChange={e => setForm(prev => ({ ...prev, gross_amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            {grossCents > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/30 rounded-xl p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Commission Rate</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{commissionRate}%</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-400">Gross Amount</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{fmt(grossCents)}</span>
                </div>
                <div className="border-t border-purple-200 dark:border-purple-700 mt-2 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Commission Payout</span>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-300">{fmt(commissionCents)}</span>
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                value={form.notes} rows={2}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 p-5 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowAddCommission(false)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
            <button onClick={handleSubmit} disabled={saving || grossCents <= 0} className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Record Commission
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Partner Detail View ────────────────────────────────────

  const PartnerDetailView = () => {
    if (!selectedPartner) return null;

    const totalEarned = selectedPartner.total_earned_cents || 0;
    const totalPending = selectedPartner.total_pending_cents || 0;

    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setView('overview'); setSelectedPartnerId(null); }}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> Back to Partners
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowAddOrg(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Link Org
            </button>
            <button onClick={() => setShowAddCommission(true)} className="px-3 py-1.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> Record Commission
            </button>
          </div>
        </div>

        {/* Partner Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedPartner.name}</h3>
                <StatusBadge status={selectedPartner.status} />
              </div>
              {selectedPartner.company_name && <p className="text-sm text-gray-500">{selectedPartner.company_name}</p>}
              <p className="text-sm text-gray-500 mt-1">{selectedPartner.email}</p>
              {selectedPartner.phone && <p className="text-sm text-gray-500">{selectedPartner.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Default Rate</p>
              <p className="text-2xl font-bold text-purple-600">{selectedPartner.default_commission_rate}%</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Earned</p>
              <p className="text-lg font-bold text-green-600">{fmt(totalEarned)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Pending</p>
              <p className="text-lg font-bold text-yellow-600">{fmt(totalPending)}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase font-semibold">Stripe Connect</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedPartner.stripe_connected_account_id ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {selectedPartner.stripe_connected_account_id}
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Not connected
                  </span>
                )}
              </p>
            </div>
          </div>
          {selectedPartner.notes && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[11px] text-gray-500 uppercase font-semibold mb-1">Notes</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{selectedPartner.notes}</p>
            </div>
          )}
        </div>

        {/* Sourced Organizations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Sourced Organizations ({resellerSourcedOrgs.length})</h4>
          </div>
          {loading.resellerSourcedOrgs ? (
            <div className="p-8 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-purple-600" /></div>
          ) : resellerSourcedOrgs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No organizations linked yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Months</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Paid</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pending</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {resellerSourcedOrgs.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{org.org_name}</p>
                        <p className="text-[11px] text-gray-500">{org.subscription_tier || 'free'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{org.commission_type.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900 dark:text-white">{org.commission_rate}%</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                        {org.commission_type !== 'one_time' ? `${org.recurring_months_paid}/${org.recurring_months_cap}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{fmt(org.total_commission_paid_cents || 0)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-yellow-600">{fmt(org.total_commission_pending_cents || 0)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={org.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Commission History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Commission History ({resellerCommissions.length})</h4>
          </div>
          {loading.resellerCommissions ? (
            <div className="p-8 flex justify-center"><RefreshCw className="w-6 h-6 animate-spin text-purple-600" /></div>
          ) : resellerCommissions.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No commissions recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Organization</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Gross</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Commission</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {resellerCommissions.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{fmtDate(c.created_at)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{c.org_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {c.commission_type.replace(/_/g, ' ')}
                        {c.recurring_month_number && <span className="text-[11px] text-gray-400 ml-1">(mo {c.recurring_month_number})</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{fmt(c.gross_amount_cents)}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">{c.commission_rate}%</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 dark:text-white">{fmt(c.commission_amount_cents)}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-3 text-center">
                        {c.status === 'pending' && (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={async () => {
                                const result = await updateCommissionStatus(c.id, 'approved');
                                if (result.success) toast.success('Approved');
                                else toast.error(result.error || 'Failed');
                              }}
                              className="px-2 py-1 text-[11px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
                            >
                              Approve
                            </button>
                          </div>
                        )}
                        {c.status === 'approved' && (
                          <button
                            onClick={async () => {
                              const result = await updateCommissionStatus(c.id, 'paid');
                              if (result.success) toast.success('Marked as paid');
                              else toast.error(result.error || 'Failed');
                            }}
                            className="px-2 py-1 text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50"
                          >
                            Mark Paid
                          </button>
                        )}
                        {c.status === 'paid' && c.stripe_transfer_id && (
                          <a
                            href={`https://dashboard.stripe.com/connect/transfers/${c.stripe_transfer_id}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[11px] text-purple-600 hover:underline flex items-center justify-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> Stripe
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────

  if (loading.resellerPartners && resellerPartners.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {view === 'partner-detail' ? (
        <PartnerDetailView />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reseller Partners</h2>
              <p className="text-sm text-gray-500 mt-0.5">Manage partner commissions and Stripe Connect payouts</p>
            </div>
            <button
              onClick={() => setShowAddPartner(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Partner
            </button>
          </div>

          <KPICards />

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search partners by name, email, or company..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Partners Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filteredPartners.length === 0 ? (
              <div className="p-12 text-center">
                <Handshake className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No partners found</p>
                <button onClick={() => setShowAddPartner(true)} className="mt-3 text-sm text-purple-600 hover:underline">Add your first partner</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Partner</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Rate</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Sourced Orgs</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Earned</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pending</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Stripe</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPartners.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => openPartnerDetail(p.id)}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                          <p className="text-[11px] text-gray-500">{p.company_name || p.email}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-semibold text-purple-600">{p.default_commission_rate}%</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-900 dark:text-white">{p.sourced_orgs_count || 0}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{fmt(p.total_earned_cents || 0)}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-yellow-600">{fmt(p.total_pending_cents || 0)}</td>
                        <td className="px-4 py-3 text-center">
                          {p.stripe_connected_account_id ? (
                            <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => openPartnerDetail(p.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {showAddPartner && <AddPartnerModal />}
      {showAddOrg && <AddSourcedOrgModal />}
      {showAddCommission && <RecordCommissionModal />}
    </div>
  );
};
