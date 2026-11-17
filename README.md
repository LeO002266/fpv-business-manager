# FPV Business Manager — Full-Stack Enterprise ERP

A complete, production-grade Business Management ERP and CRM tailored for FPV drone videography, aerial photography, commercial production, and event shooting businesses.

---

## 🚀 Key Highlights & Capabilities

- **Executive Financial Dashboard**: Real-time KPIs for Invoiced Revenue, Cash Received, Pending Receivables, Travel Expenses, and Net Operating Profit with interactive Recharts trends and date filtering (Today, This Month, This Year, All Time).
- **Client CRM with 9-Tab Profile**: Dedicated client financial dashboard featuring 9 tabs:
  1. *Overview & Financials* (Billed, Received, Pending, Net Profit, Margin %)
  2. *Projects* (Shoot histories & booking statuses)
  3. *Quotations* (Proposals & validity dates)
  4. *Invoices* (Issued tax invoices & payment status)
  5. *Payments* (Receipt history & transaction IDs)
  6. *Travel Expenses* (Routes, fuel, toll, hotel)
  7. *Other Expenses* (Direct project costs)
  8. *Documents & Notes* (Briefs & contracts)
  9. *Activity History* (Audit transaction timeline)
- **Shoot & Booking Management**: Track project locations (Rajnagar, Durg, Bhilai, Raipur, national, international), shoot timelines, crew assignments with daily/project rates, equipment allocations, and project-level P&L.
- **Quotations Engine with 1-Click Conversion**: Itemized service proposals that convert into a Confirmed Project and Tax Invoice with a single click without creating duplicate records.
- **Invoicing & Vector PDF Generation**: Professional downloadable PDF invoices featuring business branding, GSTIN, client tax info, itemized services, unbilled travel reimbursement auto-inclusion, and UPI/Bank QR payment details.
- **Advanced Travel & Fuel Logistics Engine**:
  - Distance-based automatic fuel formula: `Estimated Cost = (Distance ÷ Vehicle Mileage) × Fuel Price`.
  - Vehicle presets (Hero Xpulse 35 km/l, Maruti Swift 20 km/l, Mahindra Thar 12 km/l).
  - Strict **Client Billable** vs **Business Expense** classification with invoice allocation locking to prevent duplicate billing.
- **Drone Fleet & Equipment Inventory**: Asset tags, condition monitoring (New, Good, Fair, Needs Repair), purchase valuations, and repair service histories.
- **Crew & Pilot Management**: Directory of FPV pilots, camera operators, editors, and spotters with per-day/per-project pay rates tied into shoot profitability.
- **Analytical Reports & CSV Export**: Downloadable Profit & Loss Statements, Client Profitability Rankings, Project Margin Audits, and Vehicle Fuel Reports.
- **Multi-Currency Support**: Base currency INR (₹), with support for USD ($), AED (AED), EUR (€), GBP (£) with historical transaction-time exchange rate freezing.
- **Supabase PostgreSQL & Dual Mode**: Fully migrated and live on Supabase PostgreSQL with local SQLite fallback for instant zero-config offline development.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts, jsPDF, jspdf-autotable.
- **Backend**: Node.js, Express, TypeScript, `@supabase/supabase-js`, `pg` (node-postgres), `node:sqlite`.
- **Database**: Supabase PostgreSQL (`fugvtirkxegibrsdgkpg`) + local SQLite dual adapter.
- **Security**: JWT authentication, bcrypt password hashing, environment secret isolation.

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root folder (see `.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=fpv-jwt-secret-key-super-secure-2026

# Supabase PostgreSQL Configuration
SUPABASE_URL=https://fugvtirkxegibrsdgkpg.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional direct PostgreSQL connection:
# DATABASE_URL=postgresql://postgres:your_password@db.fugvtirkxegibrsdgkpg.supabase.co:5432/postgres
```

### 3. Run in Development Mode
Starts both the Express API backend and the Vite frontend concurrently with hot-reloading:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Run in Production Mode
```bash
npm run build
npm start
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🗄️ Database Migrations (Supabase)

To push schema changes or seed data to your linked remote Supabase project:
```bash
# Push schema migration
npx supabase db push --remote --yes

# Push seed records
npx supabase db push --remote --include-seed --yes
```

---

## 📄 License

Proprietary — FPV Business Manager ERP. All rights reserved.
