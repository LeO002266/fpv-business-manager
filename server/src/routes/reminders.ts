import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const remindersRouter = Router();

remindersRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { status } = req.query;

    let query = 'SELECT * FROM reminders WHERE organization_id = $1';
    const params: any[] = [orgId];

    if (status) {
      query += ' AND status = $2';
      params.push(status);
    }

    query += ' ORDER BY due_date ASC';
    const reminders = await db.query(query, params);
    res.json(reminders);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

remindersRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { title, type, due_date, reference_type, reference_id, priority, notes } = req.body;

    if (!title || !due_date) {
      return res.status(400).json({ error: 'Title and due date are required' });
    }

    const id = 'rem-' + crypto.randomBytes(4).toString('hex');
    await db.execute(
      `INSERT INTO reminders (id, organization_id, title, type, due_date, reference_type, reference_id, priority, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [id, orgId, title, type || 'Shoot', due_date,
       reference_type || 'Project', reference_id || null,
       priority || 'Medium', notes || '']
    );

    const created = await db.queryOne('SELECT * FROM reminders WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

remindersRouter.put('/:id/status', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { status } = req.body;
    await db.execute(
      "UPDATE reminders SET status = $1, updated_at = datetime('now') WHERE id = $2",
      [status || 'Completed', id]
    );
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

remindersRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    await db.execute('DELETE FROM reminders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
