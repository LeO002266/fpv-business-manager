-- ========================================================
-- FPV Business Manager: Production Essential Bootstrap
-- (No demo data: clients, projects, invoices, expenses, etc. are created via UI)
-- ========================================================

-- 1. Default Organization
INSERT INTO organizations (id, name, currency_code, fuel_price, default_mileage, base_city, address, phone, email, gstin, terms_conditions)
VALUES (
    'org-fpv-default',
    'AeroShots FPV & Media Productions',
    'INR',
    105.00,
    25.00,
    'Rajnagar Village',
    'Main Road, Rajnagar, Durg District, Chhattisgarh 491001',
    '+91 98765 43210',
    'contact@aeroshotsfpv.com',
    '22AAAAA0000A1Z5',
    'Payment due within 15 days of invoice date. 50% advance required for booking confirmation. Cancellation fees apply as per standard terms.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Supported Currencies
INSERT INTO currencies (code, name, symbol, is_base, default_exchange_rate)
VALUES 
    ('INR', 'Indian Rupee', '₹', TRUE, 1.0000),
    ('USD', 'US Dollar', '$', FALSE, 86.5000),
    ('AED', 'UAE Dirham', 'AED', FALSE, 23.5500),
    ('EUR', 'Euro', '€', FALSE, 91.2000),
    ('GBP', 'British Pound', '£', FALSE, 108.5000)
ON CONFLICT (code) DO NOTHING;

-- 3. Initial Owner Account
INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, is_active)
VALUES 
    ('user-owner-1', 'org-fpv-default', 'Mohit Sharma (Owner)', 'owner@aeroshotsfpv.com', '$2a$10$eE0m1H1G2B3A4C5D6E7F8.rT8b2Yv8O/q0G9l1K3.e9m8m7n6b5v4', 'Owner', '+91 98765 43210', TRUE)
ON CONFLICT (id) DO NOTHING;
