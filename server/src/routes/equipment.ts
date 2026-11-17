import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const equipmentRouter = Router();

// List equipment
equipmentRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const equipment = db.prepare(`
    SELECT eq.*, u.name as assigned_to_name,
           (SELECT COUNT(*) FROM maintenance_logs ml WHERE ml.equipment_id = eq.id) as maintenance_count,
           (SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs ml WHERE ml.equipment_id = eq.id) as total_repair_cost
    FROM equipment eq
    LEFT JOIN users u ON eq.assigned_to_user_id = u.id
    WHERE eq.organization_id = ?
    ORDER BY eq.category ASC, eq.name ASC
  `).all(orgId) as any[];

  res.json(equipment);
});

// Get equipment detail with maintenance history
equipmentRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id) as any;
  if (!eq) {
    return res.status(404).json({ error: 'Equipment not found' });
  }

  const logs = db.prepare('SELECT * FROM maintenance_logs WHERE equipment_id = ? ORDER BY service_date DESC').all(id);
  const assignments = db.prepare(`
    SELECT ea.*, p.name as project_name, u.name as user_name
    FROM equipment_assignments ea
    JOIN projects p ON ea.project_id = p.id
    LEFT JOIN users u ON ea.assigned_user_id = u.id
    WHERE ea.equipment_id = ?
    ORDER BY ea.assigned_date DESC
  `).all(id);

  res.json({ equipment: eq, maintenanceLogs: logs, assignments });
});

// Create equipment
equipmentRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const {
    name, category, brand, model, serial_number, purchase_date,
    purchase_cost, currency, warranty_expiry, condition, notes
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Equipment name is required' });
  }

  const id = 'eq-' + crypto.randomBytes(4).toString('hex');
  const count = (db.prepare('SELECT COUNT(*) as c FROM equipment WHERE organization_id = ?').get(orgId) as any).c + 1;
  const asset_tag = `EQ-${String(count).padStart(3, '0')}`;

  db.prepare(`
    INSERT INTO equipment (
      id, organization_id, asset_tag, name, category, brand, model,
      serial_number, purchase_date, purchase_cost, currency, warranty_expiry,
      condition, availability_status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, orgId, asset_tag, name, category || 'FPV Drone', brand || '',
    model || '', serial_number || '', purchase_date || '', Number(purchase_cost) || 0,
    currency || 'INR', warranty_expiry || '', condition || 'Good', 'Available', notes || ''
  );

  const created = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Update equipment
equipmentRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    name, category, brand, model, serial_number, purchase_date,
    purchase_cost, condition, availability_status, assigned_to_user_id, notes
  } = req.body;

  db.prepare(`
    UPDATE equipment SET
      name = COALESCE(?, name),
      category = COALESCE(?, category),
      brand = COALESCE(?, brand),
      model = COALESCE(?, model),
      serial_number = COALESCE(?, serial_number),
      purchase_date = COALESCE(?, purchase_date),
      purchase_cost = COALESCE(?, purchase_cost),
      condition = COALESCE(?, condition),
      availability_status = COALESCE(?, availability_status),
      assigned_to_user_id = COALESCE(?, assigned_to_user_id),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, category, brand, model, serial_number, purchase_date,
    purchase_cost !== undefined ? Number(purchase_cost) : null,
    condition, availability_status, assigned_to_user_id, notes, id
  );

  const updated = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
  res.json(updated);
});

// Log maintenance / repair
equipmentRouter.post('/:id/maintenance', (req, res) => {
  const { id } = req.params;
  const { service_date, service_type, cost, performed_by, description, next_service_due, receipt_url } = req.body;

  const logId = 'ml-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO maintenance_logs (
      id, equipment_id, service_date, service_type, cost, performed_by,
      description, next_service_due, receipt_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    logId, id, service_date || new Date().toISOString().slice(0, 10),
    service_type || 'Repair', Number(cost) || 0, performed_by || '',
    description || '', next_service_due || '', receipt_url || ''
  );

  res.status(201).json({ success: true, id: logId });
});

// Assign equipment to project
equipmentRouter.post('/:id/assign', (req, res) => {
  const { id } = req.params;
  const { project_id, assigned_user_id, assigned_date, notes } = req.body;

  if (!project_id) {
    return res.status(400).json({ error: 'Project is required' });
  }

  const assignId = 'ea-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO equipment_assignments (id, equipment_id, project_id, assigned_user_id, assigned_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(assignId, id, project_id, assigned_user_id || null, assigned_date || new Date().toISOString().slice(0, 10), 'Assigned', notes || '');

  db.prepare("UPDATE equipment SET availability_status = 'In Use', updated_at = datetime('now') WHERE id = ?").run(id);

  res.status(201).json({ success: true, id: assignId });
});

// Return equipment
equipmentRouter.post('/:id/return', (req, res) => {
  const { id } = req.params;
  const { assignment_id, return_date } = req.body;

  if (assignment_id) {
    db.prepare(`
      UPDATE equipment_assignments 
      SET status = 'Returned', return_date = ? 
      WHERE id = ?
    `).run(return_date || new Date().toISOString().slice(0, 10), assignment_id);
  } else {
    db.prepare(`
      UPDATE equipment_assignments 
      SET status = 'Returned', return_date = ? 
      WHERE equipment_id = ? AND status = 'Assigned'
    `).run(return_date || new Date().toISOString().slice(0, 10), id);
  }

  db.prepare("UPDATE equipment SET availability_status = 'Available', updated_at = datetime('now') WHERE id = ?").run(id);
  res.json({ success: true });
});

// Delete equipment
equipmentRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
  res.json({ success: true });
});
