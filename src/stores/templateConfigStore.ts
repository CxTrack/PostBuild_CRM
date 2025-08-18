import { create } from 'zustand';
import { DashboardSettings } from '../types/dashboard.settings';

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
  dashboardSections: DashboardSettings;
}

interface TemplateConfigState {
  getConfig: (templateId: string) => TemplateConfig;
}

export const useTemplateConfigStore = create<TemplateConfigState>(() => ({
  getConfig: (templateId: string): TemplateConfig => {

    const defaultConfig: TemplateConfig = {
      name: 'Small Business',
      sidebarItems: [
        { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
        { label: 'CRM', icon: 'Users', path: '/crm' },
        { label: 'Customers', icon: 'Users', path: '/customers' },
        { label: 'Suppliers', icon: 'Users', path: '/suppliers' },
        { label: 'Calls', icon: 'Phone', path: '/calls' },
        { label: 'Quotes', icon: 'Quote', path: '/quotes', section: 'sales' },
        { label: 'Invoices', icon: 'FileText', path: '/invoices', section: 'sales' },
        { label: 'Revenue', icon: 'DollarSign', path: '/revenue', section: 'finance' },
        { label: 'Expenses', icon: 'Receipt', path: '/expenses', section: 'finance' },
        { label: 'Products', icon: 'Package', path: '/products', section: 'finance' },
        { label: 'Inventory', icon: 'Layers', path: '/inventory', section: 'finance' },
        { label: 'Purchases', icon: 'ShoppingCart', path: '/purchases', section: 'finance' }
      ],
      dashboardCards: [
        { title: 'Total Revenue', icon: 'DollarSign', value: '0', change: '0%', trend: 'up', color: 'text-green-500', path: '/revenue' },
        { title: 'Total Customers', icon: 'Users', value: '0', change: '0%', trend: 'up', color: 'text-blue-500' },
        { title: 'Total Products', icon: 'Package', value: '0', change: '0%', trend: 'up', color: 'text-purple-500' },
        { title: 'Pending Orders', icon: 'ShoppingCart', value: '0', change: '0%', trend: 'up', color: 'text-amber-500' }
      ],
      dashboardSections: {
        activeTemplate: 'small-business',
        showPipelineOverview: true,
        showInventoryStatus: true,
        showRecentExpenses: true,
        showSalesChart: true,
        showLowStockItems: false,
        showPurchasesChart: false,
        showRecentActivity: false,
        showTodayEvents: false
      }
    };

    const realtorConfig: TemplateConfig = {
      name: 'Realtors',
      sidebarItems: [
        { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
        { label: 'Clients', icon: 'Users', path: '/customers' },
        { label: 'Listings', icon: 'FileText', path: '/listings', section: 'sales' },
        { label: 'Showings', icon: 'Calendar', path: '/showings', section: 'sales' },
        { label: 'Commissions', icon: 'DollarSign', path: '/revenue', section: 'finance' },
        { label: 'Expenses', icon: 'Receipt', path: '/expenses', section: 'finance' }
      ],
      dashboardCards: [
        { title: 'Total Commissions', icon: 'DollarSign', value: '0', change: '0%', trend: 'up', color: 'text-green-500', path: '/revenue' },
        { title: 'Active Listings', icon: 'Home', value: '0', change: '0%', trend: 'up', color: 'text-blue-500' },
        { title: 'Active Clients', icon: 'Users', value: '0', change: '0%', trend: 'up', color: 'text-purple-500' },
        { title: 'Showings This Week', icon: 'Calendar', value: '0', change: '0%', trend: 'up', color: 'text-amber-500' }
      ],
      dashboardSections: {
        activeTemplate: 'realtors',
        showPipelineOverview: true,
        showInventoryStatus: true,
        showRecentExpenses: true,
        showSalesChart: true,
        showLowStockItems: false,
        showPurchasesChart: false,
        showRecentActivity: false,
        showTodayEvents: false
      }
    };

    const callCenterConfig: TemplateConfig = {
      name: 'Call Center',
      sidebarItems: [
        { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
        { label: 'Customers', icon: 'Users', path: '/customers' },
        { label: 'Calls', icon: 'Phone', path: '/calls' },
        { label: 'CRM', icon: 'Users', path: '/crm' }
      ],
      dashboardCards: [
        { title: 'Customers', icon: 'Users', value: '0', change: '0%', trend: 'up', color: 'text-blue-500' },
        { title: 'Calls', icon: 'Phone', value: '0', change: '0%', trend: 'up', color: 'text-green-500' }
      ],
      dashboardSections: {
        activeTemplate: 'call-center',
        showPipelineOverview: true,
        showInventoryStatus: true,
        showRecentExpenses: true,
        showSalesChart: true,
        showLowStockItems: false,
        showPurchasesChart: false,
        showRecentActivity: false,
        showTodayEvents: false
      }
    };

    const morgageBrokersConfig: TemplateConfig = {
      name: 'Mortgage Broker',
      sidebarItems: [
        { label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
        { label: 'Customers', icon: 'Users', path: '/customers' },
        { label: 'Calls', icon: 'Phone', path: '/calls' },
        { label: 'CRM', icon: 'Users', path: '/crm' },
        { label: 'Calendar', icon: 'Calendar', path: '/calendar' },
      ],
      dashboardCards: [
        { title: 'Customers', icon: 'Users', value: '0', change: '0%', trend: 'up', color: 'text-blue-500' },
        { title: 'Calls', icon: 'Phone', value: '0', change: '0%', trend: 'up', color: 'text-green-500' }
      ],
      dashboardSections: {
        activeTemplate: 'mortgage-brokers',
        showPipelineOverview: true,
        showInventoryStatus: false,
        showRecentExpenses: false,
        showSalesChart: false,
        showLowStockItems: false,
        showPurchasesChart: false,
        showRecentActivity: false,
        showTodayEvents: false
      }
    };

    switch (templateId) {
      // case 'realtors':
      //    return realtorConfig;
      case 'call-center':
        return callCenterConfig;
      case 'mortgage-brokers':
        return morgageBrokersConfig;
      default:
        return defaultConfig;
    }
  }
}));
