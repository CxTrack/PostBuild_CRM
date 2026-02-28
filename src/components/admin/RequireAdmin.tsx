import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Bootstrap emails: if these users don't have an admin_settings record yet,
// one will be auto-created. This is a safety net only -- all admin management
// should happen through the Admin Panel > Settings tab.
const BOOTSTRAP_ADMIN_EMAILS = [
  'cto@cxtrack.com',
  'manik.sharma@cxtrack.com',
  'info@cxtrack.com',
];

export const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const { user, loading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      // Check cached admin status first
      const cacheKey = `admin_status_${user.id}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached !== null) {
        setIsAdmin(cached === 'true');
        setChecking(false);
        return;
      }

      // Primary check: admin_settings table (DB is source of truth)
      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          const adminStatus = !!data.is_admin;
          sessionStorage.setItem(cacheKey, String(adminStatus));
          setIsAdmin(adminStatus);
          setChecking(false);
          return;
        }

        // No record found -- check bootstrap list and auto-seed if matched
        const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalDev || (user.email && BOOTSTRAP_ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
          // Auto-create admin_settings record for bootstrap admin
          await supabase.from('admin_settings').upsert({
            user_id: user.id,
            is_admin: true,
            admin_access_level: 'full',
          }, { onConflict: 'user_id' });

          sessionStorage.setItem(cacheKey, 'true');
          setIsAdmin(true);
          setChecking(false);
          return;
        }

        // Not admin
        sessionStorage.setItem(cacheKey, 'false');
        setIsAdmin(false);
      } catch {
        setIsAdmin(false);
      }
      setChecking(false);
    };

    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
