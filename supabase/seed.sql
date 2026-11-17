-- ========================================================
-- FPV Business Manager: Production Seed Data
-- ========================================================

-- 1. Organization
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

-- 2. Currencies
INSERT INTO currencies (code, name, symbol, is_base, default_exchange_rate)
VALUES 
    ('INR', 'Indian Rupee', '₹', TRUE, 1.0000),
    ('USD', 'US Dollar', '$', FALSE, 86.5000),
    ('AED', 'UAE Dirham', 'AED', FALSE, 23.5500),
    ('EUR', 'Euro', '€', FALSE, 91.2000),
    ('GBP', 'British Pound', '£', FALSE, 108.5000)
ON CONFLICT (code) DO NOTHING;

-- 3. Users (Owner: admin123)
INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, is_active)
VALUES 
    ('user-owner-1', 'org-fpv-default', 'Mohit Sharma (Owner)', 'owner@aeroshotsfpv.com', '$2a$10$eE0m1H1G2B3A4C5D6E7F8.rT8b2Yv8O/q0G9l1K3.e9m8m7n6b5v4', 'Owner', '+91 98765 43210', TRUE),
    ('user-pilot-1', 'org-fpv-default', 'Aman Verma', 'pilot@aeroshotsfpv.com', '$2a$10$eE0m1H1G2B3A4C5D6E7F8.rT8b2Yv8O/q0G9l1K3.e9m8m7n6b5v4', 'FPV Pilot', '+91 98765 11223', TRUE),
    ('user-acc-1', 'org-fpv-default', 'Priya Soni', 'accounts@aeroshotsfpv.com', '$2a$10$eE0m1H1G2B3A4C5D6E7F8.rT8b2Yv8O/q0G9l1K3.e9m8m7n6b5v4', 'Accountant', '+91 98765 99887', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4. Vehicles
INSERT INTO vehicles (id, organization_id, name, type, make_model, license_plate, fuel_type, mileage_km_per_liter)
VALUES 
    ('veh-1', 'org-fpv-default', 'Hero Xpulse 200 (Recon Bike)', 'Bike', 'Hero Xpulse 200 4V', 'CG-07-AB-1234', 'Petrol', 35.00),
    ('veh-2', 'org-fpv-default', 'Mahindra Thar (Crew Vehicle)', 'Car', 'Mahindra Thar 4x4', 'CG-07-CD-5678', 'Diesel', 12.00),
    ('veh-3', 'org-fpv-default', 'Maruti Swift (Shoot Car)', 'Car', 'Maruti Suzuki Swift', 'CG-04-XY-9012', 'Petrol', 20.00)
ON CONFLICT (id) DO NOTHING;

-- 5. Team Members
INSERT INTO team_members (id, organization_id, user_id, name, role, phone, email, payment_type, standard_rate, availability)
VALUES 
    ('team-1', 'org-fpv-default', 'user-owner-1', 'Mohit Sharma', 'Owner / Chief Pilot', '+91 98765 43210', 'owner@aeroshotsfpv.com', 'Per-Day', 10000.00, 'Available'),
    ('team-2', 'org-fpv-default', 'user-pilot-1', 'Aman Verma', 'FPV Pilot / Acro Lead', '+91 98765 11223', 'pilot@aeroshotsfpv.com', 'Per-Day', 6000.00, 'Available'),
    ('team-3', 'org-fpv-default', NULL, 'Rajesh K.', 'Spotter & Technician', '+91 98765 55443', 'rajesh@aeroshotsfpv.com', 'Per-Day', 2500.00, 'Available'),
    ('team-4', 'org-fpv-default', NULL, 'Karan Mehra', 'Colorist & Video Editor', '+91 98765 33221', 'editor@aeroshotsfpv.com', 'Per-Project', 8000.00, 'Available')
ON CONFLICT (id) DO NOTHING;

-- 6. Equipment
INSERT INTO equipment (id, organization_id, asset_tag, name, category, brand, model, serial_number, purchase_date, purchase_cost, currency, condition, availability_status)
VALUES 
    ('eq-1', 'org-fpv-default', 'FPV-001', 'iFlight Nazgul Evoque F5D 6S', 'FPV Drone', 'iFlight', 'Evoque F5D DeadCat', 'NF5D-99812', '2026-01-15', 42000.00, 'INR', 'Good', 'Available'),
    ('eq-2', 'org-fpv-default', 'FPV-002', 'BetaFPV Pavo25 Cinewhoop', 'FPV Drone', 'BetaFPV', 'Pavo25 V2', 'PV25-77210', '2026-02-10', 28500.00, 'INR', 'New', 'Available'),
    ('eq-3', 'org-fpv-default', 'CAM-001', 'GoPro Hero 11 Black Bones', 'Camera', 'GoPro', 'Hero 11 Bones Naked', 'GP11B-44312', '2026-01-20', 36000.00, 'INR', 'Good', 'Available'),
    ('eq-4', 'org-fpv-default', 'GOG-001', 'DJI Goggles 2 FPV Headset', 'Goggles', 'DJI', 'Goggles 2', 'DJIG2-12903', '2026-01-10', 58000.00, 'INR', 'Good', 'Available'),
    ('eq-5', 'org-fpv-default', 'TX-001', 'TBS Tango 2 Pro Transmitter', 'Controller', 'TBS', 'Tango 2 Pro v3', 'TBST2-6582', '2026-01-12', 24000.00, 'INR', 'Good', 'Available'),
    ('eq-6', 'org-fpv-default', 'BAT-PACK', 'Tattu R-Line 6S 1400mAh (Set of 6)', 'Battery', 'Tattu', 'R-Line V5.0', 'RL6S-SET6', '2026-03-01', 22000.00, 'INR', 'Good', 'Available')
ON CONFLICT (id) DO NOTHING;

-- 7. Clients
INSERT INTO clients (id, organization_id, client_code, name, company_name, contact_person, phone, whatsapp, email, billing_address, city, state, country, gstin, client_type, preferred_currency)
VALUES 
    ('client-1', 'org-fpv-default', 'CL-001', 'Royal Heritage Weddings', 'Royal Heritage Event Management Pvt Ltd', 'Vikramaditya Rao', '+91 98271 22334', '+91 98271 22334', 'vikram@royalweddings.in', 'Plot 42, Nehru Nagar West', 'Bhilai', 'Chhattisgarh', 'India', '22AABCR1234F1Z9', 'Wedding Planner', 'INR'),
    ('client-2', 'org-fpv-default', 'CL-002', 'Chakravyuh Media & Ads', 'Chakravyuh Creative Agency', 'Sneha Deshmukh', '+91 99812 44556', '+91 99812 44556', 'sneha@chakravyuhmedia.com', 'City Center Mall, VIP Road', 'Raipur', 'Chhattisgarh', 'India', '22AABCZ9876G1ZA', 'Advertising Agency', 'INR'),
    ('client-3', 'org-fpv-default', 'CL-003', 'SkyLine Luxury Estates', 'SkyLine Realty Global', 'Marcus Vance', '+971 50 123 4567', '+971 50 123 4567', 'marcus@skylinedubai.ae', 'Level 18, Marina Plaza', 'Dubai', 'Dubai', 'United Arab Emirates', '', 'Corporate Client', 'AED')
ON CONFLICT (id) DO NOTHING;

-- 8. Projects
INSERT INTO projects (id, organization_id, client_id, project_code, name, category, description, shoot_date, location, city, state, currency, quoted_amount, agreed_amount, advance_amount, status)
VALUES 
    ('proj-1', 'org-fpv-default', 'client-1', 'PRJ-101', 'Grand Wedding Coverage at Mayfair Lake Resort', 'Wedding Shoot', 'Cinematic indoor & outdoor high-speed FPV shoot of Baraat and Reception.', '2026-11-25', 'Mayfair Lake Resort, Jhanjh', 'Raipur', 'Chhattisgarh', 'INR', 85000.00, 75000.00, 30000.00, 'Confirmed'),
    ('proj-2', 'org-fpv-default', 'client-2', 'PRJ-102', 'Automobile Commercial Film - Durg Bypass Run', 'Advertisement', 'Chasing electric luxury SUV along Durg-Bhilai express bypass at sunset.', '2026-11-20', 'Durg Bypass & Shivnath River Bridge', 'Durg', 'Chhattisgarh', 'INR', 60000.00, 55000.00, 25000.00, 'In Progress'),
    ('proj-3', 'org-fpv-default', 'client-3', 'PRJ-103', 'Palm Jumeirah Villa Architectural One-Take', 'Real Estate', 'Single continuous indoor-outdoor FPV flow through 12,000 sq ft beachfront villa.', '2026-12-10', 'Frond N, Palm Jumeirah', 'Dubai', 'Dubai', 'AED', 3500.00, 3200.00, 1500.00, 'Confirmed')
ON CONFLICT (id) DO NOTHING;

-- 9. Expenses (Rajnagar base to Durg, Bhilai, Raipur)
INSERT INTO expenses (
    id, organization_id, client_id, project_id, vehicle_id, spent_by_id, expense_date, category, expense_type,
    description, from_location, to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
    fuel_price_per_liter, calculated_fuel_cost, amount, currency, exchange_rate, base_amount,
    billing_treatment, invoice_allocation_status, payment_method
) VALUES 
    ('exp-1', 'org-fpv-default', 'client-1', 'proj-1', 'veh-3', 'team-1', '2026-11-12', 'Petrol', 'Travel', 'Recon & survey fuel Rajnagar to Raipur Mayfair', 'Rajnagar Village', 'Raipur Mayfair Resort', 'Car', 'Round-Trip', 140.00, 20.00, 105.00, 735.00, 750.00, 'INR', 1.0000, 750.00, 'Client_Billable', 'Fully_Invoiced', 'UPI'),
    ('exp-2', 'org-fpv-default', 'client-1', 'proj-1', NULL, 'team-1', '2026-11-12', 'Toll', 'Travel', 'Kumhari Toll Plaza charges round trip', 'Rajnagar Village', 'Raipur', 'Car', 'Round-Trip', 140.00, 0, 0, 0, 240.00, 'INR', 1.0000, 240.00, 'Client_Billable', 'Fully_Invoiced', 'FASTag'),
    ('exp-3', 'org-fpv-default', NULL, NULL, NULL, 'team-1', '2026-11-10', 'Battery Purchase', 'Equipment_Capital', 'Set of 4 high C-rate 6S LiPo batteries', '', '', 'Other', 'One-Way', 0, 0, 0, 0, 14500.00, 'INR', 1.0000, 14500.00, 'Business_Expense', 'Not_Invoiced', 'Bank Transfer'),
    ('exp-4', 'org-fpv-default', 'client-2', 'proj-2', 'veh-1', 'team-2', '2026-11-16', 'Petrol', 'Travel', 'Recon ride to Durg bypass shoot points', 'Rajnagar Village', 'Durg Bypass', 'Bike', 'Round-Trip', 60.00, 35.00, 105.00, 180.00, 200.00, 'INR', 1.0000, 200.00, 'Client_Billable', 'Not_Invoiced', 'UPI')
ON CONFLICT (id) DO NOTHING;

-- 10. Invoices
INSERT INTO invoices (
    id, organization_id, client_id, project_id, invoice_number, issue_date, due_date,
    currency, exchange_rate, subtotal, tax_percent, tax_amount, discount_amount, total_amount,
    amount_paid, balance_due, status, notes
) VALUES (
    'inv-1001', 'org-fpv-default', 'client-1', 'proj-1', 'FPV-2026-001', '2026-11-14', '2026-11-29',
    'INR', 1.0000, 75990.00, 18.00, 13678.20, 0.00, 89668.20,
    30000.00, 59668.20, 'Partially Paid', 'Mayfair Wedding Shoot - 50% advance received, balance on delivery.'
) ON CONFLICT (id) DO NOTHING;

UPDATE expenses SET invoice_id = 'inv-1001' WHERE id IN ('exp-1', 'exp-2');

INSERT INTO invoice_items (id, invoice_id, expense_id, description, quantity, unit_price, amount, item_type, sort_order)
VALUES 
    ('item-1', 'inv-1001', NULL, 'FPV Drone Videography & Multi-angle Coverage (Wedding Package)', 1.00, 75000.00, 75000.00, 'Service', 1),
    ('item-2', 'inv-1001', 'exp-1', 'Recon & Survey Fuel (Rajnagar to Raipur round-trip)', 1.00, 750.00, 750.00, 'Travel_Reimbursement', 2),
    ('item-3', 'inv-1001', 'exp-2', 'Highway Toll Charges (Kumhari Toll Plaza)', 1.00, 240.00, 240.00, 'Travel_Reimbursement', 3)
ON CONFLICT (id) DO NOTHING;

-- 11. Payments & Allocation
INSERT INTO payments (
    id, organization_id, client_id, payment_number, payment_date, amount, currency,
    exchange_rate, base_amount, payment_method, reference_number, notes
) VALUES (
    'pay-2001', 'org-fpv-default', 'client-1', 'PAY-2026-001', '2026-11-15', 30000.00, 'INR',
    1.0000, 30000.00, 'UPI', 'UPI/RAI/263301981', 'Advance token payment for Mayfair wedding shoot'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO payment_allocations (id, payment_id, invoice_id, amount_allocated)
VALUES ('alloc-1', 'pay-2001', 'inv-1001', 30000.00)
ON CONFLICT (id) DO NOTHING;

-- 12. Reminders
INSERT INTO reminders (id, organization_id, title, type, due_date, reference_type, reference_id, priority, notes)
VALUES 
    ('rem-1', 'org-fpv-default', 'Baraat Shoot Prep - Battery Check & Prop Balancing', 'Shoot', '2026-11-24', 'Project', 'proj-1', 'High', 'Charge all 6S packs to 4.20V and clean GoPro ND filters.'),
    ('rem-2', 'org-fpv-default', 'Follow-up for balance payment ₹59,668 from Royal Heritage', 'Payment_Due', '2026-11-29', 'Invoice', 'inv-1001', 'Medium', 'Send courteous WhatsApp reminder regarding invoice FPV-2026-001.')
ON CONFLICT (id) DO NOTHING;
