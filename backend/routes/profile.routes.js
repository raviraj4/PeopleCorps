import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = Router();
router.use(authenticate);
router.get('/', (req, res) => res.json({ success: true, data: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role } }));
router.patch('/', async (req, res, next) => {
  try {
    const user = req.user;
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.email !== undefined) user.email = req.body.email;
    if (req.body.newPassword) {
      if (!req.body.currentPassword) return res.status(400).json({ success: false, error: { message: 'Current password is required to change your password' } });
      const stored = await User.findById(user.id).select('+passwordHash');
      if (!stored || !(await bcrypt.compare(req.body.currentPassword, stored.passwordHash))) return res.status(400).json({ success: false, error: { message: 'Current password is incorrect' } });
      if (req.body.newPassword.length < 8) return res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters' } });
      stored.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
      await stored.save();
    }
    await user.save();
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) { next(error); }
});
export default router;
