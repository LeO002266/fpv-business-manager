import { Router } from 'express';
import { db } from '../db/index.js';
import crypto from 'node:crypto';

export const vehiclesRouter = Router();

vehiclesRouter.get('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const vehicles = db.prepare('SELECT * FROM vehicles WHERE organization_id = ? ORDER BY name ASC').all(orgId);
  res.json(vehicles);
});

vehiclesRouter.post('/', (req, res) => {
  const orgId = req.user?.organizationId || 'org-fpv-default';
  const { name, type, make_model, license_plate, fuel_type, mileage_km_per_liter } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Vehicle name is required' });
  }

  const id = 'veh-' + crypto.randomBytes(4).toString('hex');
  db.prepare(`
    INSERT INTO vehicles (id, organization_id, name, type, make_model, license_plate, fuel_type, mileage_km_per_liter)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, orgId, name, type || 'Car', make_model || '', license_plate || '', fuel_type || 'Petrol', Number(mileage_km_per_liter) || 20.0);

  const created = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  res.status(201).json(created);
});

vehiclesRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, make_model, license_plate, fuel_type, mileage_km_per_liter, is_active } = req.body;

  db.prepare(`
    UPDATE vehicles SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      make_model = COALESCE(?, make_model),
      license_plate = COALESCE(?, license_plate),
      fuel_type = COALESCE(?, fuel_type),
      mileage_km_per_liter = COALESCE(?, mileage_km_per_liter),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, type, make_model, license_plate, fuel_type, mileage_km_per_liter !== undefined ? Number(mileage_km_per_liter) : null, is_active, id);

  const updated = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  res.json(updated);
});

vehiclesRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM vehicles WHERE id = ?').run(id);
  res.json({ success: true });
});
