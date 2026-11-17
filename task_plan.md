# Task Plan: FPV Business Manager Full-Stack ERP Upgrade

## Goal
Transform the prototype `fpv-business-manager` into a production-grade, full-stack Business Management ERP with relational data persistence (Supabase PostgreSQL + local SQLite dual mode), accurate client/project-wise financial accounting, professional PDF invoicing, advanced travel & fuel management, multi-currency support, equipment inventory, team tracking, and analytics dashboards.

## Architecture Decisions
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts for financial analytics, jsPDF / html2canvas for PDF invoice generation.
- **Backend**: Node.js, Express, TypeScript, Better-SQLite3 / node:sqlite + Supabase PostgreSQL (`@supabase/supabase-js`, `pg`) with ACID transactions, foreign key constraints, decimal precision for currency.
- **Data Persistence**: Relational schema live in Supabase PostgreSQL (`fugvtirkxegibrsdgkpg`) with tables: `organizations`, `users`, `clients`, `projects`, `project_members`, `quotations`, `quotation_items`, `invoices`, `invoice_items`, `payments`, `payment_allocations`, `expenses`, `vehicles`, `equipment`, `maintenance_logs`, `team_members`, `reminders`, `currencies`, `exchange_rates`, `audit_logs`.
- **Backward Compatibility**: Ability to import existing prototype localStorage/JSON data into the new relational database.

---

## Phases

### Phase 1: Repository Audit & Full-Stack Foundation <!-- id: 0 -->
- [x] Step 1.1: Deep audit of existing repository (`index.html`, `README.md`) and document gaps in `findings.md`. <!-- id: 1 -->
- [x] Step 1.2: Set up full-stack project structure (Vite + React + Tailwind frontend, Express + TypeScript backend). <!-- id: 2 -->
- [x] Step 1.3: Design and implement the relational database schema with ACID transactions, foreign keys, and audit timestamps. <!-- id: 3 -->
- [x] Step 1.4: Implement Authentication, User Sessions, RBAC roles (Owner, Admin, Manager, Pilot, etc.), and Organization context. <!-- id: 4 -->

### Phase 2: Core Business Modules (Clients, Projects, Team, Quotations) <!-- id: 5 -->
- [x] Step 2.1: Implement Client CRM backend API & frontend UI with 9 dedicated tabs (Overview, Projects, Quotations, Invoices, Payments, Travel Expenses, Other Expenses, Documents, Activity) and independent financial dashboard. <!-- id: 6 -->
- [x] Step 2.2: Implement Project Management with shoot schedules, locations, agreed fees, team/equipment assignments, status workflow, and project-level financial dashboard. <!-- id: 7 -->
- [x] Step 2.3: Implement Team Management with roles, daily/project rates, and linkage to project costs. <!-- id: 8 -->
- [x] Step 2.4: Implement Quotations module with itemized services, travel estimates, PDF export, and 1-click conversion to Confirmed Project & Invoice. <!-- id: 9 -->

### Phase 3: Financial Engine & Invoicing <!-- id: 10 -->
- [x] Step 3.1: Implement Invoices module with itemized shoot fees, billable travel inclusion, taxes (GST), discounts, terms, and professional PDF generation. <!-- id: 11 -->
- [x] Step 3.2: Implement Payments module with partial payments, multi-invoice allocation, UPI/bank/cash methods, and advance payments. <!-- id: 3.2 -->
- [x] Step 3.3: Implement General Business Expenses (equipment purchases, repairs, subscriptions, office, marketing, salaries) categorized into Project Direct vs General Overhead. <!-- id: 13 -->
- [x] Step 3.4: Implement accurate financial accounting logic (Invoiced Revenue vs Received Revenue vs Project Profit vs Business Profit with reimbursement handling). <!-- id: 14 -->

### Phase 4: Travel & Fuel Expense Engine <!-- id: 15 -->
- [x] Step 4.1: Implement Vehicle Management (mileage presets, fuel types, registration). <!-- id: 16 -->
- [x] Step 4.2: Implement Travel Expense tracking with origin, destination, distance, automatic fuel estimation formula `(distance / mileage) * price`, and editable actual costs. <!-- id: 17 -->
- [x] Step 4.3: Implement strict Client Billable vs Business Expense classification, invoice allocation tracking (Not Invoiced, Partially, Fully Invoiced), and duplicate prevention. <!-- id: 18 -->

### Phase 5: Multi-Currency & Equipment Management <!-- id: 19 -->
- [x] Step 5.1: Multi-Currency engine supporting INR, USD, AED, EUR, GBP with transaction-time exchange rate freezing, converted base currency amounts, and reporting. <!-- id: 20 -->
- [x] Step 5.2: Drone and Equipment Inventory module (drones, cameras, batteries, controllers, goggles) with maintenance tracking, repair history, and project assignment. <!-- id: 21 -->

### Phase 6: Analytics, Reminders & Data Management <!-- id: 22 -->
- [x] Step 6.1: Main Executive Dashboard with interactive charts (Monthly Revenue vs Expenses, Profit Trends, Client Revenue, Expense Breakdown) and date filtering (Today, Week, Month, Quarter, Year, Custom). <!-- id: 23 -->
- [x] Step 6.2: Reports & Analytics engine (P&L statements, Cash Flow, Client Profitability, Project Profitability, Travel & Fuel reports, CSV/Excel/PDF export). <!-- id: 24 -->
- [x] Step 6.3: Reminders & Notifications module (upcoming shoots, overdue invoices, payment dues, maintenance alerts). <!-- id: 25 -->
- [x] Step 6.4: Full system Backup & Restore (JSON / Database export and import), plus prototype data migration tool. <!-- id: 26 -->

### Phase 7: Verification, Testing & Polish <!-- id: 27 -->
- [x] Step 7.1: Comprehensive end-to-end verification of all financial calculations (reimbursements, partial payments, margins, multi-currency). <!-- id: 28 -->
- [x] Step 7.2: Responsive design testing across desktop, tablet, and mobile views. <!-- id: 29 -->
- [x] Step 7.3: Complete documentation (README, API docs, deployment instructions, environment setup). <!-- id: 30 -->
- [ ] Step 7.4: Git commit in clean, logical stages. <!-- id: 31 -->
