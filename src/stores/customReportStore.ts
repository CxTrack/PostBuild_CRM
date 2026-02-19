import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import type { CustomReport, ReportConfig, ReportShare } from '../components/reports/reportFieldMeta';

const getAuthToken = (): string | null => {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || '');
        if (stored?.access_token) return stored.access_token;
      } catch { /* ignore */ }
    }
  }
  return null;
};

async function supabaseRpc<T = any>(fnName: string, params: Record<string, any> = {}): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`RPC ${fnName} failed: ${err}`);
  }
  return res.json();
}

async function supabaseRest<T = any>(
  path: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
): Promise<T> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Prefer': options.method === 'POST' ? 'return=representation' : 'return=representation',
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`REST ${path} failed: ${err}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ([] as any);
}

interface CustomReportState {
  reports: CustomReport[];
  loading: boolean;
  executing: boolean;
  executionResult: Record<string, any>[] | null;
  error: string | null;

  fetchReports: (organizationId: string) => Promise<void>;
  createReport: (organizationId: string, name: string, description: string | null, config: ReportConfig) => Promise<CustomReport>;
  updateReport: (id: string, updates: Partial<Pick<CustomReport, 'name' | 'description' | 'report_config' | 'is_public' | 'is_favorite'>>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  duplicateReport: (report: CustomReport) => Promise<CustomReport>;
  executeReport: (organizationId: string, config: ReportConfig) => Promise<Record<string, any>[]>;
  toggleFavorite: (id: string, currentValue: boolean) => Promise<void>;
  togglePublic: (id: string, currentValue: boolean) => Promise<void>;

  // Shares
  fetchShares: (reportId: string) => Promise<ReportShare[]>;
  addShare: (reportId: string, userId: string, permission: 'viewer' | 'editor') => Promise<void>;
  updateShare: (shareId: string, permission: 'viewer' | 'editor') => Promise<void>;
  removeShare: (shareId: string) => Promise<void>;

  // Org members for sharing
  fetchOrgMembers: (organizationId: string) => Promise<{ id: string; email: string; full_name: string }[]>;

  clearError: () => void;
  clearExecutionResult: () => void;
}

export const useCustomReportStore = create<CustomReportState>((set, get) => ({
  reports: [],
  loading: false,
  executing: false,
  executionResult: null,
  error: null,

  fetchReports: async (organizationId: string) => {
    set({ loading: true, error: null });
    try {
      const reports = await supabaseRest<CustomReport[]>(
        `custom_reports?organization_id=eq.${organizationId}&order=updated_at.desc`
      );
      set({ reports, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  createReport: async (organizationId, name, description, config) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');

    // Decode JWT to get user ID
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userId = payload.sub;

    const [created] = await supabaseRest<CustomReport[]>(
      'custom_reports',
      {
        method: 'POST',
        body: {
          organization_id: organizationId,
          created_by: userId,
          name,
          description,
          report_config: config,
        },
      }
    );
    set({ reports: [created, ...get().reports] });
    return created;
  },

  updateReport: async (id, updates) => {
    await supabaseRest(
      `custom_reports?id=eq.${id}`,
      { method: 'PATCH', body: { ...updates, updated_at: new Date().toISOString() } }
    );
    set({
      reports: get().reports.map(r =>
        r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r
      ),
    });
  },

  deleteReport: async (id) => {
    await supabaseRest(`custom_reports?id=eq.${id}`, { method: 'DELETE' });
    set({ reports: get().reports.filter(r => r.id !== id) });
  },

  duplicateReport: async (report) => {
    const created = await get().createReport(
      report.organization_id,
      `${report.name} (Copy)`,
      report.description,
      report.report_config
    );
    return created;
  },

  executeReport: async (organizationId, config) => {
    set({ executing: true, error: null });
    try {
      const result = await supabaseRpc<Record<string, any>[]>('execute_custom_report', {
        p_organization_id: organizationId,
        p_config: config,
      });
      const data = Array.isArray(result) ? result : [];
      set({ executionResult: data, executing: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, executing: false, executionResult: null });
      return [];
    }
  },

  toggleFavorite: async (id, currentValue) => {
    await get().updateReport(id, { is_favorite: !currentValue });
  },

  togglePublic: async (id, currentValue) => {
    await get().updateReport(id, { is_public: !currentValue });
  },

  fetchShares: async (reportId) => {
    const shares = await supabaseRest<any[]>(
      `custom_report_shares?report_id=eq.${reportId}&select=*`
    );
    // Enrich with user info
    const enriched: ReportShare[] = [];
    for (const share of shares) {
      try {
        const profiles = await supabaseRest<any[]>(
          `user_profiles?id=eq.${share.shared_with_user_id}&select=email,full_name`
        );
        enriched.push({
          ...share,
          user_email: profiles[0]?.email || 'Unknown',
          user_name: profiles[0]?.full_name || '',
        });
      } catch {
        enriched.push({ ...share, user_email: 'Unknown', user_name: '' });
      }
    }
    return enriched;
  },

  addShare: async (reportId, userId, permission) => {
    const token = getAuthToken();
    if (!token) throw new Error('Not authenticated');
    const payload = JSON.parse(atob(token.split('.')[1]));
    await supabaseRest('custom_report_shares', {
      method: 'POST',
      body: {
        report_id: reportId,
        shared_by: payload.sub,
        shared_with_user_id: userId,
        permission,
      },
    });
  },

  updateShare: async (shareId, permission) => {
    await supabaseRest(
      `custom_report_shares?id=eq.${shareId}`,
      { method: 'PATCH', body: { permission } }
    );
  },

  removeShare: async (shareId) => {
    await supabaseRest(`custom_report_shares?id=eq.${shareId}`, { method: 'DELETE' });
  },

  fetchOrgMembers: async (organizationId) => {
    const members = await supabaseRest<any[]>(
      `organization_members?organization_id=eq.${organizationId}&select=user_id,user_profiles!organization_members_user_id_fkey(id,email,full_name)`
    );
    return members.map((m: any) => ({
      id: m.user_id,
      email: m.user_profiles?.email || '',
      full_name: m.user_profiles?.full_name || '',
    }));
  },

  clearError: () => set({ error: null }),
  clearExecutionResult: () => set({ executionResult: null }),
}));
