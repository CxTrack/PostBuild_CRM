import { useState, useEffect } from 'react';
import { Search, GitMerge, AlertTriangle, Loader2, CheckCircle2, Building2, Users, ChevronRight, X } from 'lucide-react';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import toast from 'react-hot-toast';

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* skip */ }
    }
  }
  return null;
};

interface DuplicateGroup {
  primary_name: string;
  primary_id: string;
  duplicate_name: string;
  duplicate_id: string;
  similarity: number;
}

interface OrgDetail {
  id: string;
  name: string;
  industry_template: string;
  subscription_tier: string;
  member_count: number;
  customer_count: number;
  created_at: string;
}

export const OrgMergeTool = () => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [selectedPair, setSelectedPair] = useState<{ primary: OrgDetail; secondary: OrgDetail } | null>(null);
  const [mergeComplete, setMergeComplete] = useState<string | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/find_duplicate_organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
        body: '{}',
      });

      if (!res.ok) throw new Error(`Failed to fetch duplicates (${res.status})`);
      const data = await res.json();
      setDuplicates(data || []);
    } catch (err) {
      console.error('[OrgMerge] Fetch duplicates error:', err);
      toast.error('Failed to scan for duplicates');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgDetail = async (orgId: string): Promise<OrgDetail | null> => {
    const token = getAuthToken();
    if (!token) return null;

    try {
      // Fetch org info
      const orgRes = await fetch(
        `${supabaseUrl}/rest/v1/organizations?id=eq.${orgId}&select=id,name,industry_template,subscription_tier,created_at&limit=1`,
        { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } }
      );
      if (!orgRes.ok) return null;
      const orgs = await orgRes.json();
      if (!orgs.length) return null;

      // Fetch member count
      const memberRes = await fetch(
        `${supabaseUrl}/rest/v1/organization_members?organization_id=eq.${orgId}&select=id`,
        { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } }
      );
      const members = memberRes.ok ? await memberRes.json() : [];

      // Fetch customer count
      const custRes = await fetch(
        `${supabaseUrl}/rest/v1/customers?organization_id=eq.${orgId}&select=id`,
        { headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${token}` } }
      );
      const customers = custRes.ok ? await custRes.json() : [];

      return {
        ...orgs[0],
        member_count: members.length,
        customer_count: customers.length,
      };
    } catch {
      return null;
    }
  };

  const handleSelectPair = async (primaryId: string, secondaryId: string) => {
    setLoading(true);
    try {
      const [primary, secondary] = await Promise.all([
        fetchOrgDetail(primaryId),
        fetchOrgDetail(secondaryId),
      ]);

      if (!primary || !secondary) {
        toast.error('Failed to load organization details');
        return;
      }

      setSelectedPair({ primary, secondary });
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedPair) return;

    setMerging(true);
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/merge_organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          p_primary_id: selectedPair.primary.id,
          p_secondary_id: selectedPair.secondary.id,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(errBody || `Merge failed (${res.status})`);
      }

      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Merge failed');

      setMergeComplete(selectedPair.secondary.name);
      toast.success(`Successfully merged "${selectedPair.secondary.name}" into "${selectedPair.primary.name}"`);
      setSelectedPair(null);

      // Refresh duplicates list
      await fetchDuplicates();
    } catch (err: any) {
      toast.error(err.message || 'Merge failed');
    } finally {
      setMerging(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  // Group duplicates by primary org
  const grouped = duplicates.reduce<Record<string, DuplicateGroup[]>>((acc, d) => {
    const key = d.primary_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
              <GitMerge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Organization Merge Tool</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Detect and merge duplicate organizations created from misspelled names
              </p>
            </div>
          </div>
          <button
            onClick={fetchDuplicates}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Scan for Duplicates
          </button>
        </div>
      </div>

      {/* Merge Complete Banner */}
      {mergeComplete && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-800 dark:text-green-300">
              <strong>"{mergeComplete}"</strong> was merged and marked as inactive. All data has been migrated.
            </p>
          </div>
          <button onClick={() => setMergeComplete(null)} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Merge Preview Modal */}
      {selectedPair && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Merge Preview
            </h3>
            <button
              onClick={() => setSelectedPair(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
            {/* Primary org */}
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">Keep (Primary)</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPair.primary.name}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{selectedPair.primary.member_count} members</p>
                <p>{selectedPair.primary.customer_count} customers</p>
                <p className="capitalize">{selectedPair.primary.subscription_tier} plan</p>
              </div>
            </div>

            <div className="flex justify-center">
              <ChevronRight className="w-6 h-6 text-gray-400 rotate-0 md:rotate-0" />
            </div>

            {/* Secondary org */}
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">Merge Into Primary</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedPair.secondary.name}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{selectedPair.secondary.member_count} members (will be moved)</p>
                <p>{selectedPair.secondary.customer_count} customers (will be moved)</p>
                <p className="capitalize">{selectedPair.secondary.subscription_tier} plan</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>What will happen:</strong> All members, customers, invoices, quotes, tasks, deals, call logs, and voice configs
              from "{selectedPair.secondary.name}" will be moved to "{selectedPair.primary.name}".
              The secondary org will be marked as "merged" and deactivated.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setSelectedPair(null)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm rounded-xl border border-gray-200 dark:border-gray-600 hover:border-gray-400 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleMerge}
              disabled={merging}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {merging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <GitMerge className="w-4 h-4" />
              )}
              Confirm Merge
            </button>
          </div>
        </div>
      )}

      {/* Duplicate Groups */}
      {loading && !duplicates.length ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Scanning for duplicate organizations...</p>
        </div>
      ) : duplicates.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">No duplicate organizations detected</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">All organization names appear unique</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Found <strong>{duplicates.length}</strong> potential duplicate{duplicates.length !== 1 ? 's' : ''} across <strong>{Object.keys(grouped).length}</strong> organization{Object.keys(grouped).length !== 1 ? 's' : ''}
          </p>

          {Object.entries(grouped).map(([primaryId, pairs]) => (
            <div key={primaryId} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-900 dark:text-white">{pairs[0].primary_name}</span>
                <span className="text-xs text-gray-400 ml-auto">{pairs.length} duplicate{pairs.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {pairs.map((pair) => (
                  <div key={pair.duplicate_id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{pair.duplicate_name}</p>
                        <p className="text-xs text-gray-400">
                          {Math.round(pair.similarity * 100)}% similar
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectPair(pair.primary_id, pair.duplicate_id)}
                      disabled={loading}
                      className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-lg transition-colors"
                    >
                      Review & Merge
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
