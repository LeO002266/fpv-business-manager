import { Router } from 'express';
import { db } from '../db/index.js';
import { AccountingService } from '../services/accounting.js';
import crypto from 'node:crypto';

export const projectsRouter = Router();
const accounting = new AccountingService(db);

// List projects with client names and financial metrics
projectsRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const projects = db.prepare(`
    SELECT p.*, c.name as client_name, c.preferred_currency as client_currency
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.organization_id = ?
    ORDER BY p.shoot_date DESC
  `).all(orgId) as any[];

  const list = projects.map(proj => {
    const financials = accounting.getProjectFinancials(proj.id);
    return {
      ...proj,
      financials
    };
  });

  res.json(list);
});

// Get project details with assigned team, equipment, expenses, and financial dashboard
projectsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const project = db.prepare(`
    SELECT p.*, c.name as client_name, c.phone as client_phone, c.email as client_email, c.preferred_currency as client_currency
    FROM projects p
    JOIN clients c ON p.client_id = c.id
    WHERE p.id = ?
  `).get(id) as any;

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const financials = accounting.getProjectFinancials(id);

  // Assigned team members
  const members = db.prepare(`
    SELECT pm.*, tm.name, tm.role as standard_role, tm.phone, tm.email
    FROM project_members pm
    JOIN team_members tm ON pm.team_member_id = tm.id
    WHERE pm.project_id = ?
  `).all(id) as any[];

  // Assigned equipment
  const equipment = db.prepare(`
    SELECT ea.*, eq.name, eq.asset_tag, eq.category, eq.condition
    FROM equipment_assignments ea
    JOIN equipment eq ON ea.equipment_id = eq.id
    WHERE ea.project_id = ?
  `).all(id) as any[];

  // Linked expenses
  const expenses = db.prepare(`
    SELECT * FROM expenses
    WHERE project_id = ?
    ORDER BY expense_date DESC
  `).all(id) as any[];

  // Linked invoices
  const invoices = db.prepare(`
    SELECT * FROM invoices
    WHERE project_id = ?
    ORDER BY issue_date DESC
  `).all(id) as any[];

  res.json({
    project,
    financials,
    members,
    equipment,
    expenses,
    invoices
  });
});

// Create project
projectsRouter.post('/', (req, res) => {
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
  const count = (db.prepare('SELECT COUNT(*) as c FROM projects WHERE organization_id = ?').get(orgId) as any).c + 1;
  const project_code = `PRJ-${String(count).padStart(3, '0')}`;

  db.prepare(`
    INSERT INTO projects (
      id, organization_id, client_id, project_code, name, category,
      description, shoot_date, start_time, end_time, location, city,
      state, country, currency, quoted_amount, agreed_amount,
      advance_amount, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, client_id, project_code, name, category || 'Wedding Shoot',
    description || '', shoot_date, start_time || '', end_time || '',
    location || '', city || '', state || '', country || 'India',
    currency || 'INR', Number(quoted_amount) || 0, Number(agreed_amount) || 0,
    Number(advance_amount) || 0, status || 'Confirmed', notes || ''
  );

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Update project
projectsRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, category, description, shoot_date, start_time,
    end_time, location, city, state, country, currency,
    quoted_amount, agreed_amount, advance_amount, status, notes
  } = req.body;

  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      description = COALESCE(?, description),
      shoot_date = COALESCE(?, shoot_date),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      location = COALESCE(?, location),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      country = COALESCE(?, country),
      currency = COALESCE(?, currency),
      quoted_amount = COALESCE(?, quoted_amount),
      agreed_amount = COALESCE(?, agreed_amount),
      advance_amount = COALESCE(?, advance_amount),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, category, description, shoot_date, start_time,
    end_time, location, city, state, country, currency,
    quoted_amount !== undefined ? Number(quoted_amount) : null,
    agreed_amount !== undefined ? Number(agreed_amount) : null,
    advance_amount !== undefined ? Number(advance_amount) : null,
    status, notes, id
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json(updated);
});

// Assign team member to project with rate
projectsRouter.post('/:id/members', (req, res) => {
  const { id } = req.params;
  const { team_member_id, role, pay_type, agreed_rate, notes } = req.body;

  if (!team_member_id) {
    return res.status(400).json({ error: 'Team member is required' });
  }

  const memberId = 'pm-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO project_members (id, project_id, team_member_id, role, pay_type, agreed_rate, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(memberId, id, team_member_id, role || 'FPV Pilot', pay_type || 'Per-Day', Number(agreed_rate) || 0, notes || '');

  res.status(201).json({ success: true, id: memberId });
});

// Remove team member from project
projectsRouter.delete('/:id/members/:memberId', (req, res) => {
  const { memberId } = req.params;
  db.prepare('DELETE FROM project_members WHERE id = ?').run(memberId);
  res.json({ success: true });
});

// Delete project
projectsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const invCount = (db.prepare('SELECT COUNT(*) as c FROM invoices WHERE project_id = ?').get(id) as any).c;
  if (invCount > 0) {
    return res.status(400).json({ error: 'Cannot delete project with existing invoices. Cancel or archive instead.' });
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  res.json({ success: true });
});
