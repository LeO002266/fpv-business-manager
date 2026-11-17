# FPV Business Manager

A browser-based FPV drone business management prototype for managing clients, shoots, invoices, payments, travel costs, equipment and reports.

## Included in this build

- Dashboard for invoiced revenue, cash received, pending receivables, expenses and travel expenses.
- Client CRM with client-wise billing, collections, outstanding balance and linked expenses.
- Project and shoot booking register.
- Travel and expense register: petrol, diesel, toll, parking, hotel, food, tickets, local transport and other costs.
- Expense billing treatment: Client Billable or Business Expense.
- Invoice generation that can automatically attach unbilled client-billable expenses for the selected client/project.
- Invoice print / Save as PDF, tax, discount, partial payments and payment ledger.
- Multiple currencies (INR, USD, AED, EUR, GBP, CAD, AUD, SGD, JPY) with a manually entered exchange rate saved on each expense/invoice.
- Drone and equipment inventory, team directory, client-wise reports, JSON backup/restore and CSV expense export.
- Responsive layout for desktop and mobile.

## Run it

1. Open index.html in a modern browser, or enable GitHub Pages for this repository.
2. Add clients and projects.
3. Record expenses and select whether each expense is client-billable or an internal business expense.
4. Create an invoice for a client/project. Choose to automatically include unbilled client-billable expenses.
5. Record payments against invoices. Use the invoice Print / PDF action to save a client copy.

## Important prototype limitations

This is currently a front-end prototype. Data is saved in the current browser using localStorage. It is not yet a production multi-user accounting system.

- No cloud database, secure login, role-based permissions or cross-device sync.
- Fuel estimate is available for petrol/diesel when you enter route distance, vehicle mileage and fuel price. Entering an actual amount overrides the estimate. Distance and fuel price are manual in this prototype; live Maps distance and fuel-price APIs are future integrations. Exchange rates are also entered manually.
- No automatic WhatsApp/SMS/email sending or server-side reminders.
- Receipt field currently stores a reference/URL text; secure file upload storage is not connected.
- Tax/invoice output is a configurable management template, not a jurisdiction-specific tax-compliance engine. Have a qualified accountant verify tax settings and invoice requirements.
- Keep regular JSON backups. Clearing browser data can erase locally stored records.

## Recommended production architecture

- Frontend: React / Next.js PWA.
- Backend and authentication: Node.js API + PostgreSQL (or Supabase).
- Storage: private object storage for receipts and invoice PDFs.
- Integrations: Maps/Routes API for distance, a trusted FX-rate provider, WhatsApp Business provider, email/SMS provider.
- Deployment: HTTPS hosting, scheduled jobs, automated backups, audit logs and role-based access.

## Currency handling

Each foreign-currency expense stores its exchange rate as base-currency units per one unit of transaction currency. The invoice has its own rate using the same convention. For example, if the base currency is INR and 1 USD = INR 83.50, enter 83.50 for USD. Base-currency transactions use 1. Rates are manual in this prototype and should be recorded consistently.

## Repository

https://github.com/LeO002266/fpv-business-manager
