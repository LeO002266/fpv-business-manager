import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const equipmentRouter = Router();

// List equipment
equipmentRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const equipment = await db.query(`
      SELECT eq.*, u.name as assigned_to_name,
             (SELECT COUNT(*) FROM maintenance_logs ml WHERE ml.equipment_id = eq.id) as maintenance_count,
             (SELECT COALESCE(SUM(cost), 0) FROM maintenance_logs ml WHERE ml.equipment_id = eq.id) as total_repair_cost
      FROM equipment eq
      LEFT JOIN users u ON eq.assigned_to_user_id = u.id
      WHERE eq.organization_id = $1
      ORDER BY eq.category ASC, eq.name ASC
    `, [orgId]);

    res.json(equipment);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Get equipment detail with maintenance history
equipmentRouter.get('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const eq = await db.queryOne('SELECT * FROM equipment WHERE id = $1', [id]);
    if (!eq) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const logs = await db.query('SELECT * FROM maintenance_logs WHERE equipment_id = $1 ORDER BY service_date DESC', [id]);
    const assignments = await db.query(`
      SELECT ea.*, p.name as project_name, u.name as user_name
      FROM equipment_assignments ea
      JOIN projects p ON ea.project_id = p.id
      LEFT JOIN users u ON ea.assigned_user_id = u.id
      WHERE ea.equipment_id = $1
      ORDER BY ea.assigned_date DESC
    `, [id]);

    res.json({ equipment: eq, maintenanceLogs: logs, assignments });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Create equipment
equipmentRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const {
      name, category, brand, model, serial_number, purchase_date,
      purchase_cost, currency, warranty_expiry, condition, notes
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Equipment name is required' });
    }

    const id = 'eq-' + crypto.randomBytes(4).toString('hex');
    const countRow = await db.queryOne<any>('SELECT COUNT(*) as c FROM equipment WHERE organization_id = $1', [orgId]);
    const count = Number(countRow?.c || 0) + 1;
    const asset_tag = `EQ-${String(count).padStart(3, '0')}`;

    await db.execute(`
      INSERT INTO equipment (
        id, organization_id, asset_tag, name, category, brand, model,
        serial_number, purchase_date, purchase_cost, currency, warranty_expiry,
        condition, availability_status, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    `, [
      id, orgId, asset_tag, name, category || 'FPV Drone', brand || '',
      model || '', serial_number || '', purchase_date || '', Number(purchase_cost) || 0,
      currency || 'INR', warranty_expiry || '', condition || 'Good', 'Available', notes || ''
    ]);

    const created = await db.queryOne('SELECT * FROM equipment WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Update equipment
equipmentRouter.put('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const {
      name, category, brand, model, serial_number, purchase_date,
      purchase_cost, condition, availability_status, assigned_to_user_id, notes
    } = req.body;

    await db.execute(`
      UPDATE equipment SET
        name = COALESCE($1, name),
        category = COALESCE($2, category),
        brand = COALESCE($3, brand),
        model = COALESCE($4, model),
        serial_number = COALESCE($5, serial_number),
        purchase_date = COALESCE($6, purchase_date),
        purchase_cost = COALESCE($7, purchase_cost),
        condition = COALESCE($8, condition),
        availability_status = COALESCE($9, availability_status),
        assigned_to_user_id = COALESCE($10, assigned_to_user_id),
        notes = COALESCE($11, notes),
        updated_at = datetime('now')
      WHERE id = $12
    `, [
      name, category, brand, model, serial_number, purchase_date,
      purchase_cost !== undefined ? Number(purchase_cost) : null,
      condition, availability_status, assigned_to_user_id, notes, id
    ]);

    const updated = await db.queryOne('SELECT * FROM equipment WHERE id = $1', [id]);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Log maintenance / repair
equipmentRouter.post('/:id/maintenance', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { service_date, service_type, cost, performed_by, description, next_service_due, receipt_url } = req.body;

    const logId = 'ml-' + crypto.randomBytes(4).toString('hex');
    await db.execute(`
      INSERT INTO maintenance_logs (
        id, equipment_id, service_date, service_type, cost, performed_by,
        description, next_service_due, receipt_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    `, [
      logId, id, service_date || new Date().toISOString().slice(0, 10),
      service_type || 'Repair', Number(cost) || 0, performed_by || '',
      description || '', next_service_due || '', receipt_url || ''
    ]);

    res.status(201).json({ success: true, id: logId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Assign equipment to project
equipmentRouter.post('/:id/assign', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { project_id, assigned_user_id, assigned_date, notes } = req.body;

    if (!project_id) {
      return res.status(400).json({ error: 'Project is required' });
    }

    const assignId = 'ea-' + crypto.randomBytes(4).toString('hex');
    await db.execute(`
      INSERT INTO equipment_assignments (id, equipment_id, project_id, assigned_user_id, assigned_date, status, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [assignId, id, project_id, assigned_user_id || null, assigned_date || new Date().toISOString().slice(0, 10), 'Assigned', notes || '']);

    await db.execute("UPDATE equipment SET availability_status = 'In Use', updated_at = datetime('now') WHERE id = $1", [id]);

    res.status(201).json({ success: true, id: assignId });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Return equipment
equipmentRouter.post('/:id/return', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { assignment_id, return_date } = req.body;

    if (assignment_id) {
      await db.execute(`
        UPDATE equipment_assignments 
        SET status = 'Returned', return_date = $1 
        WHERE id = $2
      `, [return_date || new Date().toISOString().slice(0, 10), assignment_id]);
    } else {
      await db.execute(`
        UPDATE equipment_assignments 
        SET status = 'Returned', return_date = $1 
        WHERE equipment_id = $2 AND status = 'Assigned'
      `, [return_date || new Date().toISOString().slice(0, 10), id]);
    }

    await db.execute("UPDATE equipment SET availability_status = 'Available', updated_at = datetime('now') WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Delete equipment
equipmentRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    await db.execute('DELETE FROM equipment WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
