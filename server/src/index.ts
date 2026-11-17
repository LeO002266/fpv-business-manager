import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), version: '2.0.0' });
});

// Auth route
app.use('/api/auth', authRouter);

// Protected routes (uses authMiddleware)
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
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[FPV Business Manager] Server running on http://localhost:${PORT}`);
});
