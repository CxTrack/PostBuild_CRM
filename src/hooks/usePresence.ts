import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';
import type { PresenceStatus, UserPresence } from '@/types/chat.types';
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

export function usePresence() {
    const { user } = useAuthContext();
    const { currentOrganization } = useOrganizationStore();
    const [presenceMap, setPresenceMap] = useState<Map<string, UserPresence>>(new Map());
    const [manualStatus, setManualStatusState] = useState<{ status: PresenceStatus; message?: string } | null>(null);
    const lastActivityRef = useRef<number>(Date.now());
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isIdleRef = useRef(false);
    const manualStatusRef = useRef(manualStatus);

    // Keep ref in sync with state
    useEffect(() => {
        manualStatusRef.current = manualStatus;
    }, [manualStatus]);

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

    // Idle check interval
    useEffect(() => {
        if (!user?.id) return;

        idleCheckRef.current = setInterval(() => {
            if (manualStatusRef.current) return; // Don't override manual status

            const elapsed = Date.now() - lastActivityRef.current;
            if (elapsed >= IDLE_THRESHOLD && !isIdleRef.current) {
                isIdleRef.current = true;
                upsertPresence('idle');
            }
        }, 30_000); // Check every 30s

        return () => {
            if (idleCheckRef.current) clearInterval(idleCheckRef.current);
        };
    }, [user?.id, upsertPresence]);

    // Initial presence + heartbeat + cleanup
    useEffect(() => {
        if (!user?.id || !currentOrganization?.id) return;

        // Set online on mount
        upsertPresence('online');

        // Start heartbeat
        heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

        // Set offline on page close
        const handleBeforeUnload = () => {
            const token = getAuthToken();
            if (!token || !user?.id) return;
            // Use sendBeacon for reliable delivery on page close
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
            // Set offline on unmount
            upsertPresence('offline');
        };
    }, [user?.id, currentOrganization?.id, upsertPresence, sendHeartbeat]);

    // Subscribe to presence changes for all org members
    useEffect(() => {
        if (!currentOrganization?.id) return;

        // Initial fetch of all org presence
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

        // Realtime subscription for changes
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
        setManualStatusState({ status, message: customMessage });
        await upsertPresence(status, customMessage);
    }, [upsertPresence]);

    const clearManualStatus = useCallback(async () => {
        setManualStatusState(null);
        isIdleRef.current = false;
        lastActivityRef.current = Date.now();
        await upsertPresence('online');
    }, [upsertPresence]);

    return { presenceMap, getPresenceStatus, setMyStatus, clearManualStatus, manualStatus };
}
