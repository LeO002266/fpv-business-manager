import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import { AccountingService } from '../services/accounting.js';
import crypto from 'node:crypto';

export const projectsRouter = Router();

projectsRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const accounting = new AccountingService(db);

    const projects = await db.query<any>(
      `SELECT p.*, c.name as client_name, c.preferred_currency as client_currency
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       WHERE p.organization_id = $1
       ORDER BY p.shoot_date DESC`,
      [orgId]
    );

    const list = await Promise.all(
      projects.map(async (proj) => ({
        ...proj,
        financials: await accounting.getProjectFinancials(proj.id),
      }))
    );
    res.json(list);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

projectsRouter.get('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const accounting = new AccountingService(db);

    const project = await db.queryOne<any>(
      `SELECT p.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.preferred_currency as client_currency
       FROM projects p
       JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [financials, members, equipment, expenses, invoices] = await Promise.all([
      accounting.getProjectFinancials(id),
      db.query<any>(`SELECT pm.*, tm.name, tm.role as standard_role, tm.phone, tm.email
                     FROM project_members pm
                     JOIN team_members tm ON pm.team_member_id = tm.id
                     WHERE pm.project_id = $1`, [id]),
      db.query<any>(`SELECT ea.*, eq.name, eq.asset_tag, eq.category, eq.condition
                     FROM equipment_assignments ea
                     JOIN equipment eq ON ea.equipment_id = eq.id
                     WHERE ea.project_id = $1`, [id]),
      db.query<any>('SELECT * FROM expenses WHERE project_id = $1 ORDER BY expense_date DESC', [id]),
      db.query<any>('SELECT * FROM invoices WHERE project_id = $1 ORDER BY issue_date DESC', [id]),
    ]);

    res.json({ project, financials, members, equipment, expenses, invoices });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

projectsRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      client_id, name, category, description, shoot_date, start_time,
      end_time, location, city, state, country, currency,
      quoted_amount, agreed_amount, advance_amount, status, notes
    } = req.body;

    if (!client_id || !name || !shoot_date) {
      return res.status(400).json({ error: 'Client, project name, and shoot date are required' });
    }

    const id = 'prj-' + crypto.randomBytes(4).toString('hex');
    const countRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM projects WHERE organization_id = $1', [orgId]);
    const count = Number(countRow?.c || countRow?.count || 0) + 1;
    const project_code = `PRJ-${String(count).padStart(3, '0')}`;

    const vals = [
      id, orgId, client_id, project_code, name, category || 'Wedding Shoot',
      description || '', shoot_date, start_time || '', end_time || '',
      location || '', city || '', state || '', country || 'India',
      currency || 'INR', Number(quoted_amount) || 0, Number(agreed_amount) || 0,
      Number(advance_amount) || 0, status || 'Confirmed', notes || ''
    ];

    if (db.isPg) {
      await db.execute(
        `INSERT INTO projects (id, organization_id, client_id, project_code, name, category,
           description, shoot_date, start_time, end_time, location, city,
           state, country, currency, quoted_amount, agreed_amount,
           advance_amount, status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        vals
      );
    } else {
      await db.execute(
        `INSERT INTO projects (id, organization_id, client_id, project_code, name, category,
           description, shoot_date, start_time, end_time, location, city,
           state, country, currency, quoted_amount, agreed_amount,
           advance_amount, status, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        vals
      );
    }

    const created = await db.queryOne<any>('SELECT * FROM projects WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

projectsRouter.put('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const {
      name, category, description, shoot_date, start_time,
      end_time, location, city, state, country, currency,
      quoted_amount, agreed_amount, advance_amount, status, notes
    } = req.body;

    if (db.isPg) {
      await db.execute(
        `UPDATE projects SET
           name = COALESCE($1, name), category = COALESCE($2, category),
           description = COALESCE($3, description), shoot_date = COALESCE($4, shoot_date),
           start_time = COALESCE($5, start_time), end_time = COALESCE($6, end_time),
           location = COALESCE($7, location), city = COALESCE($8, city),
           state = COALESCE($9, state), country = COALESCE($10, country),
           currency = COALESCE($11, currency),
           quoted_amount = COALESCE($12, quoted_amount),
           agreed_amount = COALESCE($13, agreed_amount),
           advance_amount = COALESCE($14, advance_amount),
           status = COALESCE($15, status), notes = COALESCE($16, notes),
           updated_at = NOW()
         WHERE id = $17`,
        [name, category, description, shoot_date, start_time, end_time,
         location, city, state, country, currency,
         quoted_amount !== undefined ? Number(quoted_amount) : null,
         agreed_amount !== undefined ? Number(agreed_amount) : null,
         advance_amount !== undefined ? Number(advance_amount) : null,
         status, notes, id]
      );
    } else {
      await db.execute(
        `UPDATE projects SET
           name = COALESCE(?, name), category = COALESCE(?, category),
           description = COALESCE(?, description), shoot_date = COALESCE(?, shoot_date),
           start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
           location = COALESCE(?, location), city = COALESCE(?, city),
           state = COALESCE(?, state), country = COALESCE(?, country),
           currency = COALESCE(?, currency),
           quoted_amount = COALESCE(?, quoted_amount),
           agreed_amount = COALESCE(?, agreed_amount),
           advance_amount = COALESCE(?, advance_amount),
           status = COALESCE(?, status), notes = COALESCE(?, notes),
           updated_at = datetime('now')
         WHERE id = ?`,
        [name, category, description, shoot_date, start_time, end_time,
         location, city, state, country, currency,
         quoted_amount !== undefined ? Number(quoted_amount) : null,
         agreed_amount !== undefined ? Number(agreed_amount) : null,
         advance_amount !== undefined ? Number(advance_amount) : null,
         status, notes, id]
      );
    }

    const updated = await db.queryOne<any>('SELECT * FROM projects WHERE id = $1', [id]);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

projectsRouter.post('/:id/members', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { team_member_id, role, pay_type, agreed_rate, notes } = req.body;
    if (!team_member_id) return res.status(400).json({ error: 'Team member is required' });

    const memberId = 'pm-' + crypto.randomBytes(4).toString('hex');
    const ph = (n: number) => db.isPg ? `$${n}` : '?';
    await db.execute(
      `INSERT INTO project_members (id, project_id, team_member_id, role, pay_type, agreed_rate, notes)
       VALUES (${ph(1)},${ph(2)},${ph(3)},${ph(4)},${ph(5)},${ph(6)},${ph(7)})`,
      [memberId, id, team_member_id, role || 'FPV Pilot', pay_type || 'Per-Day', Number(agreed_rate) || 0, notes || '']
    );
    res.status(201).json({ success: true, id: memberId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

projectsRouter.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const db = getAdapter();
    await db.execute('DELETE FROM project_members WHERE id = $1', [req.params.memberId]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

projectsRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const invRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM invoices WHERE project_id = $1', [id]);
    if (Number(invRow?.c || invRow?.count || 0) > 0) {
      return res.status(400).json({ error: 'Cannot delete project with existing invoices.' });
    }
    await db.execute('DELETE FROM projects WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
