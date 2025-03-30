import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const openAIKey = import.meta.env.VITE_OPENAI_API_KEY;

// Validate required environment variables
const validateEnvVars = () => {
  const missingVars = [];
  
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  if (!openAIKey) missingVars.push('VITE_OPENAI_API_KEY');
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate OpenAI key format
  if (!openAIKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Key should start with "sk-"');
  }
  
  // Validate Supabase URL format
  try {
    new URL(supabaseUrl);
  } catch {
    throw new Error('Invalid Supabase URL format');
  }
}

// Validate environment variables
validateEnvVars();

// Create a robust storage implementation that works reliably on mobile browsers
const createMobileCompatibleStorage = () => {
  // Simple in-memory storage as fallback
  const memoryStorage: Record<string, string> = {};
  
  // Cookie fallback for iOS Safari
  const setCookie = (name: string, value: string, days = 7) => {
    try {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
      return true;
    } catch (error) {
      console.error('Cookie storage error:', error);
      return false;
    }
  };
  
  const getCookie = (name: string): string | null => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        const cookieValue = parts.pop()?.split(';').shift();
        return cookieValue ? decodeURIComponent(cookieValue) : null;
      }
      return null;
    } catch (error) {
      console.error('Cookie retrieval error:', error);
      return null;
    }
  };
  
  const removeCookie = (name: string) => {
    try {
      document.cookie = `${name}=; Max-Age=-99999999; path=/`;
      return true;
    } catch (error) {
      console.error('Cookie removal error:', error);
      return false;
    }
  };
  
  return {
    getItem: (key: string) => {
      try {
        // Try localStorage first
        const localValue = localStorage.getItem(key);
        if (localValue) return localValue;
        
        // Try cookie storage
        const cookieValue = getCookie(key);
        if (cookieValue) return cookieValue;
        
        // Fall back to memory storage
        return memoryStorage[key] || null;
      } catch (error) {
        console.warn('localStorage error, falling back to memory:', error);
        return memoryStorage[key] || null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        // Try all storage methods
        localStorage.setItem(key, value);
        setCookie(key, value);
        memoryStorage[key] = value;
      } catch (error) {
        console.warn('Storage error, trying fallbacks:', error);
        try {
          setCookie(key, value);
        } catch (e) {
          console.warn('Cookie storage failed:', e);
        }
        memoryStorage[key] = value;
      }
    },
    removeItem: (key: string) => {
      try {
        // Clear from all storage methods
        localStorage.removeItem(key);
        removeCookie(key);
        delete memoryStorage[key];
      } catch (error) {
        console.warn('localStorage error, falling back to memory:', error);
        try {
          removeCookie(key);
        } catch (e) {
          console.warn('Cookie removal failed:', e);
        }
        delete memoryStorage[key];
      }
    }
  };
};

// Create the mobile-compatible storage
const mobileStorage = createMobileCompatibleStorage();

// Create Supabase client with mobile-optimized configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    storage: mobileStorage,
    flowType: 'implicit'
  },
  global: {
    headers: {
      'X-Client-Info': 'cxtrack-app'
    }
  },
});

// Function to check if the session is valid
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return { valid: false, session: null, error };
    }
    
    // Additional validation of session
    if (session?.expires_at) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      if (expiresAt <= now) {
        console.log('Session has expired');
        return { valid: false, session: null, error: new Error('Session expired') };
      }
    }
    
    return { 
      valid: !!session, 
      session,
      error: null
    };
  } catch (error) {
    console.error('Session check exception:', error);
    return { valid: false, session: null, error };
  }
};

// Function to refresh the session
export const refreshSession = async () => {
  try {
    // Check if we have a current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    // Only attempt to refresh if there's an existing session
    if (currentSession) {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          // Don't log AuthSessionMissingError as it's expected in some cases
          if (error.name !== 'AuthSessionMissingError') {
            console.error('Session refresh error:', error);
          }
          return { success: false, session: null, error };
        }
        
        return { 
          success: true, 
          session: data.session,
          error: null
        };
      } catch (refreshError) {
        console.error('Session refresh exception:', refreshError);
        return { success: false, session: null, error: refreshError };
      }
    }
    
    // Return failure but don't log an error if there's no session to refresh
    return { success: false, session: null, error: null };
  } catch (error: any) {
    // Only log unexpected errors
    if (error && (error as any).name !== 'AuthSessionMissingError') {
      console.error('Session check exception:', error);
    }
    return { success: false, session: null, error };
  }
};

// Function to clear all auth-related storage
export const clearAuthStorage = () => {
  try {
    // Clear all storage mechanisms
    mobileStorage.removeItem('sb-auth-token');
    
    // Try to clear sessionStorage and localStorage
    try {
      sessionStorage.removeItem('sb-auth-token');
      localStorage.removeItem('sb-auth-token');
      
      // Also clear old token format if it exists
      sessionStorage.removeItem('bms-auth-token');
      localStorage.removeItem('bms-auth-token');
      
      // Clear any other potential Supabase keys
      const storageKeys = [
        'supabase.auth.token', 
        'supabase.auth.refreshToken',
        'sb-session',
        'sb-access-token',
        'sb-refresh-token'
      ];
      
      storageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });
    } catch (e) {
      console.warn('Error clearing browser storage:', e);
    }
    
    // Clear any auth-related cookies
    try {
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        if (name && (name.trim().startsWith('sb-') || name.trim().includes('supabase') || name.trim().includes('auth'))) {
          document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
    } catch (e) {
      console.warn('Error clearing cookies:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing auth storage:', error);
    return false;
  }
};