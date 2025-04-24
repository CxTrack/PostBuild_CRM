export type Customer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  title?: string | null;
  type: 'Individual' | 'Business' | 'Government' | 'Non-Profit';
  priority: 'Low' | 'Medium' | 'High';
  notes?: string | null;
  status: 'Active' | 'Inactive';
  total_spent: number;
  last_purchase?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type CustomerFormData = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  title?: string;
  type: 'Individual' | 'Business' | 'Government' | 'Non-Profit';
  priority?: 'Low' | 'Medium' | 'High';
  notes?: string;
};

export type Supplier = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  company?: string | null;
  title?: string | null;
  notes?: string | null;
  status: 'Active' | 'Inactive';
  total_spent: number;
  last_purchase?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_address?: string | null;
  date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  notes?: string | null;
  status: InvoiceStatus;
  payment_date?: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type Quote = {
  id: string;
  quote_number: string;
  customer_id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_address?: string | null;
  date: string;
  expiry_date: string;
  items: QuoteItem[];
  subtotal: number;
  tax_rate: number;
  tax: number;
  total: number;
  notes?: string | null;
  message?: string | null;
  status: QuoteStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
};

type QuoteItem = {
  id?: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';

export type QuoteFormData = {
  customer: string;
  newCustomer?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  date: string;
  expiry_date: string;
  items: {
    product: string;
    description: string;
    quantity: number;
    unit_price: number;
  }[];
  tax_rate: number;
  notes?: string;
  message?: string;
};

type InvoiceItem = {
  id?: string;
  product_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type InvoiceStatus = 'Draft' | 'Issued' | 'Paid' | 'Part paid' | 'Cancelled' | 'Disputed' | 'On hold';

export type InvoiceFormData = {
  customer: string;
  newCustomer?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  invoiceDate: string;
  dueDate: string;
  taxRate: number;
  items: {
    product: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  cost: number;
  stock: number;
  category?: string | null;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  created_at: string;
  updated_at: string;
  user_id: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  is_active: boolean;
  stripe_price_id: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethod = {
  id: string;
  user_id: string;
  type: 'card';
  card_brand: string;
  card_last4: string;
  card_exp_month: number;
  card_exp_year: number;
  is_default: boolean;
  stripe_payment_method_id: string;
  created_at: string;
  updated_at: string;
};

export type AIAgent = {
  id: string;
  user_id: string;
  name: string;
  type: 'invoice_reminder' | 'payment_collection' | 'customer_service' | 'accounts_receivable' | 'accounts_payable';
  status: 'active' | 'paused';
  settings: {
    tone: 'professional' | 'friendly' | 'formal';
    communication_channels: ('email' | 'sms')[];
    working_hours: {
      start: string; // HH:mm format
      end: string; // HH:mm format
      timezone: string;
    };
    reminder_schedule?: {
      days_before: number[];
      follow_up_interval: number;
    };
    processing_schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      days: string[];
      time: string;
    };
    notification_preferences?: {
      email_alerts: boolean;
      dashboard_alerts: boolean;
      alert_thresholds: {
        aging_days: number;
        amount_threshold: number;
      };
    };
    approval_thresholds?: {
      auto_approve_below: number;
      require_review_above: number;
    };
    aging_brackets?: {
      warning: number;
      critical: number;
      severe: number;
    };
  };
  created_at: string;
  updated_at: string;
};

export type AIAgentLog = {
  id: string;
  agent_id: string;
  action_type: 'reminder_sent' | 'payment_collected' | 'customer_contacted' | 'invoice_processed' | 'payment_processed' | 'report_generated';
  channel: 'email' | 'sms';
  customer_id: string;
  invoice_id?: string;
  message: string;
  status: 'success' | 'failed';
  created_at: string;
};