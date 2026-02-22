import { create } from 'zustand';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';

export type SmsConsentStatus = 'opted_in' | 'opted_out' | 'pending_reopt' | null;

export interface SmsConsent {
  id: string;
  customer_id: string;
  organization_id: string;
  status: SmsConsentStatus;
  consent_given_at: string | null;
  opted_out_at: string | null;
  opted_out_method: string | null;
  reopt_requested_at: string | null;
  reopt_completed_at: string | null;
  admin_reenabled_by: string | null;
  admin_reenabled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SmsAuditEntry {
  id: string;
  sms_consent_id: string;
  action: string;
  performed_by: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

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

interface SmsConsentState {
  // Cache: customerId -> consent
  consentCache: Record<string, SmsConsent | null>;
  auditCache: Record<string, SmsAuditEntry[]>;
  loading: Record<string, boolean>;

  fetchConsent: (customerId: string, organizationId: string) => Promise<SmsConsent | null>;
  fetchAuditLog: (customerId: string, organizationId: string) => Promise<SmsAuditEntry[]>;
  requestReoptIn: (customerId: string, organizationId: string) => Promise<{ success: boolean; error?: string }>;
  invalidate: (customerId: string) => void;
}

export const useSmsConsentStore = create<SmsConsentState>()((set, get) => ({
  consentCache: {},
  auditCache: {},
  loading: {},

  fetchConsent: async (customerId: string, organizationId: string) => {
    const cacheKey = `${customerId}:${organizationId}`;
    const token = getAuthToken();
    if (!token) return null;

    set((s) => ({ loading: { ...s.loading, [cacheKey]: true } }));
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/sms_consent?customer_id=eq.${customerId}&organization_id=eq.${organizationId}&limit=1`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch SMS consent');
      const data: SmsConsent[] = await res.json();
      const consent = data[0] || null;

      set((s) => ({
        consentCache: { ...s.consentCache, [cacheKey]: consent },
        loading: { ...s.loading, [cacheKey]: false },
      }));
      return consent;
    } catch {
      set((s) => ({ loading: { ...s.loading, [cacheKey]: false } }));
      return null;
    }
  },

  fetchAuditLog: async (customerId: string, organizationId: string) => {
    const token = getAuthToken();
    if (!token) return [];

    const cacheKey = `${customerId}:${organizationId}`;

    // First get consent id
    const consent = await get().fetchConsent(customerId, organizationId);
    if (!consent) return [];

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/sms_consent_audit_log?sms_consent_id=eq.${consent.id}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error('Failed to fetch audit log');
      const data: SmsAuditEntry[] = await res.json();

      set((s) => ({ auditCache: { ...s.auditCache, [cacheKey]: data } }));
      return data;
    } catch {
      return [];
    }
  },

  requestReoptIn: async (customerId: string, organizationId: string) => {
    const token = getAuthToken();
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/send-reopt-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({ customer_id: customerId, organization_id: organizationId }),
      });

      const data = await res.json();
      if (data.success) {
        // Invalidate cache so UI refreshes
        get().invalidate(customerId);
      }
      return data;
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },

  invalidate: (customerId: string) => {
    set((s) => {
      const newCache = { ...s.consentCache };
      const newAudit = { ...s.auditCache };
      Object.keys(newCache).forEach((k) => {
        if (k.startsWith(`${customerId}:`)) {
          delete newCache[k];
          delete newAudit[k];
        }
      });
      return { consentCache: newCache, auditCache: newAudit };
    });
  },
}));
