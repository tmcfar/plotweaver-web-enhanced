// Billing types for PlotWeaver

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end?: boolean;
  canceled_at?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly?: number;
  features: string[];
  limits: PlanLimits;
}

export interface PlanLimits {
  projects: number; // -1 for unlimited
  generations_per_month: number;
  storage_mb: number;
  collaborators_per_project: number;
  api_calls_per_hour: number;
}

export interface Usage {
  period: {
    start: string;
    end: string;
  };
  usage: {
    projects: number;
    generations: number;
    storage_mb: number;
    api_calls: number;
    compute_minutes: number;
    storage_mb_hours: number;
  };
  limits: PlanLimits;
}

export interface CostBreakdown {
  generations: number;
  storage: number;
  compute: number;
  api_calls: number;
  overage: number;
  total: number;
  currency: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  due_date: string;
  paid_at?: string;
  pdf_url: string;
  line_items: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface BillingAlert {
  id: string;
  type: 'usage_threshold' | 'payment_failed' | 'subscription_expiring';
  message: string;
  severity: 'info' | 'warning' | 'error';
  created_at: string;
  dismissed_at?: string;
}
