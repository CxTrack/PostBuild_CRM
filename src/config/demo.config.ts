export const DEMO_MODE = false;

// if (typeof window !== 'undefined') {
//   localStorage.setItem('DEMO_MODE', 'true');
//   console.log('💾 DEMO MODE: ENABLED - Using localStorage');
// }


export const DEMO_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000';
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export const DEMO_MODE_CONFIG = {
  enabled: DEMO_MODE,
  demoOrganizationId: DEMO_ORGANIZATION_ID,
  demoUserId: DEMO_USER_ID,
} as const;

export const DEMO_STORAGE_KEYS = {
  customers: 'cxtrack_demo_customers',
  contacts: 'cxtrack_demo_contacts',
  products: 'cxtrack_demo_products',
  quotes: 'cxtrack_demo_quotes',
  invoices: 'cxtrack_demo_invoices',
  calendar: 'cxtrack_demo_calendar',
  tasks: 'cxtrack_demo_tasks',
  calls: 'cxtrack_demo_calls',
  customer_notes: 'cxtrack_demo_customer_notes',
  preferences: 'cxtrack_demo_preferences',
  tickets: 'cxtrack_demo_tickets',
  ticket_messages: 'cxtrack_demo_ticket_messages',
  plans: 'cxtrack_demo_plans',
  voice_agent: 'cxtrack_demo_voice_agent',
} as const;

export const isDemoMode = () => DEMO_MODE_CONFIG.enabled;

export const getDemoOrganizationId = () => DEMO_MODE_CONFIG.demoOrganizationId;

export const getDemoUserId = () => DEMO_MODE_CONFIG.demoUserId;

export const loadDemoData = <T = any>(key: string): T[] => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveDemoData = <T = any>(key: string, data: T[]): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`💾 Saved ${key}:`, data.length, 'items');
    return true;
  } catch (error) {
    console.error('❌ Error saving demo data:', error);
    return false;
  }
};

export const generateDemoId = (): string => {
  return crypto.randomUUID();
};

