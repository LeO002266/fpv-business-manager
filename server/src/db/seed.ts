import { DatabaseSync } from 'node:sqlite';
import { initDatabase } from './schema.js';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export function seedDatabase(db: DatabaseSync) {
  // Check if already seeded
  const checkOrg = db.prepare('SELECT id FROM organizations LIMIT 1').get() as { id: string } | undefined;
  if (checkOrg) {
    return;
  }

  const orgId = 'org-fpv-default';
  const ownerUserId = 'user-owner-1';
  const pilotUserId = 'user-pilot-1';
  const passwordHash = bcrypt.hashSync('admin123', 10);

  // 1. Organization
  db.prepare(`
    INSERT INTO organizations (id, name, currency_code, fuel_price, default_mileage, base_city, address, phone, email, gstin, terms_conditions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orgId,
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
  );

  // 2. Currencies
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', is_base: 1, rate: 1.0 },
    { code: 'USD', name: 'US Dollar', symbol: '$', is_base: 0, rate: 86.50 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', is_base: 0, rate: 23.55 },
    { code: 'EUR', name: 'Euro', symbol: '€', is_base: 0, rate: 91.20 },
    { code: 'GBP', name: 'British Pound', symbol: '£', is_base: 0, rate: 108.50 },
  ];
  for (const c of currencies) {
    db.prepare(`
      INSERT OR REPLACE INTO currencies (code, name, symbol, is_base, default_exchange_rate)
      VALUES (?, ?, ?, ?, ?)
    `).run(c.code, c.name, c.symbol, c.is_base, c.rate);
  }

  // 3. Users
  db.prepare(`
    INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(ownerUserId, orgId, 'Mohit Sharma (Owner)', 'owner@aeroshotsfpv.com', passwordHash, 'Owner', '+91 98765 43210', 1);

  db.prepare(`
    INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(pilotUserId, orgId, 'Aman Verma', 'pilot@aeroshotsfpv.com', passwordHash, 'FPV Pilot', '+91 98765 11223', 1);

  db.prepare(`
    INSERT INTO users (id, organization_id, name, email, password_hash, role, phone, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('user-acc-1', orgId, 'Priya Soni', 'accounts@aeroshotsfpv.com', passwordHash, 'Accountant', '+91 98765 99887', 1);

  // 4. Vehicles
  const vehicles = [
    { id: 'veh-1', name: 'Hero Xpulse 200 (Recon Bike)', type: 'Bike', make_model: 'Hero Xpulse 200 4V', license_plate: 'CG-07-AB-1234', fuel_type: 'Petrol', mileage: 35.0 },
    { id: 'veh-2', name: 'Mahindra Thar (Crew Vehicle)', type: 'Car', make_model: 'Mahindra Thar 4x4', license_plate: 'CG-07-CD-5678', fuel_type: 'Diesel', mileage: 12.0 },
    { id: 'veh-3', name: 'Maruti Swift (Shoot Car)', type: 'Car', make_model: 'Maruti Suzuki Swift', license_plate: 'CG-04-XY-9012', fuel_type: 'Petrol', mileage: 20.0 },
  ];
  for (const v of vehicles) {
    db.prepare(`
      INSERT INTO vehicles (id, organization_id, name, type, make_model, license_plate, fuel_type, mileage_km_per_liter, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(v.id, orgId, v.name, v.type, v.make_model, v.license_plate, v.fuel_type, v.mileage, 1);
  }

  // 5. Team Members
  const team = [
    { id: 'team-1', user_id: ownerUserId, name: 'Mohit Sharma', role: 'Owner / Chief Pilot', phone: '+91 98765 43210', email: 'owner@aeroshotsfpv.com', pay_type: 'Per-Day', rate: 10000 },
    { id: 'team-2', user_id: pilotUserId, name: 'Aman Verma', role: 'FPV Pilot / Acro Lead', phone: '+91 98765 11223', email: 'pilot@aeroshotsfpv.com', pay_type: 'Per-Day', rate: 6000 },
    { id: 'team-3', user_id: null, name: 'Rajesh K.', role: 'Spotter & Technician', phone: '+91 98765 55443', email: 'rajesh@aeroshotsfpv.com', pay_type: 'Per-Day', rate: 2500 },
    { id: 'team-4', user_id: null, name: 'Karan Mehra', role: 'Colorist & Video Editor', phone: '+91 98765 33221', email: 'editor@aeroshotsfpv.com', pay_type: 'Per-Project', rate: 8000 },
  ];
  for (const t of team) {
    db.prepare(`
      INSERT INTO team_members (id, organization_id, user_id, name, role, phone, email, payment_type, standard_rate, availability)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(t.id, orgId, t.user_id, t.name, t.role, t.phone, t.email, t.pay_type, t.rate, 'Available');
  }

  // 6. Equipment
  const equipment = [
    { id: 'eq-1', tag: 'FPV-001', name: 'iFlight Nazgul Evoque F5D 6S', cat: 'FPV Drone', brand: 'iFlight', model: 'Evoque F5D DeadCat', serial: 'NF5D-99812', cost: 42000, condition: 'Good' },
    { id: 'eq-2', tag: 'FPV-002', name: 'BetaFPV Pavo25 Cinewhoop', cat: 'FPV Drone', brand: 'BetaFPV', model: 'Pavo25 V2', serial: 'PV25-77210', cost: 28500, condition: 'New' },
    { id: 'eq-3', tag: 'CAM-001', name: 'GoPro Hero 11 Black Bones', cat: 'Camera', brand: 'GoPro', model: 'Hero 11 Bones Naked', serial: 'GP11B-44312', cost: 36000, condition: 'Good' },
    { id: 'eq-4', tag: 'GOG-001', name: 'DJI Goggles 2 FPV Headset', cat: 'Goggles', brand: 'DJI', model: 'Goggles 2', serial: 'DJIG2-12903', cost: 58000, condition: 'Good' },
    { id: 'eq-5', tag: 'TX-001', name: 'TBS Tango 2 Pro Transmitter', cat: 'Controller', brand: 'TBS', model: 'Tango 2 Pro v3', serial: 'TBST2-6582', cost: 24000, condition: 'Good' },
    { id: 'eq-6', tag: 'BAT-PACK', name: 'Tattu R-Line 6S 1400mAh (Set of 6)', cat: 'Battery', brand: 'Tattu', model: 'R-Line V5.0', serial: 'RL6S-SET6', cost: 22000, condition: 'Good' }
  ];
  for (const eq of equipment) {
    db.prepare(`
      INSERT INTO equipment (id, organization_id, asset_tag, name, category, brand, model, serial_number, purchase_date, purchase_cost, currency, condition, availability_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(eq.id, orgId, eq.tag, eq.name, eq.cat, eq.brand, eq.model, eq.serial, '2026-01-15', eq.cost, 'INR', eq.condition, 'Available');
  }

  // 7. Clients
  const clients = [
    {
      id: 'client-1',
      code: 'CL-001',
      name: 'Royal Heritage Weddings',
      company_name: 'Royal Heritage Event Management Pvt Ltd',
      contact_person: 'Vikramaditya Rao',
      phone: '+91 98271 22334',
      whatsapp: '+91 98271 22334',
      email: 'vikram@royalweddings.in',
      billing_address: 'Plot 42, Nehru Nagar West',
      city: 'Bhilai',
      state: 'Chhattisgarh',
      country: 'India',
      gstin: '22AABCR1234F1Z9',
      client_type: 'Wedding Planner',
      currency: 'INR'
    },
    {
      id: 'client-2',
      code: 'CL-002',
      name: 'Chakravyuh Media & Ads',
      company_name: 'Chakravyuh Creative Agency',
      contact_person: 'Sneha Deshmukh',
      phone: '+91 99812 44556',
      whatsapp: '+91 99812 44556',
      email: 'sneha@chakravyuhmedia.com',
      billing_address: 'City Center Mall, VIP Road',
      city: 'Raipur',
      state: 'Chhattisgarh',
      country: 'India',
      gstin: '22AABCZ9876G1ZA',
      client_type: 'Advertising Agency',
      currency: 'INR'
    },
    {
      id: 'client-3',
      code: 'CL-003',
      name: 'SkyLine Luxury Estates',
      company_name: 'SkyLine Realty Global',
      contact_person: 'Marcus Vance',
      phone: '+971 50 123 4567',
      whatsapp: '+971 50 123 4567',
      email: 'marcus@skylinedubai.ae',
      billing_address: 'Level 18, Marina Plaza',
      city: 'Dubai',
      state: 'Dubai',
      country: 'United Arab Emirates',
      gstin: '',
      client_type: 'Corporate Client',
      currency: 'AED'
    }
  ];

  for (const cl of clients) {
    db.prepare(`
      INSERT INTO clients (id, organization_id, client_code, name, company_name, contact_person, phone, whatsapp, email, billing_address, city, state, country, gstin, client_type, preferred_currency)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cl.id, orgId, cl.code, cl.name, cl.company_name, cl.contact_person, cl.phone, cl.whatsapp, cl.email, cl.billing_address, cl.city, cl.state, cl.country, cl.gstin, cl.client_type, cl.currency);
  }

  // 8. Projects
  const projects = [
    {
      id: 'proj-1',
      code: 'PRJ-101',
      client_id: 'client-1',
      name: 'Grand Wedding Coverage at Mayfair Lake Resort',
      category: 'Wedding Shoot',
      description: 'Cinematic indoor & outdoor high-speed FPV shoot of Baraat and Reception.',
      shoot_date: '2026-11-25',
      location: 'Mayfair Lake Resort, Jhanjh',
      city: 'Raipur',
      state: 'Chhattisgarh',
      currency: 'INR',
      quoted_amount: 85000,
      agreed_amount: 75000,
      advance_amount: 30000,
      status: 'Confirmed'
    },
    {
      id: 'proj-2',
      code: 'PRJ-102',
      client_id: 'client-2',
      name: 'Automobile Commercial Film - Durg Bypass Run',
      category: 'Advertisement',
      description: 'Chasing electric luxury SUV along Durg-Bhilai express bypass at sunset.',
      shoot_date: '2026-11-20',
      location: 'Durg Bypass & Shivnath River Bridge',
      city: 'Durg',
      state: 'Chhattisgarh',
      currency: 'INR',
      quoted_amount: 60000,
      agreed_amount: 55000,
      advance_amount: 25000,
      status: 'In Progress'
    },
    {
      id: 'proj-3',
      code: 'PRJ-103',
      client_id: 'client-3',
      name: 'Palm Jumeirah Villa Architectural One-Take',
      category: 'Real Estate',
      description: 'Single continuous indoor-outdoor FPV flow through 12,000 sq ft beachfront villa.',
      shoot_date: '2026-12-10',
      location: 'Frond N, Palm Jumeirah',
      city: 'Dubai',
      state: 'Dubai',
      currency: 'AED',
      quoted_amount: 3500,
      agreed_amount: 3200,
      advance_amount: 1500,
      status: 'Confirmed'
    }
  ];

  for (const pr of projects) {
    db.prepare(`
      INSERT INTO projects (id, organization_id, client_id, project_code, name, category, description, shoot_date, location, city, state, currency, quoted_amount, agreed_amount, advance_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(pr.id, orgId, pr.client_id, pr.code, pr.name, pr.category, pr.description, pr.shoot_date, pr.location, pr.city, pr.state, pr.currency, pr.quoted_amount, pr.agreed_amount, pr.advance_amount, pr.status);
  }

  // 9. Travel & Expenses (Connecting Rajnagar to Durg, Bhilai, Raipur)
  // Expense 1: Rajnagar to Raipur for Project 1 (Client Billable)
  db.prepare(`
    INSERT INTO expenses (
      id, organization_id, client_id, project_id, vehicle_id, spent_by_id, expense_date, category, expense_type,
      description, from_location, to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
      fuel_price_per_liter, calculated_fuel_cost, amount, currency, exchange_rate, base_amount,
      billing_treatment, invoice_allocation_status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'exp-1', orgId, 'client-1', 'proj-1', 'veh-3', 'team-1', '2026-11-12', 'Petrol', 'Travel',
    'Recon & Pre-shoot site survey fuel from Rajnagar to Raipur Mayfair',
    'Rajnagar Village', 'Raipur Mayfair Resort', 'Car', 'Round-Trip', 140.0, 20.0, 105.00,
    735.00, 750.00, 'INR', 1.0, 750.00, 'Client_Billable', 'Fully_Invoiced', 'UPI'
  );

  db.prepare(`
    INSERT INTO expenses (
      id, organization_id, client_id, project_id, vehicle_id, spent_by_id, expense_date, category, expense_type,
      description, from_location, to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
      fuel_price_per_liter, calculated_fuel_cost, amount, currency, exchange_rate, base_amount,
      billing_treatment, invoice_allocation_status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'exp-2', orgId, 'client-1', 'proj-1', null, 'team-1', '2026-11-12', 'Toll', 'Travel',
    'Kumhari Toll Plaza charges round trip',
    'Rajnagar Village', 'Raipur', 'Car', 'Round-Trip', 140.0, 0, 0,
    0, 240.00, 'INR', 1.0, 240.00, 'Client_Billable', 'Fully_Invoiced', 'FASTag'
  );

  // Expense 3: Internal drone battery pack purchase (General Business Expense, Non-billable)
  db.prepare(`
    INSERT INTO expenses (
      id, organization_id, client_id, project_id, vehicle_id, spent_by_id, expense_date, category, expense_type,
      description, amount, currency, exchange_rate, base_amount,
      billing_treatment, invoice_allocation_status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'exp-3', orgId, null, null, null, 'team-1', '2026-11-10', 'Battery Purchase', 'Equipment_Capital',
    'Set of 4 high C-rate 6S LiPo batteries for high speed chase shoots',
    14500.00, 'INR', 1.0, 14500.00, 'Business_Expense', 'Not_Invoiced', 'Bank Transfer'
  );

  // Expense 4: Rajnagar to Durg for Project 2 (Client Billable, unbilled)
  db.prepare(`
    INSERT INTO expenses (
      id, organization_id, client_id, project_id, vehicle_id, spent_by_id, expense_date, category, expense_type,
      description, from_location, to_location, travel_mode, trip_type, distance_km, vehicle_mileage,
      fuel_price_per_liter, calculated_fuel_cost, amount, currency, exchange_rate, base_amount,
      billing_treatment, invoice_allocation_status, payment_method
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'exp-4', orgId, 'client-2', 'proj-2', 'veh-1', 'team-2', '2026-11-16', 'Petrol', 'Travel',
    'Recon ride to Durg bypass shoot points',
    'Rajnagar Village', 'Durg Bypass', 'Bike', 'Round-Trip', 60.0, 35.0, 105.00,
    180.00, 200.00, 'INR', 1.0, 200.00, 'Client_Billable', 'Not_Invoiced', 'UPI'
  );

  // 10. Invoices
  // Invoice for Project 1 (includes service fee + billed travel expenses exp-1 & exp-2)
  const inv1Id = 'inv-1001';
  db.prepare(`
    INSERT INTO invoices (
      id, organization_id, client_id, project_id, invoice_number, issue_date, due_date,
      currency, exchange_rate, subtotal, tax_percent, tax_amount, discount_amount, total_amount,
      amount_paid, balance_due, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    inv1Id, orgId, 'client-1', 'proj-1', 'FPV-2026-001', '2026-11-14', '2026-11-29',
    'INR', 1.0, 75990.00, 18.0, 13678.20, 0.0, 89668.20,
    30000.00, 59668.20, 'Partially Paid', 'Mayfair Wedding Shoot - 50% advance received, balance on delivery.'
  );

  // Link expenses to invoice
  db.prepare('UPDATE expenses SET invoice_id = ? WHERE id IN (?, ?)').run(inv1Id, 'exp-1', 'exp-2');

  // Invoice Items
  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, expense_id, description, quantity, unit_price, amount, item_type, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('item-1', inv1Id, null, 'FPV Drone Videography & Multi-angle Coverage (Wedding Package)', 1, 75000.00, 75000.00, 'Service', 1);

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, expense_id, description, quantity, unit_price, amount, item_type, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('item-2', inv1Id, 'exp-1', 'Recon & Survey Fuel (Rajnagar to Raipur round-trip)', 1, 750.00, 750.00, 'Travel_Reimbursement', 2);

  db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, expense_id, description, quantity, unit_price, amount, item_type, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('item-3', inv1Id, 'exp-2', 'Highway Toll Charges (Kumhari Toll Plaza)', 1, 240.00, 240.00, 'Travel_Reimbursement', 3);

  // 11. Payments & Allocations
  const pay1Id = 'pay-2001';
  db.prepare(`
    INSERT INTO payments (
      id, organization_id, client_id, payment_number, payment_date, amount, currency,
      exchange_rate, base_amount, payment_method, reference_number, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pay1Id, orgId, 'client-1', 'PAY-2026-001', '2026-11-15', 30000.00, 'INR',
    1.0, 30000.00, 'UPI', 'UPI/RAI/263301981', 'Advance token payment for Mayfair wedding shoot'
  );

  db.prepare(`
    INSERT INTO payment_allocations (id, payment_id, invoice_id, amount_allocated)
    VALUES (?, ?, ?, ?)
  `).run('alloc-1', pay1Id, inv1Id, 30000.00);

  // 12. Reminders
  db.prepare(`
    INSERT INTO reminders (id, organization_id, title, type, due_date, reference_type, reference_id, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rem-1', orgId, 'Baraat Shoot Prep - Battery Check & Prop Balancing', 'Shoot', '2026-11-24', 'Project', 'proj-1', 'High',
    'Charge all 6S packs to 4.20V and clean GoPro ND filters.'
  );

  db.prepare(`
    INSERT INTO reminders (id, organization_id, title, type, due_date, reference_type, reference_id, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'rem-2', orgId, 'Follow-up for balance payment ₹59,668 from Royal Heritage', 'Payment_Due', '2026-11-29', 'Invoice', inv1Id, 'Medium',
    'Send courteous WhatsApp reminder regarding invoice FPV-2026-001.'
  );

  console.log('Database seeded with complete connected business records!');
}
