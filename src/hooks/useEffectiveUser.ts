import { useMemo } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useAuthStore } from '../stores/authStore';
import { useImpersonationStore } from '../stores/impersonationStore';

/**
 * Returns the effective user identity.
 * During impersonation: returns the target user's data.
 * Normal mode: returns the actual authenticated user's data.
 */
export function useEffectiveUser() {
  const { user } = useAuthContext();
  const profile = useAuthStore((s) => s.profile);
  const {
    isImpersonating,
    targetUserId,
    targetUserName,
    targetUserEmail,
    targetProfile,
  } = useImpersonationStore();

  return useMemo(() => {
    if (isImpersonating && targetUserId) {
      return {
        id: targetUserId,
        fullName: targetProfile?.full_name || targetUserName || targetUserEmail || 'User',
        email: targetUserEmail || '',
        avatarUrl: targetProfile?.avatar_url || null,
        profileMetadata: targetProfile?.profile_metadata || {},
        isImpersonated: true,
      };
    }

    return {
      id: user?.id || '',
      fullName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
      email: user?.email || '',
      avatarUrl: profile?.avatar_url || null,
      profileMetadata: profile?.profile_metadata || {},
      isImpersonated: false,
    };
  }, [
    isImpersonating, targetUserId, targetUserName, targetUserEmail, targetProfile,
    user?.id, user?.email, user?.user_metadata?.full_name,
    profile?.avatar_url, profile?.profile_metadata,
  ]);
}
