export interface Organization {
  id: string;
  name: string;
  currency_code: string;
  fuel_price: number;
  default_mileage: number;
  base_city: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  logo_url: string;
  terms_conditions: string;
  created_at: string;
}

export interface ClientFinancials {
  clientId: string;
  totalBilled: number;
  totalReceived: number;
  pendingReceivables: number;
  travelExpenses: number;
  otherExpenses: number;
  billableExpenses: number;
  nonBillableExpenses: number;
  teamCosts: number;
  totalCost: number;
  netProfit: number;
  profitMarginPercent: number;
  totalProjects: number;
  completedProjects: number;
  ongoingProjects: number;
}

export interface Client {
  id: string;
  organization_id: string;
  client_code: string;
  name: string;
  company_name: string;
  contact_person: string;
  phone: string;
  whatsapp: string;
  email: string;
  billing_address: string;
  city: string;
  state: string;
  country: string;
  gstin: string;
  client_type: string;
  preferred_currency: string;
  status: string;
  notes: string;
  created_at: string;
  financials?: ClientFinancials;
}

export interface ProjectFinancials {
  projectId: string;
  agreedAmount: number;
  invoicedAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  travelExpenses: number;
  otherExpenses: number;
  billableExpenses: number;
  nonBillableExpenses: number;
  teamCosts: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMarginPercent: number;
}

export interface Project {
  id: string;
  organization_id: string;
  client_id: string;
  client_name?: string;
  client_currency?: string;
  project_code: string;
  name: string;
  category: string;
  description: string;
  shoot_date: string;
  start_time: string;
  end_time: string;
  location: string;
  city: string;
  state: string;
  country: string;
  currency: string;
  quoted_amount: number;
  agreed_amount: number;
  advance_amount: number;
  status: string;
  notes: string;
  created_at: string;
  financials?: ProjectFinancials;
}

export interface Expense {
  id: string;
  organization_id: string;
  client_id: string | null;
  client_name?: string;
  project_id: string | null;
  project_name?: string;
  vehicle_id: string | null;
  vehicle_name?: string;
  spent_by_id: string | null;
  spent_by_name?: string;
  expense_date: string;
  category: string;
  expense_type: 'Travel' | 'Project_Direct' | 'General_Business' | 'Equipment_Capital';
  description: string;
  from_location: string;
  to_location: string;
  travel_mode: string;
  trip_type: string;
  distance_km: number;
  vehicle_mileage: number;
  fuel_price_per_liter: number;
  calculated_fuel_cost: number;
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  billing_treatment: 'Client_Billable' | 'Business_Expense';
  invoice_allocation_status: 'Not_Invoiced' | 'Partially_Invoiced' | 'Fully_Invoiced';
  invoice_id: string | null;
  receipt_url: string;
  vendor_name: string;
  payment_method: string;
  notes: string;
  created_at: string;
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  expense_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  item_type: 'Service' | 'Travel_Reimbursement' | 'Equipment' | 'Other';
  sort_order?: number;
}

export interface Invoice {
  id: string;
  organization_id: string;
  client_id: string;
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  client_gstin?: string;
  project_id: string | null;
  project_name?: string;
  quotation_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  notes: string;
  payment_terms: string;
  created_at: string;
  items?: InvoiceItem[];
}

export interface Payment {
  id: string;
  organization_id: string;
  client_id: string;
  client_name?: string;
  invoice_number?: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  base_amount: number;
  payment_method: string;
  reference_number: string;
  notes: string;
  created_at: string;
}

export interface Vehicle {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  make_model: string;
  license_plate: string;
  fuel_type: string;
  mileage_km_per_liter: number;
  is_active: number | boolean;
}

export interface TeamMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  name: string;
  role: string;
  phone: string;
  email: string;
  payment_type: string;
  standard_rate: number;
  availability: string;
  notes: string;
  is_active: number | boolean;
  project_count?: number;
  total_earned?: number;
}

export interface Equipment {
  id: string;
  organization_id: string;
  asset_tag: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  purchase_date: string;
  purchase_cost: number;
  currency: string;
  warranty_expiry: string;
  condition: string;
  assigned_to_name?: string;
  availability_status: string;
  notes: string;
  maintenance_count?: number;
  total_repair_cost?: number;
}

export interface Quotation {
  id: string;
  organization_id: string;
  client_id: string;
  client_name?: string;
  project_id: string | null;
  project_name?: string;
  quotation_number: string;
  issue_date: string;
  valid_until: string | null;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_percent: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  status: string;
  terms: string;
  notes: string;
  created_at: string;
}

export interface Reminder {
  id: string;
  organization_id: string;
  title: string;
  type: string;
  due_date: string;
  reference_type: string;
  reference_id: string | null;
  status: string;
  priority: string;
  notes: string;
  created_at: string;
}
