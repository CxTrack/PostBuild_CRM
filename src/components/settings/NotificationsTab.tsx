/**
 * Notifications Tab Component
 * Email, push, and digest notification preferences -- DB-backed via notification_preferences table.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Mail, Smartphone, Volume2, MessageSquare,
  Users, Calendar, CheckCircle, Zap, Clock, Loader2, Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { useOrganizationStore } from '@/stores/organizationStore';
import { supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

interface NotificationPreferences {
  // Email
  email_new_leads: boolean;
  email_deal_changes: boolean;
  email_task_reminders: boolean;
  email_team_mentions: boolean;
  email_marketing: boolean;

  // Digest
  email_digest_enabled: boolean;
  email_digest_frequency: 'daily' | 'weekly' | 'none';
  email_digest_time: string; // HH:MM
  email_digest_timezone: string;

  // Push
  push_desktop: boolean;
  push_mobile: boolean;
  push_sound: boolean;

  // In-App
  inapp_messages: boolean;
  inapp_updates: boolean;

  // Quiet Hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // HH:MM
  quiet_hours_end: string;   // HH:MM
}

const DEFAULT_PREFS: NotificationPreferences = {
  email_new_leads: true,
  email_deal_changes: true,
  email_task_reminders: true,
  email_team_mentions: true,
  email_marketing: false,
  email_digest_enabled: true,
  email_digest_frequency: 'daily',
  email_digest_time: '08:00',
  email_digest_timezone: 'America/Toronto',
  push_desktop: true,
  push_mobile: true,
  push_sound: true,
  inapp_messages: true,
  inapp_updates: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
};

// Common timezone options
const TIMEZONE_OPTIONS = [
  { value: 'America/St_Johns', label: 'Newfoundland (NST)' },
  { value: 'America/Halifax', label: 'Atlantic (AST)' },
  { value: 'America/Toronto', label: 'Eastern (EST)' },
  { value: 'America/Winnipeg', label: 'Central (CST)' },
  { value: 'America/Edmonton', label: 'Mountain (MST)' },
  { value: 'America/Vancouver', label: 'Pacific (PST)' },
  { value: 'America/New_York', label: 'US Eastern (EST)' },
  { value: 'America/Chicago', label: 'US Central (CST)' },
  { value: 'America/Denver', label: 'US Mountain (MST)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PST)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central Europe (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

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

export const NotificationsTab: React.FC = () => {
  const { user } = useAuthStore();
  const { currentOrganization } = useOrganizationStore();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch preferences from DB
  useEffect(() => {
    if (!user?.id || !currentOrganization?.id) return;

    const fetchPrefs = async () => {
      const token = getAuthToken();
      if (!token) { setLoading(false); return; }

      try {
        const res = await fetch(
          `${supabaseUrl}/rest/v1/notification_preferences?user_id=eq.${user.id}&organization_id=eq.${currentOrganization.id}&select=*&limit=1`,
          {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        if (!res.ok) throw new Error('fetch failed');
        const rows = await res.json();
        if (rows.length > 0) {
          const row = rows[0];
          setPrefs({
            email_new_leads: row.email_new_leads,
            email_deal_changes: row.email_deal_changes,
            email_task_reminders: row.email_task_reminders,
            email_team_mentions: row.email_team_mentions,
            email_marketing: row.email_marketing,
            email_digest_enabled: row.email_digest_enabled,
            email_digest_frequency: row.email_digest_frequency,
            email_digest_time: row.email_digest_time?.slice(0, 5) || '08:00',
            email_digest_timezone: row.email_digest_timezone || currentOrganization.timezone || 'America/Toronto',
            push_desktop: row.push_desktop,
            push_mobile: row.push_mobile,
            push_sound: row.push_sound,
            inapp_messages: row.inapp_messages,
            inapp_updates: row.inapp_updates,
            quiet_hours_enabled: row.quiet_hours_enabled,
            quiet_hours_start: row.quiet_hours_start?.slice(0, 5) || '22:00',
            quiet_hours_end: row.quiet_hours_end?.slice(0, 5) || '08:00',
          });
        } else {
          // Use org timezone as default for new records
          setPrefs(p => ({
            ...p,
            email_digest_timezone: currentOrganization.timezone || 'America/Toronto',
          }));
        }
      } catch {
        // Fall back to defaults silently
      } finally {
        setLoading(false);
      }
    };

    fetchPrefs();
  }, [user?.id, currentOrganization?.id, currentOrganization?.timezone]);

  // Upsert preferences to DB (debounced)
  const savePrefs = useCallback((updated: NotificationPreferences) => {
    if (!user?.id || !currentOrganization?.id) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = getAuthToken();
      if (!token) return;

      setSaving(true);
      try {
        const body = {
          user_id: user.id,
          organization_id: currentOrganization.id,
          ...updated,
        };

        const res = await fetch(
          `${supabaseUrl}/rest/v1/notification_preferences`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) throw new Error('save failed');
      } catch {
        toast.error('Failed to save preferences');
      } finally {
        setSaving(false);
      }
    }, 400);
  }, [user?.id, currentOrganization?.id]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    savePrefs(updated);
  };

  const handleChange = (key: keyof NotificationPreferences, value: string) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefs(updated);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
    </label>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Notification Preferences
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Control how and when you receive notifications
          </p>
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </div>
        )}
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Email Notifications</h3>
            <p className="text-sm text-gray-500">Receive updates via email</p>
          </div>
        </div>

        <div className="space-y-1">
          {([
            { key: 'email_new_leads', label: 'New leads assigned to me', description: 'Get notified when a lead is assigned to you', icon: Users },
            { key: 'email_deal_changes', label: 'Deal status changes', description: 'Updates when deals move through your pipeline', icon: Zap },
            { key: 'email_task_reminders', label: 'Task reminders', description: 'Reminders for upcoming and overdue tasks', icon: CheckCircle },
            { key: 'email_team_mentions', label: 'Team mentions', description: 'When someone mentions you in notes or comments', icon: MessageSquare },
            { key: 'email_marketing', label: 'Product updates & tips', description: 'News about new features and best practices', icon: Bell },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={prefs[item.key]}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* AI Quarterback Digest */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">AI Quarterback Digest</h3>
            <p className="text-sm text-gray-500">Get a summary of your top insights delivered to your inbox</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email digest</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Receive a summary of actionable QB insights</p>
              </div>
            </div>
            <ToggleSwitch
              checked={prefs.email_digest_enabled}
              onChange={() => handleToggle('email_digest_enabled')}
            />
          </div>

          {/* Digest options (shown when enabled) */}
          {prefs.email_digest_enabled && (
            <div className="ml-9 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-4">
              {/* Frequency */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Frequency</label>
                <select
                  value={prefs.email_digest_frequency}
                  onChange={(e) => handleChange('email_digest_frequency', e.target.value)}
                  className="flex-1 max-w-xs px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (Mondays)</option>
                  <option value="none">Disabled</option>
                </select>
              </div>

              {/* Delivery time */}
              {prefs.email_digest_frequency !== 'none' && (
                <>
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Send at</label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <input
                        type="time"
                        value={prefs.email_digest_time}
                        onChange={(e) => handleChange('email_digest_time', e.target.value)}
                        className="px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Timezone */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">Timezone</label>
                    <select
                      value={prefs.email_digest_timezone}
                      onChange={(e) => handleChange('email_digest_timezone', e.target.value)}
                      className="flex-1 max-w-xs px-3 py-2 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                    >
                      {TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Push Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Push Notifications</h3>
            <p className="text-sm text-gray-500">Real-time alerts on your devices</p>
          </div>
        </div>

        <div className="space-y-1">
          {([
            { key: 'push_desktop', label: 'Desktop notifications', description: 'Show notifications on your desktop browser', icon: Bell },
            { key: 'push_mobile', label: 'Mobile notifications', description: 'Receive push notifications on mobile devices', icon: Smartphone },
            { key: 'push_sound', label: 'Sound alerts', description: 'Play sound when notifications arrive', icon: Volume2 },
          ] as const).map(item => (
            <div key={item.key} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <div className="flex items-center gap-4">
                <item.icon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                </div>
              </div>
              <ToggleSwitch
                checked={prefs[item.key]}
                onChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Moon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quiet Hours</h3>
            <p className="text-sm text-gray-500">Pause notifications during specific times</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <div className="flex items-center gap-4">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enable quiet hours</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mute notifications during set times</p>
              </div>
            </div>
            <ToggleSwitch
              checked={prefs.quiet_hours_enabled}
              onChange={() => handleToggle('quiet_hours_enabled')}
            />
          </div>

          {prefs.quiet_hours_enabled && (
            <div className="flex items-center gap-4 px-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">From</label>
                <input
                  type="time"
                  value={prefs.quiet_hours_start}
                  onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">To</label>
                <input
                  type="time"
                  value={prefs.quiet_hours_end}
                  onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
