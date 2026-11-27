import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('profile', 'view'), (req, res) => res.json({ success: true, data: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role } }));
router.patch('/', requirePermission('profile', 'edit'), async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const user = req.user;
    if (body.name !== undefined) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.email !== undefined) user.email = body.email;
    if (body.newPassword) {
      if (!body.currentPassword) return res.status(400).json({ success: false, error: { message: 'Current password is required to change your password' } });
      const stored = await User.findById(user.id).select('+passwordHash');
      if (!stored || !(await bcrypt.compare(body.currentPassword, stored.passwordHash))) return res.status(400).json({ success: false, error: { message: 'Current password is incorrect' } });
      if (body.newPassword.length < 8) return res.status(400).json({ success: false, error: { message: 'New password must be at least 8 characters' } });
      stored.passwordHash = await bcrypt.hash(body.newPassword, 12);
      await stored.save();
    }
    await user.save();
    res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) { next(error); }
});
export default router;
