import { Router } from 'express';
import { getAdapter } from '../db/index.js';
import crypto from 'node:crypto';

export const vehiclesRouter = Router();

vehiclesRouter.get('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const vehicles = await db.query('SELECT * FROM vehicles WHERE organization_id = $1 ORDER BY name ASC', [orgId]);
    res.json(vehicles);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

vehiclesRouter.post('/', async (req, res) => {
  try {
    const db = getAdapter();
    const orgId = req.user?.organizationId || 'org-fpv-default';
    const { name, type, make_model, license_plate, fuel_type, mileage_km_per_liter } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Vehicle name is required' });
    }

    const id = 'veh-' + crypto.randomBytes(4).toString('hex');
    await db.execute(
      `INSERT INTO vehicles (id, organization_id, name, type, make_model, license_plate, fuel_type, mileage_km_per_liter)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id, orgId, name, type || 'Car', make_model || '', license_plate || '', fuel_type || 'Petrol', Number(mileage_km_per_liter) || 20.0]
    );

    const created = await db.queryOne('SELECT * FROM vehicles WHERE id = $1', [id]);
    res.status(201).json(created);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

vehiclesRouter.put('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    const { id } = req.params;
    const { name, type, make_model, license_plate, fuel_type, mileage_km_per_liter, is_active } = req.body;

    await db.execute(
      `UPDATE vehicles SET
         name = COALESCE($1, name),
         type = COALESCE($2, type),
         make_model = COALESCE($3, make_model),
         license_plate = COALESCE($4, license_plate),
         fuel_type = COALESCE($5, fuel_type),
         mileage_km_per_liter = COALESCE($6, mileage_km_per_liter),
         is_active = COALESCE($7, is_active),
         updated_at = datetime('now')
       WHERE id = $8`,
      [name, type, make_model, license_plate, fuel_type,
       mileage_km_per_liter !== undefined ? Number(mileage_km_per_liter) : null,
       is_active, id]
    );

    const updated = await db.queryOne('SELECT * FROM vehicles WHERE id = $1', [id]);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

vehiclesRouter.delete('/:id', async (req, res) => {
  try {
    const db = getAdapter();
    await db.execute('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
