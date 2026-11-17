import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const teamRouter = Router();

teamRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const team = await db.query<any>(
      `SELECT tm.*,
              (SELECT COUNT(*) FROM project_members pm WHERE pm.team_member_id = tm.id) as project_count,
              (SELECT COALESCE(SUM(pm.agreed_rate), 0) FROM project_members pm WHERE pm.team_member_id = tm.id) as total_earned
       FROM team_members tm
       WHERE tm.organization_id = $1
       ORDER BY tm.name ASC`,
      [orgId]
    );
    res.json(team);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

teamRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { name, role, phone, email, payment_type, standard_rate, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const id = 'tm-' + crypto.randomBytes(4).toString('hex');
    const ph = (n: number) => db.isPg ? `$${n}` : '?';
    await db.execute(
      `INSERT INTO team_members (id, organization_id, name, role, phone, email, payment_type, standard_rate, availability, notes)
       VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)},${ph(8)},${ph(9)},${ph(10)})`,
      [id, orgId, name, role || 'FPV Pilot', phone || '', email || '',
       payment_type || 'Per-Day', Number(standard_rate) || 0, 'Available', notes || '']
    );

    const created = await db.queryOne<any>('SELECT * FROM team_members WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

teamRouter.put('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { name, role, phone, email, payment_type, standard_rate, availability, notes, is_active } = req.body;

    if (db.isPg) {
      await db.execute(
        `UPDATE team_members SET
           name = COALESCE($1, name), role = COALESCE($2, role),
           phone = COALESCE($3, phone), email = COALESCE($4, email),
           payment_type = COALESCE($5, payment_type),
           standard_rate = COALESCE($6, standard_rate),
           availability = COALESCE($7, availability),
           notes = COALESCE($8, notes), is_active = COALESCE($9, is_active),
           updated_at = NOW()
         WHERE id = $10`,
        [name, role, phone, email, payment_type,
         standard_rate !== undefined ? Number(standard_rate) : null,
         availability, notes, is_active, id]
      );
    } else {
      await db.execute(
        `UPDATE team_members SET
           name = COALESCE(?, name), role = COALESCE(?, role),
           phone = COALESCE(?, phone), email = COALESCE(?, email),
           payment_type = COALESCE(?, payment_type),
           standard_rate = COALESCE(?, standard_rate),
           availability = COALESCE(?, availability),
           notes = COALESCE(?, notes), is_active = COALESCE(?, is_active),
           updated_at = datetime('now')
         WHERE id = ?`,
        [name, role, phone, email, payment_type,
         standard_rate !== undefined ? Number(standard_rate) : null,
         availability, notes, is_active, id]
      );
    }

    const updated = await db.queryOne<any>('SELECT * FROM team_members WHERE id = $1', [id]);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

teamRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    await db.execute('DELETE FROM team_members WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
