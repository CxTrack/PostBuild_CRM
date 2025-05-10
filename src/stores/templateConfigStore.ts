import { create } from 'zustand';

interface SidebarItem {
  label: string;
  icon: string;
  path: string;
  section?: string;
}

interface DashboardCard {
  title: string;
  icon: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  color: string;
  path?: string;
}

interface TemplateConfig {
  name: string;
  sidebarItems: SidebarItem[];
  dashboardCards: DashboardCard[];
  dashboardSections: {
    showPipeline: boolean;
    showInventory: boolean;
    showExpenses: boolean;
    showSales: boolean;
    showFinance: boolean;
    showCalendar: boolean;
  };
}

interface TemplateConfigState {
  configs: Record<string, TemplateConfig>;
  getConfig: (templateId: string) => TemplateConfig;
}

const defaultConfig: TemplateConfig = {
  name: 'Small Business',
  sidebarItems: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { label: 'CRM', icon: 'Users', path: '/crm' },
    { label: 'Customers', icon: 'Users', path: '/customers' },
    { label: 'Suppliers', icon: 'Users', path: '/suppliers' },
    { label: 'Calls', icon: 'Phone', path: '/calls' },
    { 
      label: 'Quotes', 
      icon: 'Quote', 
      path: '/quotes',
      section: 'sales'
    },
    { 
      label: 'Invoices', 
      icon: 'FileText', 
      path: '/invoices',
      section: 'sales'
    },
    { 
      label: 'Revenue', 
      icon: 'DollarSign', 
      path: '/revenue',
      section: 'finance'
    },
    { 
      label: 'Expenses', 
      icon: 'Receipt', 
      path: '/expenses',
      section: 'finance'
    },
    { 
      label: 'Products', 
      icon: 'Package', 
      path: '/products',
      section: 'finance'
    },
    { 
      label: 'Inventory', 
      icon: 'Layers', 
      path: '/inventory',
      section: 'finance'
    },
    { 
      label: 'Purchases', 
      icon: 'ShoppingCart', 
      path: '/purchases',
      section: 'finance'
    }
  ],
  dashboardCards: [
    {
      title: 'Total Revenue',
      icon: 'DollarSign',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-green-500',
      path: '/revenue'
    },
    {
      title: 'Total Customers',
      icon: 'Users',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-blue-500'
    },
    {
      title: 'Total Products',
      icon: 'Package',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-purple-500'
    },
    {
      title: 'Pending Orders',
      icon: 'ShoppingCart',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-amber-500'
    }
  ],
  dashboardSections: {
    showPipeline: true,
    showInventory: true,
    showExpenses: true,
    showCalendar: true,
    showSales: true,
    showFinance: true,
  }
};

const realtorConfig: TemplateConfig = {
  name: 'Realtors',
  sidebarItems: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    // { label: 'Properties', icon: 'Home', path: '/properties' },
    { label: 'Clients', icon: 'Users', path: '/customers' },
    { 
      label: 'Listings', 
      icon: 'FileText', 
      path: '/listings',
      section: 'sales'
    },
    { 
      label: 'Showings', 
      icon: 'Calendar', 
      path: '/showings',
      section: 'sales'
    },
    { 
      label: 'Commissions', 
      icon: 'DollarSign', 
      path: '/revenue',
      section: 'finance'
    },
    { 
      label: 'Expenses', 
      icon: 'Receipt', 
      path: '/expenses',
      section: 'finance'
    }
  ],
  dashboardCards: [
    {
      title: 'Total Commissions',
      icon: 'DollarSign',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-green-500',
      path: '/revenue'
    },
    {
      title: 'Active Listings',
      icon: 'Home',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-blue-500'
    },
    {
      title: 'Active Clients',
      icon: 'Users',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-purple-500'
    },
    {
      title: 'Showings This Week',
      icon: 'Calendar',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-amber-500'
    }
  ],
  dashboardSections: {
    showPipeline: true,
    showInventory: false,
    showExpenses: true,
    showCalendar: true,
    showSales: true,
    showFinance: true,
  }
};

const callCenterConfig: TemplateConfig = {
  name: 'Call Center',
  sidebarItems: [
    { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    { label: 'Customers', icon: 'Users', path: '/customers' },
    { label: 'Calls', icon: 'Phone', path: '/calls' },
  ],
  dashboardCards: [
    {
      title: 'Customers',
      icon: 'Users',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-blue-500'
    },
    {
      title: 'Calls',
      icon: 'Phone',
      value: '0',
      change: '0%',
      trend: 'up',
      color: 'text-green-500'
    }
  ],
  dashboardSections: {
    showPipeline: false,
    showInventory: false,
    showExpenses: false,
    showCalendar: false,
    showSales: false,
    showFinance: false,
  }
};

export const useTemplateConfigStore = create<TemplateConfigState>(() => ({
  configs: {
    'small-business': defaultConfig,
    'realtors': realtorConfig,    
    'call-center': callCenterConfig,
  },
  getConfig: (templateId: string) => {
    if (templateId === 'realtors') return realtorConfig;
    switch (templateId) {
      case 'realtors':
        return realtorConfig;
      case 'call-center':
        return callCenterConfig;
      default:
        return defaultConfig;
    }
    return defaultConfig;
  }
}));
