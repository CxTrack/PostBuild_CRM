import { useState, useEffect } from 'react';
import {
  Calendar, ExternalLink, Palette, Cloud, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function CalendarSettings() {
  const { currentOrganization } = useOrganizationStore();
  const { outlookNeedsReauth, fetchOutlookTodayEvents, outlookEvents, outlookLoading } = useCalendarStore();
  const [checking, setChecking] = useState(false);

  const [settings, setSettings] = useState({
    auto_sync: true,
    sync_interval: 15,
    default_view: 'week',
    week_start_day: 1,
    time_format: '12h',
    show_weekends: true,
    show_agenda_panel: true,
    event_colors: {
      appointment: '#6366f1',
      meeting: '#10b981',
      call: '#f59e0b',
      task: '#8b5cf6',
      reminder: '#ec4899'
    },
    booking_provider: 'native' as 'native' | 'outlook',
    booking_slug: ''
  });

  useEffect(() => {
    loadSettings();
    fetchOutlookTodayEvents();
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization?.id) return;

    try {
      // Load organization booking settings
      if (currentOrganization?.metadata) {
        setSettings(prev => ({
          ...prev,
          booking_provider: (currentOrganization.metadata as any).booking_provider || 'native',
          booking_slug: currentOrganization.slug || ''
        }));
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    try {
      await fetchOutlookTodayEvents();
      if (!outlookNeedsReauth) {
        toast.success('Microsoft Calendar connected successfully!');
      } else {
        toast.error('Calendar access needs re-authorization. Please reconnect in Email Settings.');
      }
    } catch {
      toast.error('Failed to check calendar connection.');
    } finally {
      setChecking(false);
    }
  };

  const saveSettings = async () => {
    if (!currentOrganization?.id) return;

    try {
      // Update organization metadata and slug
      await useOrganizationStore.getState().updateOrganization({
        slug: settings.booking_slug,
        metadata: {
          ...currentOrganization.metadata as any,
          booking_provider: settings.booking_provider
        }
      });

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const isOutlookConnected = !outlookNeedsReauth && !outlookLoading;

  return (
    <div className="space-y-6">
      {/* Microsoft Calendar Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Cloud size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
              Microsoft Calendar
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your Outlook calendar events are synced automatically
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
            outlookLoading
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              : isOutlookConnected
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}>
            {outlookLoading ? (
              'Checking...'
            ) : isOutlookConnected ? (
              <>
                <CheckCircle2 size={12} />
                Connected
              </>
            ) : (
              <>
                <AlertCircle size={12} />
                Needs Setup
              </>
            )}
          </span>
        </div>

        <div className="space-y-4">
          {isOutlookConnected && (
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">Connected to Microsoft Outlook</p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {outlookEvents.length > 0
                      ? `${outlookEvents.length} event${outlookEvents.length !== 1 ? 's' : ''} synced for today`
                      : 'No events scheduled for today'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {outlookNeedsReauth && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Calendar access needed</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Please go to Email Settings and reconnect your Microsoft account to grant calendar access.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <button
              onClick={handleCheckConnection}
              disabled={checking || outlookLoading}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {checking ? 'Checking...' : 'Check Connection'}
            </button>

            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Booking Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          Booking Integration
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Public Booking Slug
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 text-sm">
                  cxtrack.com/book/
                </span>
                <input
                  type="text"
                  value={settings.booking_slug}
                  onChange={(e) => setSettings({ ...settings, booking_slug: e.target.value })}
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-r-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="my-business"
                />
              </div>
              {settings.booking_slug && (
                <a
                  href={`/book/${settings.booking_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View public booking page <ExternalLink size={10} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Calendar size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          View Preferences
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default View
            </label>
            <select
              value={settings.default_view}
              onChange={(e) => setSettings({ ...settings, default_view: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
              <option value="agenda">Agenda</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Week Starts On
            </label>
            <select
              value={settings.week_start_day}
              onChange={(e) => setSettings({ ...settings, week_start_day: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="0">Sunday</option>
              <option value="1">Monday</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Format
            </label>
            <select
              value={settings.time_format}
              onChange={(e) => setSettings({ ...settings, time_format: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="12h">12-hour (9:00 AM)</option>
              <option value="24h">24-hour (09:00)</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="show_weekends"
              checked={settings.show_weekends}
              onChange={(e) => setSettings({ ...settings, show_weekends: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="show_weekends" className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Show Weekends
            </label>
          </div>
        </div>
      </div>

      {/* Event Colors */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
          <Palette size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
          Event Colors
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(settings.event_colors).map(([type, color]) => (
            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {type}
              </span>
              <input
                type="color"
                value={color}
                onChange={(e) => setSettings({
                  ...settings,
                  event_colors: { ...settings.event_colors, [type]: e.target.value }
                })}
                className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
            </div>
          ))}
          {/* Outlook events use a fixed purple color */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center gap-2">
              Outlook
              <span className="text-xs text-gray-400">(fixed)</span>
            </span>
            <div
              className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: '#7c3aed' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
