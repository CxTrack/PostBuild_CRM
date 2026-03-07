import React, { useEffect, useRef, useState } from 'react';
import {
  Bell, CheckCheck, MessageSquare, RefreshCw,
  Megaphone, CreditCard, Zap, Info, Shield, Settings,
} from 'lucide-react';
import { useNotificationStore, SystemNotification } from '@/stores/notificationStore';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  sms_opt_out: <MessageSquare className="w-4 h-4 text-red-500" />,
  sms_reopt_confirmed: <RefreshCw className="w-4 h-4 text-green-500" />,
  sms_reopt_request: <RefreshCw className="w-4 h-4 text-amber-500" />,
  admin_message: <Megaphone className="w-4 h-4 text-purple-500" />,
  admin_notification: <Megaphone className="w-4 h-4 text-purple-500" />,
  billing_alert: <CreditCard className="w-4 h-4 text-red-500" />,
  token_warning: <Zap className="w-4 h-4 text-amber-500" />,
  token_exhausted: <Zap className="w-4 h-4 text-red-500" />,
  token_exhausted_owner: <Zap className="w-4 h-4 text-red-500" />,
  system_update: <Info className="w-4 h-4 text-blue-500" />,
  security_alert: <Shield className="w-4 h-4 text-red-500" />,
  maintenance: <Settings className="w-4 h-4 text-gray-500" />,
};

const getPriorityBorder = (priority?: string): string => {
  if (priority === 'urgent') return 'border-l-2 border-l-red-500';
  if (priority === 'high') return 'border-l-2 border-l-orange-500';
  return '';
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuthContext();

  // Initial fetch + polling fallback (real-time is primary)
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Real-time: listen for new notifications targeted at this user
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notification-bell-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Refetch to get the full notification with proper typing
          fetchNotifications();

          // Show a toast for high/urgent priority notifications
          const newNotif = payload.new as Record<string, any>;
          if (newNotif?.priority === 'urgent' || newNotif?.priority === 'high') {
            toast(newNotif.title || 'New notification', {
              icon: newNotif.priority === 'urgent' ? '🔴' : '🟠',
              duration: 5000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (n: SystemNotification) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.action_url) {
      navigate(n.action_url);
    } else if (n.metadata?.customer_id) {
      navigate(`/dashboard/customers/${n.metadata.customer_id}`);
    }
  };

  return (
    <div className={`relative ${open ? 'z-40' : ''}`} ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications list */}
          <div className="overflow-y-auto max-h-72">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
                <Bell className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors border-b border-gray-100 dark:border-gray-700/30 last:border-0 ${
                    !n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  } ${getPriorityBorder(n.priority)}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {NOTIFICATION_ICONS[n.type] || <Bell className="w-4 h-4 text-gray-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${!n.is_read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'} truncate`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-CA', {
                        month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
