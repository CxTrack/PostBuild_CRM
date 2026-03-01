import { supabase, supabaseUrl, supabaseAnonKey } from '@/lib/supabase';

/**
 * Gets the auth token from localStorage (avoids AbortController bug with supabase.from()).
 */
function getAuthToken(): string | null {
  try {
    const ref = supabaseUrl?.match(/https:\/\/([^.]+)/)?.[1];
    if (!ref) return null;
    const raw = localStorage.getItem(`sb-${ref}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget update of the user's onboarding step in user_profiles.
 * Uses direct REST fetch to avoid AbortController issues.
 */
export function updateOnboardingStep(step: string): void {
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = getAuthToken();
      if (!token) return;

      await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey || '',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ onboarding_step: step }),
      });

      console.log(`[Onboarding] Step tracked: ${step}`);
    } catch (err) {
      console.warn('[Onboarding] Failed to track step:', err);
    }
  })();
}

/**
 * Mark onboarding as fully completed. Sets both onboarding_completed and onboarding_step.
 * Fire-and-forget with console logging.
 */
export function markOnboardingComplete(): void {
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${supabaseUrl}/rest/v1/user_profiles?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': supabaseAnonKey || '',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          onboarding_completed: true,
          onboarding_step: 'completed',
        }),
      });

      if (res.ok) {
        console.log('[Onboarding] Marked as complete');
      } else {
        console.warn('[Onboarding] Failed to mark complete:', res.status);
      }
    } catch (err) {
      console.warn('[Onboarding] Failed to mark complete:', err);
    }
  })();
}

/**
 * Step-to-route mapping for resuming onboarding.
 */
export const ONBOARDING_STEP_ROUTES: Record<string, string> = {
  profile: '/onboarding/profile',
  'select-service': '/onboarding/select-service',
  industry: '/onboarding/industry',
  plan: '/onboarding/plan',
  'voice-setup': '/onboarding/voice-setup',
  checkout: '/onboarding/checkout',
  completed: '/dashboard',
};

/**
 * Detect the calendar provider based on the user's auth method and set it
 * on the organization. This feeds into retell-function-handler's
 * resolveCalendarProvider() cascade for booking appointments.
 *
 * - Microsoft OAuth → 'outlook'
 * - Google OAuth → 'google'
 * - Email signup → 'native' (CRM built-in calendar)
 *
 * Fire-and-forget: failures are silently logged.
 */
export function detectCalendarProvider(organizationId: string): void {
  (async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const authProvider = user.app_metadata?.provider as string | undefined;

      let calendarProvider: string;
      if (authProvider === 'azure' || authProvider === 'microsoft') {
        calendarProvider = 'outlook';
      } else if (authProvider === 'google') {
        calendarProvider = 'google';
      } else {
        calendarProvider = 'native';
      }

      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/organizations?id=eq.${organizationId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': supabaseAnonKey || '',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ calendar_booking_provider: calendarProvider }),
        }
      );

      if (res.ok) {
        console.log(`[Onboarding] Calendar provider set to: ${calendarProvider} (auth: ${authProvider || 'email'})`);
      } else {
        console.warn('[Onboarding] Failed to set calendar provider:', res.status);
      }
    } catch (err) {
      console.warn('[Onboarding] Calendar provider detection failed:', err);
    }
  })();
}

/**
 * Check if a user has completed onboarding (dual-signal: flag OR org).
 * Returns { complete, step } or null on error.
 */
export async function checkOnboardingStatus(userId: string): Promise<{
  complete: boolean;
  step: string | null;
} | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, onboarding_step, organization_id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[Onboarding] Status check failed:', error);
      return null; // fail-open
    }

    if (!data) return null; // no profile yet

    const complete = data.onboarding_completed === true || data.organization_id != null;
    return {
      complete,
      step: data.onboarding_step || null,
    };
  } catch (err) {
    console.warn('[Onboarding] Status check error:', err);
    return null; // fail-open
  }
}
