# FPV Business Manager — Starter Web App

## Run
- Open `index.html` in a modern browser, or serve this folder with any static web server.
- No build step or external dependency is required.

## Included modules
Dashboard, income/expense transactions, clients, projects/bookings, reminders, invoices/quotations with print-to-PDF, equipment inventory, reports, team directory, settings, JSON backup/restore, CSV export.

## Important limitations of this starter
- Records are stored in browser localStorage on the current device. This is a single-device prototype, not cloud-synced storage.
- Login, multi-user access, server-side scheduled reminders, and WhatsApp/SMS/email delivery are not connected yet. Those require a backend, authentication, hosting, and provider credentials.
- Financial figures are user-entered and should be verified before accounting or tax use.
- This web app is responsive and can be prepared for Android packaging with Capacitor after the backend and mobile testing are completed.

## Suggested production architecture
Frontend: React/PWA or this UI migrated to React.
Backend: Node.js API.
Database: PostgreSQL/Supabase.
Auth: Supabase Auth or equivalent.
Reminder jobs: server scheduler + approved WhatsApp Business/SMS/email providers.
Android: Capacitor wrapper around the hosted PWA.
