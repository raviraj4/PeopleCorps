import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

const router = Router();
router.use(authenticate);
const safeFields = '-passwordHash';

router.get('/', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const filter = {};
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
    }
    if (req.query.role && mongoose.isValidObjectId(req.query.role)) filter.role = req.query.role;
    if (req.query.active === 'true' || req.query.active === 'false') filter.isActive = req.query.active === 'true';
    const [users, total] = await Promise.all([
      User.find(filter).select(safeFields).populate('role', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/', requirePermission('users', 'create'), async (req, res, next) => {
  try {
    const { name, email, password, role: roleId, phone = '', isActive = true } = req.body ?? {};
    if (!name?.trim() || !email?.trim() || !password || !roleId) {
      return res.status(400).json({ success: false, error: { message: 'Name, email, password and role are required' } });
    }
    if (password.length < 8) return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } });
    if (!mongoose.isValidObjectId(roleId) || !(await Role.exists({ _id: roleId }))) {
      return res.status(400).json({ success: false, error: { message: 'Choose a valid role' } });
    }
    const user = await User.create({ name, email, phone, role: roleId, isActive: Boolean(isActive), passwordHash: await bcrypt.hash(password, 12) });
    await user.populate('role', 'name');
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
});

router.patch('/:id', requirePermission('users', 'edit'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: { message: 'Invalid user id' } });
    const { name, email, phone, role: roleId, isActive, password } = req.body ?? {};
    const user = await User.findById(req.params.id).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    if (user.id === req.user.id && isActive === false) return res.status(400).json({ success: false, error: { message: 'You cannot deactivate your own account' } });
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (roleId !== undefined) {
      if (!mongoose.isValidObjectId(roleId) || !(await Role.exists({ _id: roleId }))) return res.status(400).json({ success: false, error: { message: 'Choose a valid role' } });
      user.role = roleId;
    }
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } });
      user.passwordHash = await bcrypt.hash(password, 12);
    }
    await user.save();
    await user.populate('role', 'name');
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

router.delete('/:id', requirePermission('users', 'delete'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: { message: 'Invalid user id' } });
    if (req.params.id === req.user.id) return res.status(400).json({ success: false, error: { message: 'You cannot delete your own account' } });
    const removed = await User.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: { id: removed.id } });
  } catch (error) { next(error); }
});

export default router;
