import { Router } from 'express';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

const router = Router();
router.use(authenticate);
const safeFields = '-passwordHash';
function publicUser(user) {
  const result = user.toObject();
  delete result.passwordHash;
  return result;
}

router.get('/', requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const filter = {};
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
    }
    if (req.query.role) {
      if (!mongoose.isValidObjectId(req.query.role)) return res.status(400).json({ success: false, error: { message: 'Invalid role filter' } });
      filter.role = req.query.role;
    }
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
    const { name, email, password, role: roleId, phone = '', gender = '', isActive = true } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password || typeof roleId !== 'string' || !roleId) {
      return res.status(400).json({ success: false, error: { message: 'Name, email, password and role are required' } });
    }
    if (password.length < 8) return res.status(400).json({ success: false, error: { message: 'Password must be at least 8 characters' } });
    if (typeof isActive !== 'boolean') return res.status(400).json({ success: false, error: { message: 'isActive must be a boolean' } });
    if (!mongoose.isValidObjectId(roleId) || !(await Role.exists({ _id: roleId }))) {
      return res.status(400).json({ success: false, error: { message: 'Choose a valid role' } });
    }
    const user = await User.create({ name, email, phone, gender, role: roleId, isActive: Boolean(isActive), passwordHash: await bcrypt.hash(password, 12) });
    await user.populate('role', 'name');
    res.status(201).json({ success: true, data: publicUser(user) });
  } catch (error) { next(error); }
});

router.patch('/:id', requirePermission('users', 'edit'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: { message: 'Invalid user id' } });
    const { name, email, phone, gender, role: roleId, isActive, password } = req.body ?? {};
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    if (user.id === req.user.id && isActive === false) return res.status(400).json({ success: false, error: { message: 'You cannot deactivate your own account' } });
    if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ success: false, error: { message: 'isActive must be a boolean' } });
    if (user.id === req.user.id && roleId !== undefined && String(roleId) !== String(user.role)) return res.status(400).json({ success: false, error: { message: 'You cannot change your own role' } });
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
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
    res.json({ success: true, data: publicUser(user) });
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
