import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const remindersRouter = Router();

remindersRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { status } = req.query;

  let query = 'SELECT * FROM reminders WHERE organization_id = ?';
  const params: any[] = [orgId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY due_date ASC';
  const reminders = db.prepare(query).all(...params);
  res.json(reminders);
});

remindersRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { title, type, due_date, reference_type, reference_id, priority, notes } = req.body;

  if (!title || !due_date) {
    return res.status(400).json({ error: 'Title and due date are required' });
  }

  const id = 'rem-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO reminders (id, organization_id, title, type, due_date, reference_type, reference_id, priority, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, title, type || 'Shoot', due_date,
    reference_type || 'Project', reference_id || null,
    priority || 'Medium', notes || ''
  );

  const created = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
  res.status(201).json(created);
});

remindersRouter.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare("UPDATE reminders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status || 'Completed', id);
  res.json({ success: true });
});

remindersRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
  res.json({ success: true });
});
