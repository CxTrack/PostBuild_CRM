import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import type { PresenceStatus, UserPresence, OrganizationChatPolicy } from '@/types/chat.types';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOrganizationStore } from '@/stores/organizationStore';

const HEARTBEAT_INTERVAL = 60_000; // 60 seconds
const IDLE_THRESHOLD = 15 * 60_000; // 15 minutes

function getAuthToken(): string | null {
    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
                const stored = JSON.parse(localStorage.getItem(key) || '');
                if (stored?.access_token) return stored.access_token;
            } catch { /* ignore */ }
        }
    }
    return null;
}

const DEFAULT_POLICY: OrganizationChatPolicy = {
    organization_id: '',
    enforce_honest_presence: false,
    enforce_read_receipts: false,
    allow_status_dnd: true,
    allow_status_away: true,
};

export function usePresence() {
    const { user } = useAuthContext();
    const { currentOrganization } = useOrganizationStore();
    const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
    const [manualStatus, setManualStatusState] = useState<{ status: PresenceStatus; message?: string } | null>(null);
    const [chatPolicy, setChatPolicy] = useState<OrganizationChatPolicy>(DEFAULT_POLICY);
    const [autoReply, setAutoReplyState] = useState<{ enabled: boolean; message: string }>({ enabled: false, message: '' });
    const lastActivityRef = useRef<number>(Date.now());
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isIdleRef = useRef(false);
    const manualStatusRef = useRef(manualStatus);
    const chatPolicyRef = useRef(chatPolicy);

    // Keep refs in sync with state
    useEffect(() => { manualStatusRef.current = manualStatus; }, [manualStatus]);
    useEffect(() => { chatPolicyRef.current = chatPolicy; }, [chatPolicy]);

    // Fetch org chat policies
    useEffect(() => {
        if (!currentOrganization?.id) return;

        const fetchPolicy = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await fetch(
                    `${supabaseUrl}/rest/v1/organization_chat_policies?organization_id=eq.${currentOrganization.id}&select=*`,
                    { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setChatPolicy(data[0]);
                    }
                }
            } catch { /* silent */ }
        };

        fetchPolicy();

        // Subscribe to policy changes in real-time
        const channel = supabase
            .channel('chat-policy-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'organization_chat_policies',
                filter: `organization_id=eq.${currentOrganization.id}`,
            }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    setChatPolicy(DEFAULT_POLICY);
                } else {
                    setChatPolicy(payload.new as OrganizationChatPolicy);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentOrganization?.id]);

    // Upsert presence to DB
    const upsertPresence = useCallback(async (status: PresenceStatus, customMessage?: string) => {
        const token = getAuthToken();
        const orgId = currentOrganization?.id;
        if (!token || !user?.id || !orgId) return;

        try {
            await fetch(`${supabaseUrl}/rest/v1/user_presence`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates',
                },
                body: JSON.stringify({
                    user_id: user.id,
                    organization_id: orgId,
                    status,
                    custom_message: customMessage || null,
                    last_seen_at: new Date().toISOString(),
                    last_heartbeat_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }),
            });
        } catch (err) {
            console.error('[Presence] upsert failed:', err);
        }
    }, [user?.id, currentOrganization?.id]);

    // Heartbeat - update last_heartbeat_at without changing status
    const sendHeartbeat = useCallback(async () => {
        const token = getAuthToken();
        if (!token || !user?.id) return;

        try {
            await fetch(`${supabaseUrl}/rest/v1/user_presence?user_id=eq.${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    last_heartbeat_at: new Date().toISOString(),
                    last_seen_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }),
            });
        } catch { /* silent */ }
    }, [user?.id]);

    // Activity listeners for idle detection
    useEffect(() => {
        if (!user?.id) return;

        const handleActivity = () => {
            lastActivityRef.current = Date.now();

            // If was idle and no manual override, go back to online
            if (isIdleRef.current && !manualStatusRef.current) {
                isIdleRef.current = false;
                upsertPresence('online');
            }
        };

        const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(evt => document.addEventListener(evt, handleActivity, { passive: true }));

        return () => {
            events.forEach(evt => document.removeEventListener(evt, handleActivity));
        };
    }, [user?.id, upsertPresence]);

    // Idle check interval - now policy-aware
    useEffect(() => {
        if (!user?.id) return;

        idleCheckRef.current = setInterval(() => {
            const policy = chatPolicyRef.current;
            const manual = manualStatusRef.current;

            // If enforce_honest_presence is ON:
            // - Always mark idle after threshold regardless of manual status
            // - Only DND overrides idle if policy allows it
            if (policy.enforce_honest_presence) {
                const elapsed = Date.now() - lastActivityRef.current;
                if (elapsed >= IDLE_THRESHOLD && !isIdleRef.current) {
                    // If manual DND is set and policy allows DND, keep DND
                    if (manual?.status === 'dnd' && policy.allow_status_dnd) return;
                    isIdleRef.current = true;
                    upsertPresence('idle');
                }
            } else {
                // Standard behavior: don't override manual status
                if (manual) return;
                const elapsed = Date.now() - lastActivityRef.current;
                if (elapsed >= IDLE_THRESHOLD && !isIdleRef.current) {
                    isIdleRef.current = true;
                    upsertPresence('idle');
                }
            }
        }, 30_000);

        return () => {
            if (idleCheckRef.current) clearInterval(idleCheckRef.current);
        };
    }, [user?.id, upsertPresence]);

    // Initial presence + heartbeat + cleanup
    useEffect(() => {
        if (!user?.id || !currentOrganization?.id) return;

        // Set online on mount
        upsertPresence('online');

        // Also fetch my auto-reply settings
        const fetchMyPresence = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await fetch(
                    `${supabaseUrl}/rest/v1/user_presence?user_id=eq.${user.id}&select=auto_reply_enabled,auto_reply_message`,
                    { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setAutoReplyState({
                            enabled: data[0].auto_reply_enabled || false,
                            message: data[0].auto_reply_message || '',
                        });
                    }
                }
            } catch { /* silent */ }
        };
        fetchMyPresence();

        // Start heartbeat
        heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Set offline on page close
        const handleBeforeUnload = () => {
            const token = getAuthToken();
            if (!token || !user?.id) return;
            const body = JSON.stringify({
                user_id: user.id,
                status: 'offline',
                last_seen_at: new Date().toISOString(),
                last_heartbeat_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
            navigator.sendBeacon?.(
                `${supabaseUrl}/rest/v1/user_presence?user_id=eq.${user.id}`,
                new Blob([body], { type: 'application/json' })
            );
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            upsertPresence('offline');
        };
    }, [user?.id, currentOrganization?.id, upsertPresence, sendHeartbeat]);

    // Subscribe to presence changes for all org members
    useEffect(() => {
        if (!currentOrganization?.id) return;

        const fetchAllPresence = async () => {
            const token = getAuthToken();
            if (!token) return;
            try {
                const res = await fetch(
                    `${supabaseUrl}/rest/v1/user_presence?organization_id=eq.${currentOrganization.id}&select=*`,
                    { headers: { 'Authorization': `Bearer ${token}`, 'apikey': supabaseAnonKey } }
                );
                if (res.ok) {
                    const data: UserPresence[] = await res.json();
                    const map = new Map<string, UserPresence>();
                    data.forEach(p => map.set(p.user_id, p));
                    setPresenceMap(map);
                }
            } catch { /* silent */ }
        };

        fetchAllPresence();

        const channel = supabase
            .channel('presence-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_presence',
                filter: `organization_id=eq.${currentOrganization.id}`,
            }, (payload) => {
                const record = (payload.new || payload.old) as UserPresence;
                if (!record?.user_id) return;

                if (payload.eventType === 'DELETE') {
                    setPresenceMap(prev => {
                        const next = new Map(prev);
                        next.delete(record.user_id);
                        return next;
                    });
                } else {
                    setPresenceMap(prev => {
                        const next = new Map(prev);
                        next.set(record.user_id, record as UserPresence);
                        return next;
                    });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentOrganization?.id]);

    // Public API
    const getPresenceStatus = useCallback((userId: string): UserPresence | null => {
        return presenceMap.get(userId) || null;
    }, [presenceMap]);

    const setMyStatus = useCallback(async (status: PresenceStatus, customMessage?: string) => {
        // Policy enforcement: block certain statuses
        if (chatPolicyRef.current.enforce_honest_presence && status === 'online' && isIdleRef.current) {
            // Can't fake "online" when actually idle under honest presence
            return;
        }
        if (!chatPolicyRef.current.allow_status_dnd && status === 'dnd') return;
        if (!chatPolicyRef.current.allow_status_away && status === 'away') return;

        setManualStatusState({ status, message: customMessage });
        await upsertPresence(status, customMessage);
    }, [upsertPresence]);

    const clearManualStatus = useCallback(async () => {
        setManualStatusState(null);
        isIdleRef.current = false;
        lastActivityRef.current = Date.now();
        await upsertPresence('online');
    }, [upsertPresence]);

    // Auto-reply management
    const setAutoReply = useCallback(async (enabled: boolean, message: string) => {
        const token = getAuthToken();
        if (!token || !user?.id) return;

        setAutoReplyState({ enabled, message });

        try {
            await fetch(`${supabaseUrl}/rest/v1/user_presence?user_id=eq.${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    auto_reply_enabled: enabled,
                    auto_reply_message: message || null,
                    updated_at: new Date().toISOString(),
                }),
            });
        } catch (err) {
            console.error('[Presence] auto-reply update failed:', err);
        }
    }, [user?.id]);

    // Save/update org chat policy (admin only)
    const saveChatPolicy = useCallback(async (policy: Partial<OrganizationChatPolicy>) => {
        const token = getAuthToken();
        const orgId = currentOrganization?.id;
        if (!token || !orgId || !user?.id) return;

        try {
            await fetch(`${supabaseUrl}/rest/v1/organization_chat_policies`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'apikey': supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates',
                },
                body: JSON.stringify({
                    organization_id: orgId,
                    ...policy,
                    updated_by: user.id,
                    updated_at: new Date().toISOString(),
                }),
            });
        } catch (err) {
            console.error('[Presence] policy save failed:', err);
        }
    }, [user?.id, currentOrganization?.id]);

    return {
        presenceMap,
        getPresenceStatus,
        setMyStatus,
        clearManualStatus,
        manualStatus,
        chatPolicy,
        saveChatPolicy,
        autoReply,
        setAutoReply,
    };
}
