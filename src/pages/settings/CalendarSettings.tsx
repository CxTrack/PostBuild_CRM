import { useState, useEffect } from 'react';
import {
  Calendar, ExternalLink, Palette, Cloud, CheckCircle2, AlertCircle, Loader2, Unlink
} from 'lucide-react';
import { useOrganizationStore } from '@/stores/organizationStore';
import { useCalendarStore } from '@/stores/calendarStore';
import { calComOAuthService } from '@/services/calcom.service';
import toast from 'react-hot-toast';

interface CalComState {
  loading: boolean;
  connected: boolean;
  expired: boolean;
  email: string | null;
  username: string | null;
  defaultEventTypeId: string | null;
  eventTypes: Array<{ id: number; title: string; length: number }>;
  disconnecting: boolean;
}

export default function CalendarSettings() {
  const { currentOrganization } = useOrganizationStore();
  const {
    outlookNeedsReauth, fetchOutlookTodayEvents, outlookEvents, outlookLoading,
    googleNeedsReauth, fetchGoogleTodayEvents, googleEvents, googleLoading, googleNoConnection
  } = useCalendarStore();
  const [checking, setChecking] = useState(false);
  const [checkingGoogle, setCheckingGoogle] = useState(false);

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

  const [calcom, setCalcom] = useState<CalComState>({
    loading: true,
    connected: false,
    expired: false,
    email: null,
    username: null,
    defaultEventTypeId: null,
    eventTypes: [],
    disconnecting: false,
  });

  useEffect(() => {
    loadSettings();
    fetchOutlookTodayEvents();
    fetchGoogleTodayEvents();
    loadCalComSettings();
  }, [currentOrganization]);

  const loadSettings = async () => {
    if (!currentOrganization?.id) return;
    try {
      if (currentOrganization?.metadata) {
        setSettings(prev => ({
          ...prev,
          booking_provider: (currentOrganization.metadata as any).booking_provider || 'native',
          booking_slug: currentOrganization.slug || ''
        }));
      }
    } catch {
      // Error handled silently
    }
  };

  const loadCalComSettings = async () => {
    if (!currentOrganization?.id) return;
    setCalcom(prev => ({ ...prev, loading: true }));

    try {
      const settings = await calComOAuthService.getSettings(currentOrganization.id);
      if (settings && settings.connection_status !== 'disconnected') {
        setCalcom(prev => ({
          ...prev,
          loading: false,
          connected: settings.connection_status === 'connected',
          expired: settings.connection_status === 'expired',
          email: settings.calcom_user_email,
          username: settings.calcom_username,
          defaultEventTypeId: settings.default_event_type_id,
        }));

        // Fetch event types if connected
        if (settings.connection_status === 'connected') {
          const eventTypes = await calComOAuthService.getEventTypes(currentOrganization.id);
          setCalcom(prev => ({ ...prev, eventTypes }));
        }
      } else {
        setCalcom(prev => ({ ...prev, loading: false, connected: false, expired: false }));
      }
    } catch {
      setCalcom(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCalComConnect = () => {
    if (!currentOrganization?.id) return;
    const authUrl = calComOAuthService.getAuthUrl(currentOrganization.id);
    window.location.href = authUrl;
  };

  const handleCalComDisconnect = async () => {
    if (!currentOrganization?.id) return;
    setCalcom(prev => ({ ...prev, disconnecting: true }));

    try {
      await calComOAuthService.disconnect(currentOrganization.id);
      setCalcom({
        loading: false,
        connected: false,
        expired: false,
        email: null,
        username: null,
        defaultEventTypeId: null,
        eventTypes: [],
        disconnecting: false,
      });
      toast.success('Cal.com disconnected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to disconnect Cal.com');
      setCalcom(prev => ({ ...prev, disconnecting: false }));
    }
  };

  const handleEventTypeChange = async (eventTypeId: string) => {
    if (!currentOrganization?.id) return;
    try {
      await calComOAuthService.setDefaultEventType(currentOrganization.id, eventTypeId);
      setCalcom(prev => ({ ...prev, defaultEventTypeId: eventTypeId }));
      toast.success('Default event type updated');
    } catch {
      toast.error('Failed to update event type');
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
      await useOrganizationStore.getState().updateOrganization({
        slug: settings.booking_slug,
        metadata: {
          ...currentOrganization.metadata as any,
          booking_provider: settings.booking_provider
        }
      });
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleCheckGoogleConnection = async () => {
    setCheckingGoogle(true);
    try {
      await fetchGoogleTodayEvents();
      const store = useCalendarStore.getState();
      if (!store.googleNeedsReauth && !store.googleNoConnection) {
        toast.success('Google Calendar connected successfully!');
      } else if (store.googleNeedsReauth) {
        toast.error('Google Calendar access needs re-authorization. Please reconnect Gmail in Email Settings.');
      } else {
        toast.error('No Google account connected. Please connect Gmail in Email Settings first.');
      }
    } catch {
      toast.error('Failed to check Google Calendar connection.');
    } finally {
      setCheckingGoogle(false);
    }
  };

  const isOutlookConnected = !outlookNeedsReauth && !outlookLoading;
  const isGoogleConnected = !googleNeedsReauth && !googleNoConnection && !googleLoading;

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

      {/* Google Calendar Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Cloud size={20} className="mr-2 text-sky-600 dark:text-sky-400" />
              Google Calendar
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your Google Calendar events are synced automatically
            </p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
            googleLoading
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              : isGoogleConnected
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}>
            {googleLoading ? (
              'Checking...'
            ) : isGoogleConnected ? (
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
          {isGoogleConnected && (
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">Connected to Google Calendar</p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {googleEvents.length > 0
                      ? `${googleEvents.length} event${googleEvents.length !== 1 ? 's' : ''} synced for today`
                      : 'No events scheduled for today'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {googleNeedsReauth && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-300">Calendar access needed</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Please go to Email Settings and reconnect your Google account to grant calendar access.
                  </p>
                </div>
              </div>
            </div>
          )}

          {googleNoConnection && !googleLoading && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <Cloud size={20} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">No Google account connected</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect your Gmail account in Email Settings to enable Google Calendar sync.
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckGoogleConnection}
            disabled={checkingGoogle || googleLoading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {checkingGoogle ? 'Checking...' : 'Check Connection'}
          </button>
        </div>
      </div>

      {/* Cal.com Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar size={20} className="mr-2 text-indigo-600 dark:text-indigo-400" />
              Cal.com Scheduling
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Connect Cal.com to let your AI voice agent check availability and book appointments
            </p>
          </div>

          {!calcom.loading && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              calcom.connected
                ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                : calcom.expired
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {calcom.connected ? (
                <>
                  <CheckCircle2 size={12} />
                  Connected
                </>
              ) : calcom.expired ? (
                <>
                  <AlertCircle size={12} />
                  Expired
                </>
              ) : (
                'Not Connected'
              )}
            </span>
          )}
        </div>

        {calcom.loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 size={16} className="animate-spin" />
            Loading Cal.com settings...
          </div>
        ) : calcom.connected ? (
          <div className="space-y-4">
            {/* Connected status */}
            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300">
                    Connected to Cal.com
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {calcom.email ? `Signed in as ${calcom.email}` : calcom.username ? `@${calcom.username}` : 'Account linked'}
                  </p>
                </div>
              </div>
            </div>

            {/* Default event type selector */}
            {calcom.eventTypes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Event Type for Voice Bookings
                </label>
                <select
                  value={calcom.defaultEventTypeId || ''}
                  onChange={(e) => handleEventTypeChange(e.target.value)}
                  className="w-full max-w-md px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select an event type...</option>
                  {calcom.eventTypes.map(et => (
                    <option key={et.id} value={et.id.toString()}>
                      {et.title} ({et.length} min)
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  This event type is used when your AI voice agent books appointments on your behalf.
                </p>
              </div>
            )}

            <button
              onClick={handleCalComDisconnect}
              disabled={calcom.disconnecting}
              className="px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Unlink size={14} />
              {calcom.disconnecting ? 'Disconnecting...' : 'Disconnect Cal.com'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {calcom.expired && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle size={20} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-300">Connection expired</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                      Your Cal.com session has expired. Please reconnect to restore scheduling access.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Connecting Cal.com allows your AI voice agent to check your real-time availability
                and create bookings during phone calls. Appointments sync automatically to both
                Cal.com and your CRM calendar.
              </p>
              <button
                onClick={handleCalComConnect}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm flex items-center gap-2"
              >
                <Calendar size={16} />
                Connect Cal.com
              </button>
            </div>
          </div>
        )}
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
          {/* Google Calendar events use a fixed sky-blue color */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize flex items-center gap-2">
              Google
              <span className="text-xs text-gray-400">(fixed)</span>
            </span>
            <div
              className="w-10 h-10 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: '#0ea5e9' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
