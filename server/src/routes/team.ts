import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const teamRouter = Router();

// List team members
teamRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const team = db.prepare(`
    SELECT tm.*,
           (SELECT COUNT(*) FROM project_members pm WHERE pm.team_member_id = tm.id) as project_count,
           (SELECT COALESCE(SUM(pm.agreed_rate), 0) FROM project_members pm WHERE pm.team_member_id = tm.id) as total_earned
    FROM team_members tm
    WHERE tm.organization_id = ?
    ORDER BY tm.name ASC
  `).all(orgId) as any[];

  res.json(team);
});

// Create team member
teamRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { name, role, phone, email, payment_type, standard_rate, notes } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const id = 'tm-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO team_members (id, organization_id, name, role, phone, email, payment_type, standard_rate, availability, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, name, role || 'FPV Pilot', phone || '', email || '',
    payment_type || 'Per-Day', Number(standard_rate) || 0, 'Available', notes || ''
  );

  const created = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Update team member
teamRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, phone, email, payment_type, standard_rate, availability, notes, is_active } = req.body;

  db.prepare(`
    UPDATE team_members SET
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      payment_type = COALESCE(?, payment_type),
      standard_rate = COALESCE(?, standard_rate),
      availability = COALESCE(?, availability),
      notes = COALESCE(?, notes),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, role, phone, email, payment_type,
    standard_rate !== undefined ? Number(standard_rate) : null,
    availability, notes, is_active, id
  );

  const updated = db.prepare('SELECT * FROM team_members WHERE id = ?').get(id);
  res.json(updated);
});

// Delete team member
teamRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM team_members WHERE id = ?').run(id);
  res.json({ success: true });
});
