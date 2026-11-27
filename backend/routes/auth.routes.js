import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, isActive: user.isActive, role: user.role };
}

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) return res.status(400).json({ success: false, error: { message: 'Email and password are required' } });
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash').populate('role');
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials or inactive account' } });
    }
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
    res.json({ success: true, data: { token, user: publicUser(user) } });
  } catch (error) { next(error); }
});

router.post('/logout', authenticate, (_req, res) => res.json({ success: true, data: { message: 'Logged out' } }));
router.get('/me', authenticate, (req, res) => res.json({ success: true, data: publicUser(req.user) }));
export default router;
