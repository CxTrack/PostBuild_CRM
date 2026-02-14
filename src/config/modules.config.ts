import type { Module } from '../types/app.types';

export const AVAILABLE_MODULES: Record<string, Module> = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Overview and analytics',
    icon: 'LayoutGrid',
    route: '',
    requiredPermissions: [],
    category: 'system',
  },
  crm: {
    id: 'crm',
    name: 'CRM',
    description: 'Customer relationship management',
    icon: 'Users',
    route: '/customers',
    requiredPermissions: ['customers.read'],
    category: 'sales',
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    description: 'Appointments and scheduling',
    icon: 'Calendar',
    route: '/calendar',
    requiredPermissions: ['calendar.read'],
    category: 'operations',
  },
  quotes: {
    id: 'quotes',
    name: 'Quotes',
    description: 'Quote generation and management',
    icon: 'FileText',
    route: '/quotes',
    requiredPermissions: ['quotes.read'],
    dependencies: ['crm'],
    category: 'sales',
  },
  invoices: {
    id: 'invoices',
    name: 'Invoices',
    description: 'Invoice creation and tracking',
    icon: 'Receipt',
    route: '/invoices',
    requiredPermissions: ['invoices.read'],
    dependencies: ['crm'],
    category: 'finance',
  },
  products: {
    id: 'products',
    name: 'Products',
    description: 'Product catalog management',
    icon: 'Package',
    route: '/products',
    requiredPermissions: ['products.read'],
    category: 'operations',
  },
  inventory: {
    id: 'inventory',
    name: 'Inventory',
    description: 'Stock management',
    icon: 'Layers',
    route: '/inventory',
    requiredPermissions: ['inventory.read'],
    dependencies: ['products'],
    category: 'operations',
  },
  suppliers: {
    id: 'suppliers',
    name: 'Suppliers',
    description: 'Vendor management',
    icon: 'Building',
    route: '/suppliers',
    requiredPermissions: ['suppliers.read'],
    category: 'operations',
  },
  pipeline: {
    id: 'pipeline',
    name: 'Pipeline',
    description: 'Sales pipeline tracking',
    icon: 'BarChart3',
    route: '/pipeline',
    requiredPermissions: ['pipeline.read'],
    dependencies: ['crm'],
    category: 'sales',
  },
  calls: {
    id: 'calls',
    name: 'Calls',
    description: 'Call logging and tracking',
    icon: 'Phone',
    route: '/calls',
    requiredPermissions: ['calls.read'],
    category: 'operations',
  },
  tasks: {
    id: 'tasks',
    name: 'Tasks',
    description: 'Task management',
    icon: 'CheckSquare',
    route: '/tasks',
    requiredPermissions: ['tasks.read'],
    category: 'operations',
  },
  financials: {
    id: 'financials',
    name: 'Financials',
    description: 'Revenue and expense tracking',
    icon: 'DollarSign',
    route: '/financials',
    requiredPermissions: ['financials.read'],
    category: 'finance',
  },
};

export const INDUSTRY_TEMPLATES: Record<string, string[]> = {
  tax_accounting: ['dashboard', 'crm', 'calendar', 'invoices', 'financials', 'tasks', 'quotes'],
  distribution_logistics: ['dashboard', 'crm', 'products', 'inventory', 'suppliers', 'quotes', 'invoices', 'financials', 'pipeline'],
  gyms_fitness: ['dashboard', 'crm', 'calendar', 'invoices', 'tasks', 'calls', 'pipeline', 'products', 'inventory'],
  contractors_home_services: ['dashboard', 'crm', 'calendar', 'quotes', 'invoices', 'tasks', 'pipeline', 'calls'],
  healthcare: ['dashboard', 'crm', 'calendar', 'invoices', 'tasks', 'calls'],
  real_estate: ['dashboard', 'crm', 'calendar', 'pipeline', 'tasks', 'calls', 'quotes'],
  legal_services: ['dashboard', 'crm', 'calendar', 'invoices', 'tasks', 'pipeline', 'calls', 'quotes'],
  general_business: ['dashboard', 'crm', 'calendar', 'quotes', 'invoices', 'tasks', 'pipeline', 'calls'],
  // New templates
  software_development: ['dashboard', 'crm', 'calendar', 'tasks', 'pipeline', 'invoices', 'quotes'],
  mortgage_broker: ['dashboard', 'crm', 'calendar', 'pipeline', 'tasks', 'invoices'],
  construction: ['dashboard', 'crm', 'calendar', 'quotes', 'invoices', 'tasks', 'pipeline', 'calls'],
};

export const INDUSTRY_LABELS: Record<string, any> = {
  tax_accounting: {
    crm: { name: 'Clients' },
    quotes: { name: 'Engagement Letters' }
  },
  distribution_logistics: {
    crm: { name: 'Accounts' },
    pipeline: { name: 'Order Pipeline' }
  },
  gyms_fitness: {
    crm: { name: 'Members' },
    calendar: { name: 'Class Schedule' },
    pipeline: { name: 'Membership Pipeline' }
  },
  contractors_home_services: {
    crm: { name: 'Clients' },
    quotes: { name: 'Estimates' },
    pipeline: { name: 'Job Pipeline' }
  },
  healthcare: {
    crm: { name: 'Patients' },
    calendar: { name: 'Appointments' }
  },
  real_estate: {
    crm: { name: 'Contacts' },
    pipeline: { name: 'Deal Pipeline' },
    quotes: { name: 'Listing Proposals' }
  },
  legal_services: {
    crm: { name: 'Clients' },
    pipeline: { name: 'Case Pipeline' },
    quotes: { name: 'Fee Proposals' }
  },
  // New template labels
  software_development: {
    crm: { name: 'Clients' },
    pipeline: { name: 'Projects' },
    tasks: { name: 'Sprints & Tasks' },
    quotes: { name: 'Proposals' },
    invoices: { name: 'Billing' },
    calendar: { name: 'Milestones' }
  },
  mortgage_broker: {
    crm: { name: 'Borrowers' },
    pipeline: { name: 'Applications' },
    tasks: { name: 'Follow-ups' },
    invoices: { name: 'Commissions' },
    calendar: { name: 'Appointments' }
  },
  construction: {
    crm: { name: 'Clients' },
    pipeline: { name: 'Projects' },
    tasks: { name: 'Punch List' },
    quotes: { name: 'Bids' },
    calendar: { name: 'Schedule' }
  },
};

export const PLAN_MODULE_ACCESS: Record<string, string[]> = {
  // Free tier gets all modules during 30-day trial, then restricted
  free: ['dashboard', 'crm', 'calendar', 'tasks', 'quotes', 'invoices', 'pipeline', 'calls', 'products', 'inventory', 'suppliers', 'financials'],
  business: ['dashboard', 'crm', 'calendar', 'tasks', 'quotes', 'invoices', 'calls', 'pipeline', 'products'],
  elite_premium: ['dashboard', 'crm', 'calendar', 'tasks', 'quotes', 'invoices', 'calls', 'pipeline', 'products', 'inventory', 'suppliers', 'financials'],
  enterprise: ['dashboard', 'crm', 'calendar', 'tasks', 'quotes', 'invoices', 'calls', 'pipeline', 'products', 'inventory', 'suppliers', 'financials'],
};

// Modules that are only available during free trial (30 days) - will be locked after
export const FREE_TRIAL_ONLY_MODULES = ['pipeline', 'calls', 'products', 'inventory', 'suppliers', 'financials'];

// Trial duration in days
export const FREE_TRIAL_DAYS = 30;

// ============================================================================
// PAGE LABELS - Industry-specific page content
// ============================================================================
// Every user-facing string should come from here, not hardcoded in components

export interface PageLabels {
  title: string;
  subtitle: string;
  entitySingular: string;
  entityPlural: string;
  newButton: string;
  searchPlaceholder: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  emptyStateButton: string;
  loadingText: string;
  // Table column headers
  columns?: {
    number?: string;
    customer?: string;
    date?: string;
    amount?: string;
    status?: string;
    actions?: string;
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    stage?: string;
    value?: string;
    priority?: string;
    dueDate?: string;
    assignee?: string;
  };
  // Stats labels
  stats?: {
    total?: string;
    totalRevenue?: string;
    totalPaid?: string;
    outstanding?: string;
    overdue?: string;
    active?: string;
    completed?: string;
    pending?: string;
  };
}

// Default labels (general_business) - used as fallback
const DEFAULT_PAGE_LABELS: Record<string, PageLabels> = {
  invoices: {
    title: 'Financial Center',
    subtitle: 'Generate invoices, track receivables, and manage billing',
    entitySingular: 'invoice',
    entityPlural: 'invoices',
    newButton: 'New Invoice',
    searchPlaceholder: 'Search invoices...',
    emptyStateTitle: 'No invoices found',
    emptyStateDescription: 'Create your first invoice to start billing customers',
    emptyStateButton: 'Create Your First Invoice',
    loadingText: 'Loading invoices...',
    columns: {
      number: 'Invoice #',
      customer: 'Customer',
      date: 'Date / Due',
      amount: 'Amount',
      status: 'Status',
      actions: 'Actions',
    },
    stats: {
      totalRevenue: 'Total Revenue',
      totalPaid: 'Total Paid',
      outstanding: 'Outstanding',
      overdue: 'Overdue',
    },
  },
  crm: {
    title: 'Customers',
    subtitle: 'Manage your customer relationships and contact information',
    entitySingular: 'customer',
    entityPlural: 'customers',
    newButton: 'Add Customer',
    searchPlaceholder: 'Search customers...',
    emptyStateTitle: 'No customers yet',
    emptyStateDescription: 'Add your first customer to get started',
    emptyStateButton: 'Add Your First Customer',
    loadingText: 'Loading customers...',
    columns: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      status: 'Status',
      actions: 'Actions',
    },
    stats: {
      total: 'Total Customers',
      active: 'Active',
      pending: 'Pending',
    },
  },
  pipeline: {
    title: 'Sales Pipeline',
    subtitle: 'Track deals and opportunities through your sales process',
    entitySingular: 'deal',
    entityPlural: 'deals',
    newButton: 'New Deal',
    searchPlaceholder: 'Search deals...',
    emptyStateTitle: 'No deals in pipeline',
    emptyStateDescription: 'Add your first deal to start tracking opportunities',
    emptyStateButton: 'Add Your First Deal',
    loadingText: 'Loading pipeline...',
    columns: {
      name: 'Deal Name',
      customer: 'Customer',
      value: 'Value',
      stage: 'Stage',
      actions: 'Actions',
    },
    stats: {
      total: 'Total Deals',
      totalRevenue: 'Pipeline Value',
      active: 'Active Deals',
    },
  },
  quotes: {
    title: 'Quotes',
    subtitle: 'Create and manage quotes for your customers',
    entitySingular: 'quote',
    entityPlural: 'quotes',
    newButton: 'New Quote',
    searchPlaceholder: 'Search quotes...',
    emptyStateTitle: 'No quotes found',
    emptyStateDescription: 'Create your first quote to start selling',
    emptyStateButton: 'Create Your First Quote',
    loadingText: 'Loading quotes...',
    columns: {
      number: 'Quote #',
      customer: 'Customer',
      date: 'Date',
      amount: 'Amount',
      status: 'Status',
      actions: 'Actions',
    },
    stats: {
      total: 'Total Quotes',
      pending: 'Pending',
      active: 'Accepted',
    },
  },
  tasks: {
    title: 'Tasks',
    subtitle: 'Manage and track your to-do items',
    entitySingular: 'task',
    entityPlural: 'tasks',
    newButton: 'New Task',
    searchPlaceholder: 'Search tasks...',
    emptyStateTitle: 'No tasks found',
    emptyStateDescription: 'Create your first task to stay organized',
    emptyStateButton: 'Create Your First Task',
    loadingText: 'Loading tasks...',
    columns: {
      name: 'Task',
      dueDate: 'Due Date',
      priority: 'Priority',
      assignee: 'Assignee',
      status: 'Status',
      actions: 'Actions',
    },
    stats: {
      total: 'Total Tasks',
      completed: 'Completed',
      pending: 'Pending',
      overdue: 'Overdue',
    },
  },
  calendar: {
    title: 'Calendar',
    subtitle: 'Schedule and manage your appointments',
    entitySingular: 'event',
    entityPlural: 'events',
    newButton: 'New Event',
    searchPlaceholder: 'Search events...',
    emptyStateTitle: 'No events scheduled',
    emptyStateDescription: 'Schedule your first event to get started',
    emptyStateButton: 'Schedule Your First Event',
    loadingText: 'Loading calendar...',
    columns: {},
    stats: {
      total: 'Total Events',
      pending: 'Upcoming',
    },
  },
  products: {
    title: 'Products',
    subtitle: 'Manage your product catalog',
    entitySingular: 'product',
    entityPlural: 'products',
    newButton: 'New Product',
    searchPlaceholder: 'Search products...',
    emptyStateTitle: 'No products found',
    emptyStateDescription: 'Add your first product to build your catalog',
    emptyStateButton: 'Add Your First Product',
    loadingText: 'Loading products...',
    columns: {
      name: 'Product Name',
      amount: 'Price',
      status: 'Status',
      actions: 'Actions',
    },
    stats: {
      total: 'Total Products',
      active: 'Active',
    },
  },
  financials: {
    title: 'Financials',
    subtitle: 'Track revenue, expenses, and financial performance',
    entitySingular: 'transaction',
    entityPlural: 'transactions',
    newButton: 'New Expense',
    searchPlaceholder: 'Search transactions...',
    emptyStateTitle: 'No transactions yet',
    emptyStateDescription: 'Start tracking your revenue and expenses',
    emptyStateButton: 'Add Your First Transaction',
    loadingText: 'Loading financials...',
    columns: {},
    stats: {
      total: 'Total Transactions',
      totalRevenue: 'Revenue',
      outstanding: 'Expenses',
    },
  },
};

// Industry-specific page label overrides
export const PAGE_LABELS: Record<string, Record<string, Partial<PageLabels>>> = {
  // MORTGAGE BROKER
  mortgage_broker: {
    invoices: {
      title: 'Commission Center',
      subtitle: 'Track commissions, manage payouts, and monitor earnings',
      entitySingular: 'commission',
      entityPlural: 'commissions',
      newButton: 'New Commission',
      searchPlaceholder: 'Search commissions...',
      emptyStateTitle: 'No commissions found',
      emptyStateDescription: 'Add your first commission to start tracking earnings',
      emptyStateButton: 'Add Your First Commission',
      loadingText: 'Loading commissions...',
      columns: {
        number: 'Transaction #',
        customer: 'Borrower / Loan',
        date: 'Close Date',
        amount: 'Commission',
        status: 'Status',
      },
      stats: {
        totalRevenue: 'Total Commissions',
        totalPaid: 'Paid Out',
        outstanding: 'Pending',
        overdue: 'Overdue',
      },
    },
    crm: {
      title: 'Borrowers',
      subtitle: 'Manage your borrower relationships and loan applications',
      entitySingular: 'borrower',
      entityPlural: 'borrowers',
      newButton: 'Add Borrower',
      searchPlaceholder: 'Search borrowers...',
      emptyStateTitle: 'No borrowers yet',
      emptyStateDescription: 'Add your first borrower to get started',
      emptyStateButton: 'Add Your First Borrower',
      loadingText: 'Loading borrowers...',
      columns: {
        name: 'Borrower Name',
        email: 'Email',
        phone: 'Phone',
        status: 'Loan Status',
      },
    },
    pipeline: {
      title: 'Loan Applications',
      subtitle: 'Track loan applications through the approval process',
      entitySingular: 'application',
      entityPlural: 'applications',
      newButton: 'New Application',
      searchPlaceholder: 'Search applications...',
      emptyStateTitle: 'No applications in pipeline',
      emptyStateDescription: 'Add your first loan application',
      emptyStateButton: 'Add Your First Application',
      loadingText: 'Loading applications...',
      columns: {
        name: 'Loan Type',
        customer: 'Borrower',
        value: 'Loan Amount',
        stage: 'Stage',
      },
      stats: {
        total: 'Total Applications',
        totalRevenue: 'Total Loan Value',
        active: 'In Progress',
      },
    },
    tasks: {
      title: 'Follow-ups',
      subtitle: 'Track follow-ups and action items for your loans',
      entitySingular: 'follow-up',
      entityPlural: 'follow-ups',
      newButton: 'New Follow-up',
      searchPlaceholder: 'Search follow-ups...',
      emptyStateTitle: 'No follow-ups found',
      emptyStateDescription: 'Create your first follow-up to stay on track',
      emptyStateButton: 'Create Your First Follow-up',
      loadingText: 'Loading follow-ups...',
    },
    calendar: {
      title: 'Appointments',
      subtitle: 'Schedule meetings with borrowers and partners',
      entitySingular: 'appointment',
      entityPlural: 'appointments',
      newButton: 'New Appointment',
      searchPlaceholder: 'Search appointments...',
      emptyStateTitle: 'No appointments scheduled',
      emptyStateDescription: 'Schedule your first appointment',
      emptyStateButton: 'Schedule Appointment',
      loadingText: 'Loading appointments...',
    },
  },

  // REAL ESTATE
  real_estate: {
    crm: {
      title: 'Contacts',
      subtitle: 'Manage buyers, sellers, and prospects',
      entitySingular: 'contact',
      entityPlural: 'contacts',
      newButton: 'Add Contact',
      searchPlaceholder: 'Search contacts...',
      emptyStateTitle: 'No contacts yet',
      emptyStateDescription: 'Add your first contact to get started',
      emptyStateButton: 'Add Your First Contact',
      loadingText: 'Loading contacts...',
    },
    pipeline: {
      title: 'Deal Pipeline',
      subtitle: 'Track deals from listing to closing',
      entitySingular: 'deal',
      entityPlural: 'deals',
      newButton: 'New Deal',
      searchPlaceholder: 'Search deals...',
      emptyStateTitle: 'No deals in pipeline',
      emptyStateDescription: 'Add your first real estate deal',
      emptyStateButton: 'Add Your First Deal',
      loadingText: 'Loading deals...',
      columns: {
        name: 'Property',
        customer: 'Client',
        value: 'Price',
        stage: 'Stage',
      },
    },
    quotes: {
      title: 'Listing Proposals',
      subtitle: 'Create professional listing presentations to win more listings',
      entitySingular: 'proposal',
      entityPlural: 'proposals',
      newButton: 'New Listing Proposal',
      searchPlaceholder: 'Search by property or seller...',
      emptyStateTitle: 'Win More Listings with Professional Proposals',
      emptyStateDescription: 'Create stunning listing proposals that showcase your marketing plan, comparable sales analysis, and commission structure. Impress sellers and win more listings.',
      emptyStateButton: 'Create Your First Listing Proposal',
      loadingText: 'Loading proposals...',
      columns: {
        number: 'Proposal #',
        customer: 'Seller',
        date: 'Created',
        amount: 'List Price',
        status: 'Status',
      },
      stats: {
        total: 'Total Proposals',
        pending: 'Pending Response',
        active: 'Listings Won',
        totalRevenue: 'Commission Pipeline',
      },
    },
    tasks: {
      title: 'Tasks',
      subtitle: 'Track showings, follow-ups, and closing tasks',
      entitySingular: 'task',
      entityPlural: 'tasks',
      newButton: 'New Task',
      searchPlaceholder: 'Search tasks...',
      emptyStateTitle: 'No tasks yet',
      emptyStateDescription: 'Create tasks to stay on top of your deals',
      emptyStateButton: 'Create Your First Task',
      loadingText: 'Loading tasks...',
    },
    calendar: {
      title: 'Calendar',
      subtitle: 'Schedule showings, open houses, and appointments',
      entitySingular: 'event',
      entityPlural: 'events',
      newButton: 'New Event',
      searchPlaceholder: 'Search events...',
      emptyStateTitle: 'No events scheduled',
      emptyStateDescription: 'Schedule showings and appointments',
      emptyStateButton: 'Schedule Your First Event',
      loadingText: 'Loading calendar...',
    },
    calls: {
      title: 'Call Log',
      subtitle: 'Track calls with buyers, sellers, and agents',
      entitySingular: 'call',
      entityPlural: 'calls',
      newButton: 'Log Call',
      searchPlaceholder: 'Search calls...',
      emptyStateTitle: 'No calls logged',
      emptyStateDescription: 'Log calls to keep track of client communications',
      emptyStateButton: 'Log Your First Call',
      loadingText: 'Loading calls...',
    },
  },

  // CONTRACTORS / HOME SERVICES
  contractors_home_services: {
    crm: {
      title: 'Clients',
      subtitle: 'Manage your client relationships',
      entitySingular: 'client',
      entityPlural: 'clients',
      newButton: 'Add Client',
      searchPlaceholder: 'Search clients...',
      emptyStateTitle: 'No clients yet',
      emptyStateDescription: 'Add your first client to get started',
      emptyStateButton: 'Add Your First Client',
      loadingText: 'Loading clients...',
    },
    quotes: {
      title: 'Estimates',
      subtitle: 'Create and manage job estimates',
      entitySingular: 'estimate',
      entityPlural: 'estimates',
      newButton: 'New Estimate',
      searchPlaceholder: 'Search estimates...',
      emptyStateTitle: 'No estimates found',
      emptyStateDescription: 'Create your first estimate to start quoting jobs',
      emptyStateButton: 'Create Your First Estimate',
      loadingText: 'Loading estimates...',
      columns: {
        number: 'Estimate #',
        customer: 'Client',
      },
    },
    pipeline: {
      title: 'Job Pipeline',
      subtitle: 'Track jobs from estimate to completion',
      entitySingular: 'job',
      entityPlural: 'jobs',
      newButton: 'New Job',
      searchPlaceholder: 'Search jobs...',
      emptyStateTitle: 'No jobs in pipeline',
      emptyStateDescription: 'Add your first job to start tracking',
      emptyStateButton: 'Add Your First Job',
      loadingText: 'Loading jobs...',
      columns: {
        name: 'Job Name',
        customer: 'Client',
        value: 'Job Value',
        stage: 'Stage',
      },
    },
  },

  // HEALTHCARE
  healthcare: {
    crm: {
      title: 'Patients',
      subtitle: 'Manage patient information and records',
      entitySingular: 'patient',
      entityPlural: 'patients',
      newButton: 'Add Patient',
      searchPlaceholder: 'Search patients...',
      emptyStateTitle: 'No patients yet',
      emptyStateDescription: 'Add your first patient to get started',
      emptyStateButton: 'Add Your First Patient',
      loadingText: 'Loading patients...',
      columns: {
        name: 'Patient Name',
        email: 'Email',
        phone: 'Phone',
        status: 'Status',
      },
    },
    calendar: {
      title: 'Appointments',
      subtitle: 'Schedule and manage patient appointments',
      entitySingular: 'appointment',
      entityPlural: 'appointments',
      newButton: 'New Appointment',
      searchPlaceholder: 'Search appointments...',
      emptyStateTitle: 'No appointments scheduled',
      emptyStateDescription: 'Schedule your first patient appointment',
      emptyStateButton: 'Schedule Appointment',
      loadingText: 'Loading appointments...',
    },
  },

  // LEGAL SERVICES
  legal_services: {
    crm: {
      title: 'Clients',
      subtitle: 'Manage client relationships and case contacts',
      entitySingular: 'client',
      entityPlural: 'clients',
      newButton: 'Add Client',
      searchPlaceholder: 'Search clients...',
      emptyStateTitle: 'No clients yet',
      emptyStateDescription: 'Add your first client to get started',
      emptyStateButton: 'Add Your First Client',
      loadingText: 'Loading clients...',
    },
    pipeline: {
      title: 'Case Pipeline',
      subtitle: 'Track cases through your legal process',
      entitySingular: 'case',
      entityPlural: 'cases',
      newButton: 'New Case',
      searchPlaceholder: 'Search cases...',
      emptyStateTitle: 'No cases in pipeline',
      emptyStateDescription: 'Add your first case to start tracking',
      emptyStateButton: 'Add Your First Case',
      loadingText: 'Loading cases...',
      columns: {
        name: 'Case Name',
        customer: 'Client',
        value: 'Case Value',
        stage: 'Stage',
      },
    },
    quotes: {
      title: 'Fee Proposals',
      subtitle: 'Create and manage fee proposals',
      entitySingular: 'fee proposal',
      entityPlural: 'fee proposals',
      newButton: 'New Fee Proposal',
      searchPlaceholder: 'Search proposals...',
      emptyStateTitle: 'No fee proposals found',
      emptyStateDescription: 'Create your first fee proposal',
      emptyStateButton: 'Create Your First Proposal',
      loadingText: 'Loading proposals...',
    },
  },

  // TAX & ACCOUNTING
  tax_accounting: {
    crm: {
      title: 'Clients',
      subtitle: 'Manage client accounts and tax information',
      entitySingular: 'client',
      entityPlural: 'clients',
      newButton: 'Add Client',
      searchPlaceholder: 'Search clients...',
      emptyStateTitle: 'No clients yet',
      emptyStateDescription: 'Add your first client to get started',
      emptyStateButton: 'Add Your First Client',
      loadingText: 'Loading clients...',
    },
    quotes: {
      title: 'Engagement Letters',
      subtitle: 'Create and manage engagement letters',
      entitySingular: 'engagement letter',
      entityPlural: 'engagement letters',
      newButton: 'New Engagement Letter',
      searchPlaceholder: 'Search engagement letters...',
      emptyStateTitle: 'No engagement letters found',
      emptyStateDescription: 'Create your first engagement letter',
      emptyStateButton: 'Create Your First Letter',
      loadingText: 'Loading engagement letters...',
      columns: {
        number: 'Letter #',
        customer: 'Client',
      },
    },
  },

  // CONSTRUCTION
  construction: {
    crm: {
      title: 'Clients',
      subtitle: 'Manage project clients and contacts',
      entitySingular: 'client',
      entityPlural: 'clients',
      newButton: 'Add Client',
      searchPlaceholder: 'Search clients...',
      emptyStateTitle: 'No clients yet',
      emptyStateDescription: 'Add your first client to get started',
      emptyStateButton: 'Add Your First Client',
      loadingText: 'Loading clients...',
    },
    pipeline: {
      title: 'Projects',
      subtitle: 'Track construction projects from bid to completion',
      entitySingular: 'project',
      entityPlural: 'projects',
      newButton: 'New Project',
      searchPlaceholder: 'Search projects...',
      emptyStateTitle: 'No projects in pipeline',
      emptyStateDescription: 'Add your first project to start tracking',
      emptyStateButton: 'Add Your First Project',
      loadingText: 'Loading projects...',
      columns: {
        name: 'Project Name',
        customer: 'Client',
        value: 'Contract Value',
        stage: 'Phase',
      },
    },
    quotes: {
      title: 'Bids',
      subtitle: 'Create and manage project bids',
      entitySingular: 'bid',
      entityPlural: 'bids',
      newButton: 'New Bid',
      searchPlaceholder: 'Search bids...',
      emptyStateTitle: 'No bids found',
      emptyStateDescription: 'Create your first bid to start quoting projects',
      emptyStateButton: 'Create Your First Bid',
      loadingText: 'Loading bids...',
      columns: {
        number: 'Bid #',
        customer: 'Client',
      },
    },
    tasks: {
      title: 'Punch List',
      subtitle: 'Track project tasks and punch list items',
      entitySingular: 'item',
      entityPlural: 'items',
      newButton: 'New Item',
      searchPlaceholder: 'Search items...',
      emptyStateTitle: 'No punch list items',
      emptyStateDescription: 'Add your first punch list item',
      emptyStateButton: 'Add Your First Item',
      loadingText: 'Loading punch list...',
    },
    calendar: {
      title: 'Schedule',
      subtitle: 'Manage project schedules and milestones',
      entitySingular: 'milestone',
      entityPlural: 'milestones',
      newButton: 'Add Milestone',
      searchPlaceholder: 'Search schedule...',
      emptyStateTitle: 'No milestones scheduled',
      emptyStateDescription: 'Add your first project milestone',
      emptyStateButton: 'Add First Milestone',
      loadingText: 'Loading schedule...',
    },
  },

  // GYMS & FITNESS
  gyms_fitness: {
    crm: {
      title: 'Members',
      subtitle: 'Manage gym memberships and member information',
      entitySingular: 'member',
      entityPlural: 'members',
      newButton: 'Add Member',
      searchPlaceholder: 'Search members...',
      emptyStateTitle: 'No members yet',
      emptyStateDescription: 'Add your first member to get started',
      emptyStateButton: 'Add Your First Member',
      loadingText: 'Loading members...',
    },
    pipeline: {
      title: 'Membership Pipeline',
      subtitle: 'Track prospects through the membership journey',
      entitySingular: 'prospect',
      entityPlural: 'prospects',
      newButton: 'New Prospect',
      searchPlaceholder: 'Search prospects...',
      emptyStateTitle: 'No prospects in pipeline',
      emptyStateDescription: 'Add your first prospect to start tracking',
      emptyStateButton: 'Add Your First Prospect',
      loadingText: 'Loading prospects...',
    },
    calendar: {
      title: 'Class Schedule',
      subtitle: 'Manage fitness classes and sessions',
      entitySingular: 'class',
      entityPlural: 'classes',
      newButton: 'New Class',
      searchPlaceholder: 'Search classes...',
      emptyStateTitle: 'No classes scheduled',
      emptyStateDescription: 'Schedule your first fitness class',
      emptyStateButton: 'Schedule Your First Class',
      loadingText: 'Loading class schedule...',
    },
  },

  // SOFTWARE DEVELOPMENT
  software_development: {
    crm: {
      title: 'Clients',
      subtitle: 'Manage client relationships and project contacts',
      entitySingular: 'client',
      entityPlural: 'clients',
      newButton: 'Add Client',
      searchPlaceholder: 'Search clients...',
      emptyStateTitle: 'No clients yet',
      emptyStateDescription: 'Add your first client to get started',
      emptyStateButton: 'Add Your First Client',
      loadingText: 'Loading clients...',
    },
    pipeline: {
      title: 'Projects',
      subtitle: 'Track software projects through development lifecycle',
      entitySingular: 'project',
      entityPlural: 'projects',
      newButton: 'New Project',
      searchPlaceholder: 'Search projects...',
      emptyStateTitle: 'No projects in pipeline',
      emptyStateDescription: 'Add your first project to start tracking',
      emptyStateButton: 'Add Your First Project',
      loadingText: 'Loading projects...',
      columns: {
        name: 'Project Name',
        customer: 'Client',
        value: 'Budget',
        stage: 'Phase',
      },
    },
    tasks: {
      title: 'Sprints & Tasks',
      subtitle: 'Manage development sprints and tasks',
      entitySingular: 'task',
      entityPlural: 'tasks',
      newButton: 'New Task',
      searchPlaceholder: 'Search tasks...',
      emptyStateTitle: 'No tasks found',
      emptyStateDescription: 'Create your first task to start tracking work',
      emptyStateButton: 'Create Your First Task',
      loadingText: 'Loading tasks...',
    },
    quotes: {
      title: 'Proposals',
      subtitle: 'Create and manage project proposals',
      entitySingular: 'proposal',
      entityPlural: 'proposals',
      newButton: 'New Proposal',
      searchPlaceholder: 'Search proposals...',
      emptyStateTitle: 'No proposals found',
      emptyStateDescription: 'Create your first project proposal',
      emptyStateButton: 'Create Your First Proposal',
      loadingText: 'Loading proposals...',
    },
    invoices: {
      title: 'Billing',
      subtitle: 'Manage project billing and invoices',
      entitySingular: 'invoice',
      entityPlural: 'invoices',
      newButton: 'New Invoice',
      searchPlaceholder: 'Search invoices...',
      emptyStateTitle: 'No invoices found',
      emptyStateDescription: 'Create your first invoice',
      emptyStateButton: 'Create Your First Invoice',
      loadingText: 'Loading invoices...',
    },
    calendar: {
      title: 'Milestones',
      subtitle: 'Track project milestones and deadlines',
      entitySingular: 'milestone',
      entityPlural: 'milestones',
      newButton: 'Add Milestone',
      searchPlaceholder: 'Search milestones...',
      emptyStateTitle: 'No milestones scheduled',
      emptyStateDescription: 'Add your first project milestone',
      emptyStateButton: 'Add First Milestone',
      loadingText: 'Loading milestones...',
    },
  },

  // DISTRIBUTION & LOGISTICS
  distribution_logistics: {
    crm: {
      title: 'Accounts',
      subtitle: 'Manage customer accounts and shipping contacts',
      entitySingular: 'account',
      entityPlural: 'accounts',
      newButton: 'Add Account',
      searchPlaceholder: 'Search accounts...',
      emptyStateTitle: 'No accounts yet',
      emptyStateDescription: 'Add your first account to get started',
      emptyStateButton: 'Add Your First Account',
      loadingText: 'Loading accounts...',
    },
    pipeline: {
      title: 'Order Pipeline',
      subtitle: 'Track orders through fulfillment',
      entitySingular: 'order',
      entityPlural: 'orders',
      newButton: 'New Order',
      searchPlaceholder: 'Search orders...',
      emptyStateTitle: 'No orders in pipeline',
      emptyStateDescription: 'Add your first order to start tracking',
      emptyStateButton: 'Add Your First Order',
      loadingText: 'Loading orders...',
      columns: {
        name: 'Order #',
        customer: 'Account',
        value: 'Order Value',
        stage: 'Status',
      },
    },
  },
};

/**
 * Get page labels for a specific page and industry
 * Returns merged labels (industry-specific overrides + defaults)
 */
export const getPageLabels = (pageId: string, industryTemplate: string): PageLabels => {
  const defaults = DEFAULT_PAGE_LABELS[pageId] || DEFAULT_PAGE_LABELS.crm;
  const industryOverrides = PAGE_LABELS[industryTemplate]?.[pageId] || {};

  // Deep merge columns and stats
  return {
    ...defaults,
    ...industryOverrides,
    columns: {
      ...defaults.columns,
      ...industryOverrides.columns,
    },
    stats: {
      ...defaults.stats,
      ...industryOverrides.stats,
    },
  };
};

// ============================================================================
// QUOTE/PROPOSAL FIELD LABELS - Industry-specific field labels for the Quote Builder
// ============================================================================
// These replace generic "Quote Date", "Expiry Date", "Payment Terms" with industry-appropriate terms

export interface QuoteFieldLabels {
  sectionTitle: string;
  dateLabel: string;
  expiryLabel: string;
  termsLabel: string;
  termsPlaceholder: string;
  showTermsField: boolean; // Some industries don't need this field
}

export const QUOTE_FIELD_LABELS: Record<string, QuoteFieldLabels> = {
  // Real Estate - Listing Proposals
  real_estate: {
    sectionTitle: 'Proposal Details',
    dateLabel: 'Proposal Date',
    expiryLabel: 'Listing Agreement End',
    termsLabel: 'Additional Terms',
    termsPlaceholder: 'e.g., Exclusive right to sell',
    showTermsField: false, // Listing Duration is already in Property Details section
  },

  // Contractors/Home Services - Estimates
  contractors_home_services: {
    sectionTitle: 'Estimate Details',
    dateLabel: 'Estimate Date',
    expiryLabel: 'Valid Until',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., 50% upfront, 50% on completion',
    showTermsField: true,
  },

  // Legal Services - Fee Proposals
  legal_services: {
    sectionTitle: 'Fee Proposal Details',
    dateLabel: 'Proposal Date',
    expiryLabel: 'Valid Until',
    termsLabel: 'Billing Terms',
    termsPlaceholder: 'e.g., Hourly, Retainer, Flat Fee',
    showTermsField: true,
  },

  // Tax & Accounting - Engagement Letters
  tax_accounting: {
    sectionTitle: 'Engagement Details',
    dateLabel: 'Letter Date',
    expiryLabel: 'Engagement Period Ends',
    termsLabel: 'Billing Terms',
    termsPlaceholder: 'e.g., Billed monthly, Due on receipt',
    showTermsField: true,
  },

  // Construction - Bids
  construction: {
    sectionTitle: 'Bid Details',
    dateLabel: 'Bid Date',
    expiryLabel: 'Bid Valid Until',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., Progress payments, Net 30',
    showTermsField: true,
  },

  // Software Development - Proposals
  software_development: {
    sectionTitle: 'Proposal Details',
    dateLabel: 'Proposal Date',
    expiryLabel: 'Valid Until',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., Milestone-based, Monthly retainer',
    showTermsField: true,
  },

  // Mortgage Broker - doesn't typically have quotes, but just in case
  mortgage_broker: {
    sectionTitle: 'Quote Details',
    dateLabel: 'Quote Date',
    expiryLabel: 'Rate Lock Expires',
    termsLabel: 'Loan Terms',
    termsPlaceholder: 'e.g., 30-year fixed, 15-year ARM',
    showTermsField: true,
  },

  // Healthcare
  healthcare: {
    sectionTitle: 'Service Quote Details',
    dateLabel: 'Quote Date',
    expiryLabel: 'Valid Until',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., Due at time of service',
    showTermsField: true,
  },

  // Gyms & Fitness
  gyms_fitness: {
    sectionTitle: 'Membership Quote',
    dateLabel: 'Quote Date',
    expiryLabel: 'Offer Expires',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., Monthly, Annual prepay',
    showTermsField: true,
  },

  // Distribution & Logistics
  distribution_logistics: {
    sectionTitle: 'Quote Details',
    dateLabel: 'Quote Date',
    expiryLabel: 'Valid Until',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., Net 30, COD',
    showTermsField: true,
  },

  // Default / General Business
  general_business: {
    sectionTitle: 'Quote Details',
    dateLabel: 'Quote Date',
    expiryLabel: 'Expiry Date',
    termsLabel: 'Payment Terms',
    termsPlaceholder: 'e.g., Net 30',
    showTermsField: true,
  },
};

/**
 * Get quote field labels for a specific industry
 * Falls back to general_business defaults
 */
export const getQuoteFieldLabels = (industryTemplate: string): QuoteFieldLabels => {
  return QUOTE_FIELD_LABELS[industryTemplate] || QUOTE_FIELD_LABELS.general_business;
};

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'customers.read',
    'customers.write',
    'customers.delete',
    'calendar.read',
    'calendar.write',
    'quotes.read',
    'quotes.write',
    'invoices.read',
    'invoices.write',
    'products.read',
    'products.write',
    'pipeline.read',
    'pipeline.write',
    'calls.read',
    'calls.write',
    'tasks.read',
    'tasks.write',
    'financials.read',
    'settings.manage',
  ],
  admin: [
    'customers.read',
    'customers.write',
    'customers.delete',
    'calendar.read',
    'calendar.write',
    'quotes.read',
    'quotes.write',
    'invoices.read',
    'invoices.write',
    'products.read',
    'products.write',
    'pipeline.read',
    'pipeline.write',
    'calls.read',
    'calls.write',
    'tasks.read',
    'tasks.write',
    'financials.read',
  ],
  manager: [
    'customers.read',
    'customers.write',
    'calendar.read',
    'calendar.write',
    'quotes.read',
    'quotes.write',
    'invoices.read',
    'products.read',
    'pipeline.read',
    'pipeline.write',
    'calls.read',
    'calls.write',
    'tasks.read',
    'tasks.write',
  ],
  user: [
    'customers.read',
    'calendar.read',
    'calendar.write',
    'quotes.read',
    'invoices.read',
    'products.read',
    'pipeline.read',
    'calls.read',
    'tasks.read',
    'tasks.write',
  ],
};
