// Static metadata for custom report data sources and their fields

export type DataSource =
  | 'customers' | 'invoices' | 'pipeline_items' | 'tasks' | 'calls'
  | 'quotes' | 'expenses' | 'products' | 'payments' | 'customer_subscriptions';

export type ChartType =
  | 'bar' | 'line' | 'pie' | 'area' | 'donut'
  | 'stacked_bar' | 'scatter' | 'funnel' | 'table';

export type AggregateFunction = 'count' | 'sum' | 'avg' | 'min' | 'max';
export type DimensionType = 'category' | 'date_day' | 'date_week' | 'date_month' | 'date_quarter' | 'date_year';
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like';

export interface FieldMeta {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date';
  aggregatable: boolean;
  groupable: boolean;
}

export interface DataSourceMeta {
  label: string;
  icon: string;
  description: string;
  fields: FieldMeta[];
}

export interface ReportMetric {
  field: string;
  aggregate: AggregateFunction;
  label: string;
}

export interface ReportDimension {
  field: string;
  type: DimensionType;
  label: string;
}

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface ReportDateRange {
  field: string;
  start: string;
  end: string;
}

export interface ReportConfig {
  data_source: DataSource;
  chart_type: ChartType;
  metrics: ReportMetric[];
  dimensions: ReportDimension[];
  filters: ReportFilter[];
  date_range: ReportDateRange | null;
  sort: { field: string; direction: 'asc' | 'desc' } | null;
  limit: number | null;
  colors: string[] | null;
}

export interface CustomReport {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  report_config: ReportConfig;
  is_public: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  creator_email?: string;
  permission?: 'owner' | 'editor' | 'viewer';
}

export interface ReportShare {
  id: string;
  report_id: string;
  shared_by: string;
  shared_with_user_id: string;
  permission: 'viewer' | 'editor';
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export const CHART_TYPE_META: Record<ChartType, { label: string; icon: string; description: string }> = {
  bar: { label: 'Bar Chart', icon: 'BarChart3', description: 'Compare values across categories' },
  line: { label: 'Line Chart', icon: 'TrendingUp', description: 'Show trends over time' },
  pie: { label: 'Pie Chart', icon: 'PieChart', description: 'Show proportions of a whole' },
  area: { label: 'Area Chart', icon: 'AreaChart', description: 'Track cumulative totals over time' },
  donut: { label: 'Donut Chart', icon: 'Circle', description: 'Proportions with a center space' },
  stacked_bar: { label: 'Stacked Bar', icon: 'BarChart', description: 'Compare composition across categories' },
  scatter: { label: 'Scatter Plot', icon: 'GitBranch', description: 'Show correlation between two values' },
  funnel: { label: 'Funnel Chart', icon: 'Filter', description: 'Visualize progressive reduction' },
  table: { label: 'Data Table', icon: 'Table', description: 'Tabular view of raw data' },
};

export const AGGREGATE_LABELS: Record<AggregateFunction, string> = {
  count: 'Count',
  sum: 'Sum',
  avg: 'Average',
  min: 'Minimum',
  max: 'Maximum',
};

export const DIMENSION_TYPE_LABELS: Record<DimensionType, string> = {
  category: 'Category',
  date_day: 'By Day',
  date_week: 'By Week',
  date_month: 'By Month',
  date_quarter: 'By Quarter',
  date_year: 'By Year',
};

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'Equals',
  neq: 'Not Equals',
  gt: 'Greater Than',
  gte: 'Greater or Equal',
  lt: 'Less Than',
  lte: 'Less or Equal',
  in: 'In List',
  like: 'Contains',
};

export const DATA_SOURCE_META: Record<DataSource, DataSourceMeta> = {
  customers: {
    label: 'Customers',
    icon: 'Users',
    description: 'Customer records and contact information',
    fields: [
      { key: 'id', label: 'Customer ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'name', label: 'Name', type: 'string', aggregatable: false, groupable: true },
      { key: 'type', label: 'Type', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'priority', label: 'Priority', type: 'string', aggregatable: false, groupable: true },
      { key: 'total_spent', label: 'Total Spent', type: 'number', aggregatable: true, groupable: false },
      { key: 'company', label: 'Company', type: 'string', aggregatable: false, groupable: true },
      { key: 'city', label: 'City', type: 'string', aggregatable: false, groupable: true },
      { key: 'state', label: 'State/Province', type: 'string', aggregatable: false, groupable: true },
      { key: 'country', label: 'Country', type: 'string', aggregatable: false, groupable: true },
      { key: 'customer_category', label: 'Category', type: 'string', aggregatable: false, groupable: true },
      { key: 'industry', label: 'Industry', type: 'string', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
      { key: 'updated_at', label: 'Updated Date', type: 'date', aggregatable: false, groupable: true },
    ],
  },
  invoices: {
    label: 'Invoices',
    icon: 'FileText',
    description: 'Invoice records and payment tracking',
    fields: [
      { key: 'id', label: 'Invoice ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'invoice_number', label: 'Invoice Number', type: 'string', aggregatable: false, groupable: false },
      { key: 'customer_name', label: 'Customer', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'total_amount', label: 'Total Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'subtotal', label: 'Subtotal', type: 'number', aggregatable: true, groupable: false },
      { key: 'tax_amount', label: 'Tax Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'amount_paid', label: 'Amount Paid', type: 'number', aggregatable: true, groupable: false },
      { key: 'due_date', label: 'Due Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'invoice_date', label: 'Invoice Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  pipeline_items: {
    label: 'Pipeline Deals',
    icon: 'Target',
    description: 'Pipeline deals and opportunity tracking',
    fields: [
      { key: 'id', label: 'Deal ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'title', label: 'Title', type: 'string', aggregatable: false, groupable: false },
      { key: 'stage', label: 'Stage', type: 'string', aggregatable: false, groupable: true },
      { key: 'value', label: 'Deal Value', type: 'number', aggregatable: true, groupable: false },
      { key: 'probability', label: 'Probability %', type: 'number', aggregatable: true, groupable: false },
      { key: 'weighted_value', label: 'Weighted Value', type: 'number', aggregatable: true, groupable: false },
      { key: 'source', label: 'Source', type: 'string', aggregatable: false, groupable: true },
      { key: 'revenue_type', label: 'Revenue Type', type: 'string', aggregatable: false, groupable: true },
      { key: 'currency', label: 'Currency', type: 'string', aggregatable: false, groupable: true },
      { key: 'expected_close_date', label: 'Expected Close', type: 'date', aggregatable: false, groupable: true },
      { key: 'actual_close_date', label: 'Actual Close', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  tasks: {
    label: 'Tasks',
    icon: 'CheckSquare',
    description: 'Task records and completion tracking',
    fields: [
      { key: 'id', label: 'Task ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'title', label: 'Title', type: 'string', aggregatable: false, groupable: false },
      { key: 'type', label: 'Type', type: 'string', aggregatable: false, groupable: true },
      { key: 'priority', label: 'Priority', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'category', label: 'Category', type: 'string', aggregatable: false, groupable: true },
      { key: 'due_date', label: 'Due Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'completed_at', label: 'Completed Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  calls: {
    label: 'Calls',
    icon: 'Phone',
    description: 'Call logs and analytics',
    fields: [
      { key: 'id', label: 'Call ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'direction', label: 'Direction', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'duration_seconds', label: 'Duration (seconds)', type: 'number', aggregatable: true, groupable: false },
      { key: 'call_type', label: 'Call Type', type: 'string', aggregatable: false, groupable: true },
      { key: 'outcome', label: 'Outcome', type: 'string', aggregatable: false, groupable: true },
      { key: 'sentiment', label: 'Sentiment', type: 'string', aggregatable: false, groupable: true },
      { key: 'agent_type', label: 'Agent Type', type: 'string', aggregatable: false, groupable: true },
      { key: 'started_at', label: 'Started At', type: 'date', aggregatable: false, groupable: true },
      { key: 'ended_at', label: 'Ended At', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  quotes: {
    label: 'Quotes',
    icon: 'FileText',
    description: 'Quote records and conversion tracking',
    fields: [
      { key: 'id', label: 'Quote ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'quote_number', label: 'Quote Number', type: 'string', aggregatable: false, groupable: false },
      { key: 'customer_name', label: 'Customer', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'total_amount', label: 'Total Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'subtotal', label: 'Subtotal', type: 'number', aggregatable: true, groupable: false },
      { key: 'tax_amount', label: 'Tax Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'quote_date', label: 'Quote Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  expenses: {
    label: 'Expenses',
    icon: 'Receipt',
    description: 'Expense records and spending analysis',
    fields: [
      { key: 'id', label: 'Expense ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'description', label: 'Description', type: 'string', aggregatable: false, groupable: false },
      { key: 'amount', label: 'Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'tax_amount', label: 'Tax Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'total_amount', label: 'Total Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'vendor_name', label: 'Vendor', type: 'string', aggregatable: false, groupable: true },
      { key: 'payment_status', label: 'Payment Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'payment_method', label: 'Payment Method', type: 'string', aggregatable: false, groupable: true },
      { key: 'expense_date', label: 'Expense Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  products: {
    label: 'Products',
    icon: 'Package',
    description: 'Product catalog and inventory data',
    fields: [
      { key: 'id', label: 'Product ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'name', label: 'Name', type: 'string', aggregatable: false, groupable: false },
      { key: 'sku', label: 'SKU', type: 'string', aggregatable: false, groupable: false },
      { key: 'category', label: 'Category', type: 'string', aggregatable: false, groupable: true },
      { key: 'price', label: 'Price', type: 'number', aggregatable: true, groupable: false },
      { key: 'cost', label: 'Cost', type: 'number', aggregatable: true, groupable: false },
      { key: 'quantity_on_hand', label: 'Quantity on Hand', type: 'number', aggregatable: true, groupable: false },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'product_type', label: 'Product Type', type: 'string', aggregatable: false, groupable: true },
      { key: 'is_active', label: 'Is Active', type: 'string', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  payments: {
    label: 'Payments',
    icon: 'CreditCard',
    description: 'Payment records and collection tracking',
    fields: [
      { key: 'id', label: 'Payment ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'amount', label: 'Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'payment_method', label: 'Payment Method', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'payment_date', label: 'Payment Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
  customer_subscriptions: {
    label: 'Subscriptions',
    icon: 'RefreshCw',
    description: 'Customer subscription records',
    fields: [
      { key: 'id', label: 'Subscription ID', type: 'string', aggregatable: true, groupable: false },
      { key: 'name', label: 'Plan Name', type: 'string', aggregatable: false, groupable: true },
      { key: 'amount', label: 'Amount', type: 'number', aggregatable: true, groupable: false },
      { key: 'billing_interval', label: 'Billing Interval', type: 'string', aggregatable: false, groupable: true },
      { key: 'status', label: 'Status', type: 'string', aggregatable: false, groupable: true },
      { key: 'start_date', label: 'Start Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'next_billing_date', label: 'Next Billing', type: 'date', aggregatable: false, groupable: true },
      { key: 'cancelled_at', label: 'Cancelled Date', type: 'date', aggregatable: false, groupable: true },
      { key: 'created_at', label: 'Created Date', type: 'date', aggregatable: true, groupable: true },
    ],
  },
};

export const DEFAULT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function getDefaultReportConfig(): ReportConfig {
  return {
    data_source: 'customers',
    chart_type: 'bar',
    metrics: [{ field: 'id', aggregate: 'count', label: 'Count' }],
    dimensions: [{ field: 'status', type: 'category', label: 'Status' }],
    filters: [],
    date_range: null,
    sort: null,
    limit: null,
    colors: null,
  };
}
