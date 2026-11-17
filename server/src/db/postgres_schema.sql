-- ========================================================
-- FPV Business Manager: Production PostgreSQL Schema
-- Compatible with PostgreSQL 14+, Supabase, Neon, Railway
-- ========================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'INR',
    fuel_price DECIMAL(10, 2) NOT NULL DEFAULT 105.00,
    default_mileage DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    base_city VARCHAR(255) NOT NULL DEFAULT 'Rajnagar Village',
    address TEXT DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(120) DEFAULT '',
    gstin VARCHAR(50) DEFAULT '',
    logo_url TEXT DEFAULT '',
    terms_conditions TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Viewer',
    phone VARCHAR(50) DEFAULT '',
    avatar_url TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Clients
CREATE TABLE IF NOT EXISTS clients (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) DEFAULT '',
    contact_person VARCHAR(255) DEFAULT '',
    phone VARCHAR(50) DEFAULT '',
    whatsapp VARCHAR(50) DEFAULT '',
    email VARCHAR(120) DEFAULT '',
    billing_address TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    gstin VARCHAR(50) DEFAULT '',
    client_type VARCHAR(50) NOT NULL DEFAULT 'Individual',
    preferred_currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Projects
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_code VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Wedding Shoot',
    description TEXT DEFAULT '',
    shoot_date DATE NOT NULL,
    start_time VARCHAR(20) DEFAULT '',
    end_time VARCHAR(20) DEFAULT '',
    location VARCHAR(255) DEFAULT '',
    city VARCHAR(100) DEFAULT '',
    state VARCHAR(100) DEFAULT '',
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    quoted_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    agreed_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    advance_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Confirmed',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Car',
    make_model VARCHAR(100) DEFAULT '',
    license_plate VARCHAR(50) DEFAULT '',
    fuel_type VARCHAR(50) NOT NULL DEFAULT 'Petrol',
    mileage_km_per_liter DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'FPV Pilot',
    phone VARCHAR(50) DEFAULT '',
    email VARCHAR(120) DEFAULT '',
    payment_type VARCHAR(50) NOT NULL DEFAULT 'Per-Day',
    standard_rate DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    availability VARCHAR(50) NOT NULL DEFAULT 'Available',
    notes TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Project Members
CREATE TABLE IF NOT EXISTS project_members (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    team_member_id VARCHAR(64) NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
    role VARCHAR(100) NOT NULL,
    pay_type VARCHAR(50) NOT NULL DEFAULT 'Per-Day',
    agreed_rate DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    quotation_number VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    valid_until DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    terms TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
    id VARCHAR(64) PRIMARY KEY,
    quotation_id VARCHAR(64) NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    sort_order INT NOT NULL DEFAULT 0
);

-- 10. Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    quotation_id VARCHAR(64) REFERENCES quotations(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    tax_percent DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    balance_due DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
    notes TEXT DEFAULT '',
    payment_terms TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id VARCHAR(64) PRIMARY KEY,
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    expense_id VARCHAR(64),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    item_type VARCHAR(50) NOT NULL DEFAULT 'Service',
    sort_order INT NOT NULL DEFAULT 0
);

-- 12. Payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id VARCHAR(64) NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    payment_number VARCHAR(100) NOT NULL UNIQUE,
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
    base_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI',
    reference_number VARCHAR(100) DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Payment Allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount_allocated DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_id VARCHAR(64) REFERENCES clients(id) ON DELETE SET NULL,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    vehicle_id VARCHAR(64) REFERENCES vehicles(id) ON DELETE SET NULL,
    spent_by_id VARCHAR(64) REFERENCES team_members(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    expense_type VARCHAR(50) NOT NULL DEFAULT 'Travel',
    description TEXT DEFAULT '',
    from_location VARCHAR(255) DEFAULT '',
    to_location VARCHAR(255) DEFAULT '',
    travel_mode VARCHAR(50) NOT NULL DEFAULT 'Car',
    trip_type VARCHAR(50) NOT NULL DEFAULT 'Round-Trip',
    distance_km DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    vehicle_mileage DECIMAL(10, 2) NOT NULL DEFAULT 25.00,
    fuel_price_per_liter DECIMAL(10, 2) NOT NULL DEFAULT 105.00,
    calculated_fuel_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
    base_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    billing_treatment VARCHAR(50) NOT NULL DEFAULT 'Client_Billable',
    invoice_allocation_status VARCHAR(50) NOT NULL DEFAULT 'Not_Invoiced',
    invoice_id VARCHAR(64) REFERENCES invoices(id) ON DELETE SET NULL,
    receipt_url TEXT DEFAULT '',
    vendor_name VARCHAR(255) DEFAULT '',
    payment_method VARCHAR(50) DEFAULT 'UPI',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Equipment
CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    asset_tag VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'FPV Drone',
    brand VARCHAR(100) DEFAULT '',
    model VARCHAR(100) DEFAULT '',
    serial_number VARCHAR(100) DEFAULT '',
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
    warranty_expiry DATE,
    condition VARCHAR(50) NOT NULL DEFAULT 'Good',
    assigned_to_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'Available',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Equipment Assignments
CREATE TABLE IF NOT EXISTS equipment_assignments (
    id VARCHAR(64) PRIMARY KEY,
    equipment_id VARCHAR(64) NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    project_id VARCHAR(64) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assigned_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    assigned_date DATE NOT NULL,
    return_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Maintenance Logs
CREATE TABLE IF NOT EXISTS maintenance_logs (
    id VARCHAR(64) PRIMARY KEY,
    equipment_id VARCHAR(64) NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    service_type VARCHAR(100) NOT NULL DEFAULT 'Repair',
    cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    performed_by VARCHAR(255) DEFAULT '',
    description TEXT DEFAULT '',
    next_service_due DATE,
    receipt_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'Shoot',
    due_date DATE NOT NULL,
    reference_type VARCHAR(50) DEFAULT 'Project',
    reference_id VARCHAR(64),
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Currencies
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    default_exchange_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 20. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(64),
    details TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_client ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_billing ON expenses(billing_treatment, invoice_allocation_status);
