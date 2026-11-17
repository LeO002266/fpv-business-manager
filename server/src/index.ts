import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { createAdapter } from './db/index.js';
import { authRouter } from './routes/auth.js';
import { clientsRouter } from './routes/clients.js';
import { projectsRouter } from './routes/projects.js';
import { quotationsRouter } from './routes/quotations.js';
import { invoicesRouter } from './routes/invoices.js';
import { paymentsRouter } from './routes/payments.js';
import { expensesRouter } from './routes/expenses.js';
import { vehiclesRouter } from './routes/vehicles.js';
import { equipmentRouter } from './routes/equipment.js';
import { teamRouter } from './routes/team.js';
import { remindersRouter } from './routes/reminders.js';
import { reportsRouter } from './routes/reports.js';
import { settingsRouter } from './routes/settings.js';
import { authMiddleware } from './middleware/auth.js';

export const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://fpv-business-manager.vercel.app', /\.vercel\.app$/]
    : true,
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0' });
});

// Auth route
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/clients', authMiddleware, clientsRouter);
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/quotations', authMiddleware, quotationsRouter);
app.use('/api/invoices', authMiddleware, invoicesRouter);
app.use('/api/payments', authMiddleware, paymentsRouter);
app.use('/api/expenses', authMiddleware, expensesRouter);
app.use('/api/vehicles', authMiddleware, vehiclesRouter);
app.use('/api/equipment', authMiddleware, equipmentRouter);
app.use('/api/team', authMiddleware, teamRouter);
app.use('/api/reminders', authMiddleware, remindersRouter);
app.use('/api/reports', authMiddleware, reportsRouter);
app.use('/api/settings', authMiddleware, settingsRouter);

// Serve production frontend if built
const clientDist = path.resolve(process.cwd(), 'dist-client');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Bootstrap: init DB then start server
async function bootstrap() {
  await createAdapter();
  app.listen(PORT, () => {
    console.log(`[FPV Business Manager] Server running on http://localhost:${PORT}`);
  });
}

// When run directly (local dev + production node dist-server/index.js)
// In Vercel serverless, api/index.ts imports { app } and handles its own bootstrap
if (process.env.VERCEL !== '1') {
  bootstrap();
}
