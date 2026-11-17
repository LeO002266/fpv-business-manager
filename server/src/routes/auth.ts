import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email) as any;
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(user.organization_id) as any;

  const authUser = {
    id: user.id,
    organizationId: user.organization_id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  const token = generateToken(authUser);

  res.json({
    token,
    user: authUser,
    organization: org
  });
});

authRouter.get('/me', authMiddleware, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = db.prepare('SELECT id, organization_id, name, email, role, phone, avatar_url FROM users WHERE id = ?').get(req.user.id) as any;
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.organizationId) as any;
  res.json({ user, organization: org });
});
