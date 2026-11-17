# Findings: FPV Business Manager Repository Audit & Architecture Assessment

## 1. Existing Repository Overview
- **Repository**: `https://github.com/LeO002266/fpv-business-manager`
- **Current State**: Single-file prototype (`index.html`) using HTML5, vanilla JavaScript, CSS custom properties, and browser `localStorage`.
- **Files**:
  - `index.html`: ~32.4 KB (58 lines of minified/inlined CSS and JS).
  - `README.md`: Explains prototype limitations (no backend, no database, manual fuel/mileage, no auth).

## 2. Feature-by-Feature Gap Analysis

| Feature Area | Existing Implementation | Master Brief Requirement | Status / Gap |
|---|---|---|---|
| **Architecture** | Single-file vanilla JS + `localStorage` | Modern Full-Stack: React + TypeScript + Vite + Tailwind CSS frontend, Node.js/Express API backend, relational SQL database (decimal math, foreign keys, constraints) | **Critical Gap**: Needs full production rewrite with modular frontend and robust backend |
| **Authentication & RBAC** | None (public open page) | Secure auth (JWT/session, bcrypt), Organizations, Roles: Owner, Admin, Manager, FPV Pilot, Camera Operator, Editor, Accountant, Viewer | **Missing**: Must implement proper auth & role permissions |
| **Main Dashboard** | 8 basic stat tiles, 2 recent tables. Flat cash calculation (`received - expenses`). No charts, no date filters | Financial overview, business overview, monthly trends, client revenue charts, profit trends, expense category breakdowns, date range filters (Today, This Week, Month, Quarter, Custom) | **Partially Implemented**: Static summary only; lacks charts, filtering, and real financial logic |
| **Client CRM** | Basic card list, 4 fields, simple modal popup | Complete client CRM with 9 dedicated tabs: Overview, Projects, Quotations, Invoices, Payments, Travel Expenses, Other Expenses, Documents, Activity History. Independent financial dashboard per client | **Partially Implemented**: Very basic; needs comprehensive 9-tab profile and linked financial metrics |
| **Project Management** | Simple table with name, client, location, date, fee, status | Dedicated project dashboard: Shoot schedule, location, agreed amount, team assignment, equipment assignment, travel expenses, other expenses, gross & net profit, profit margin | **Partially Implemented**: Lacks detail dashboard, team/equipment linking, and project-level P&L |
| **Invoices & Billing** | Flat invoice generator with auto-attach of unbilled expenses, basic `window.print()` | Professional PDF invoice with logo, client GST/details, itemized shoot charges, itemized travel/other expenses, discount, taxes, QR/UPI code, partial payment tracking, duplicate billing lock | **Partially Implemented**: `window.print()` only; lacks professional PDF export, itemized billing controls, duplicate prevention locks |
| **Travel & Fuel Expenses** | Travel modal with distance, mileage, fuel price, client-billable flag | Local (Rajnagar, Durg, Bhilai, Raipur, etc.), domestic, international. Vehicle mileage presets, automatic fuel formula `(distance / mileage) * price`, invoice allocation states (Not Invoiced, Partially, Fully Invoiced), receipt attachments, travel reports | **Partially Implemented**: Mileage formula present, but lacks vehicle profiles, invoice allocation locks, and multi-stop tracking |
| **General Business Expenses** | Mixed with travel in a single table | Distinct categorization: Capital assets (Drone/camera/batteries), Repairs, Subscriptions, Office, Marketing, Freelancers, Salaries. Split into Project Direct vs General Overhead | **Partially Implemented**: Needs distinct expense types and overhead vs direct expense reporting |
| **Accounts & Payments** | Single payment modal against 1 invoice. Confuses cash received with profit | Dual accounting: Invoiced revenue vs Cash received. Multi-invoice payment allocation, advance payment tracking, payment methods (Cash, UPI, Bank Transfer), cash flow statements | **Partially Implemented**: Primitive invoice-only payment without multi-invoice allocation or advances |
| **Multi-Currency** | Manual rate multiplier field on invoice & expense | INR base, USD, AED, EUR, GBP. Preserves historical transaction exchange rate, converted base currency amounts, multi-currency reporting, foreign exchange gain/loss | **Partially Implemented**: Needs strict historical rate freezing and multi-currency reporting |
| **Equipment Inventory** | Flat table: Name, Category, Serial, Cost, Condition, Maintenance date | Asset register: FPV drones, cameras, controllers, goggles, batteries, chargers, props. Purchase cost, warranty, condition, assignment to team/projects, maintenance history, repair logs | **Partially Implemented**: Basic table only; lacks maintenance logs, repair costs, and project assignments |
| **Team Management** | Flat table: Name, Role, Phone, Rate | Team directory with roles, pay rates (per day / per project), assignment to projects, team costs flowing into project profitability | **Partially Implemented**: No project cost linkage |
| **Quotations** | None | Full quotation lifecycle: Services, packages, travel estimates, validity, terms, PDF export, 1-click conversion to Confirmed Project & Invoice | **Completely Missing** |
| **Reminders & Notifications** | None | Upcoming shoot reminders, payment due alerts, overdue invoice alerts, quotation follow-ups, maintenance schedules, WhatsApp/Email templates | **Completely Missing** |
| **Reports & Analytics** | 2 static tables (Client summary, Category totals) | P&L statement, Cash Flow, Client profitability, Project profitability, Fuel & Travel reports, CSV/Excel/PDF export, interactive date filters | **Partially Implemented**: Minimal summary; needs full analytical reporting engine |
| **Data Integrity & Storage** | `localStorage` with JSON import/export | Persistent relational database (SQLite/PostgreSQL), decimal arithmetic for currency, transaction rollback, automated backup/restore, audit logging | **Critical Gap**: Needs proper database backend |

## 3. Key Accounting Logic Discrepancies in Current Prototype
1. **Profit Calculation Bug**:
   - Prototype formula: `profit = received - expenses`.
   - Why this is incorrect:
     - If an expense of ₹1,700 is **Client Billable** and billed on the invoice, the client reimburses it. When the client pays, that ₹1,700 is a pass-through reimbursement, not business cost.
     - If an expense is a **Business Expense** (non-billable), it directly reduces project profit and business profit.
     - If an invoice is ₹16,700 (₹15k service + ₹1.7k reimbursed expense) and the client has only paid ₹10,000, calculating `10,000 - 1,700 = 8,300` conflates cash flow timing with earned profit.
2. **Duplicate Invoicing Vulnerability**:
   - In prototype, an expense is assigned `invoiceId: inv.id`. But if an invoice is edited, cancelled, or duplicated, the expense state gets orphaned or double-counted.
3. **Floating Point Precision**:
   - Prototype uses JavaScript `Number` floating point math, causing potential rounding errors (`0.1 + 0.2 = 0.30000000000000004`). Must use integers (cents/paise) or precise decimal arithmetic.

## 4. Architectural Plan for Upgrade
To transform this into a scalable, production-quality ERP meeting all criteria in Section 19 of the brief:
- **Full-stack Node.js + React / Vite / Tailwind CSS application**:
  - Modern, responsive, dark/light theme ERP UI with Lucide icons and Recharts.
  - Express.js backend with SQLite (via Better-SQLite3) / PostgreSQL support: provides full relational schema, ACID transactions, decimal handling, zero external cloud dependencies for local instant setup, and clean migration path to cloud PostgreSQL/Supabase.
  - RESTful APIs covering all modules: Auth, Clients, Projects, Quotations, Invoices, Payments, Travel Expenses, Business Expenses, Equipment, Team, Reminders, Reports, Settings.
  - Client-side & server-side validation, PDF generation, CSV/JSON backup & restore.
  - Retain backwards-compatibility by importing existing prototype JSON backups seamlessly.
