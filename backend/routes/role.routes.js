import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import { ACTIONS, MODULES } from '../models/Role.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

const router = Router();
router.use(authenticate);
router.get('/options', async (req, res, next) => {
  try {
    const canManageRoles = await hasPermission(req.user, 'roles', 'view');
    const canViewUsers = await hasPermission(req.user, 'users', 'view');
    if (!canManageRoles && !canViewUsers) return res.status(403).json({ success: false, error: { message: 'You do not have permission to view roles' } });
    res.json({ success: true, data: await Role.find().select('name').sort({ name: 1 }).lean() });
  } catch (error) { next(error); }
});
router.get('/', requirePermission('roles', 'view'), async (_req, res, next) => {
  try {
    const [roles, counts] = await Promise.all([
      Role.find().sort({ name: 1 }).lean(),
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
    ]);
    const countByRole = new Map(counts.map(({ _id, count }) => [String(_id), count]));
    res.json({ success: true, data: roles.map((role) => ({ ...role, userCount: countByRole.get(String(role._id)) || 0 })) });
  } catch (error) { next(error); }
});

async function hasPermission(user, moduleName, action) {
  const role = await user.populate('role');
  const permissions = role.role?.permissions;
  const value = permissions?.get?.(moduleName) ?? permissions?.[moduleName];
  return Boolean(value?.[action]);
}

router.post('/', requirePermission('roles', 'create'), async (req, res, next) => {
  try {
    const { name, description = '', permissions = {} } = req.body ?? {};
    if (!name?.trim()) return res.status(400).json({ success: false, error: { message: 'Role name is required' } });
    res.status(201).json({ success: true, data: await Role.create({ name, description, permissions: normalizePermissions(permissions) }) });
  } catch (error) { next(error); }
});

router.patch('/:id', requirePermission('roles', 'edit'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: { message: 'Invalid role id' } });
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, error: { message: 'Role not found' } });
    if (req.body.name !== undefined) role.name = req.body.name;
    if (req.body.description !== undefined) role.description = req.body.description;
    if (req.body.permissions !== undefined) role.permissions = normalizePermissions(req.body.permissions);
    await role.save();
    res.json({ success: true, data: role });
  } catch (error) { next(error); }
});

router.delete('/:id', requirePermission('roles', 'delete'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: { message: 'Invalid role id' } });
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, error: { message: 'Role not found' } });
    if (await User.exists({ role: role._id })) return res.status(409).json({ success: false, error: { message: 'Move users to another role before deleting this role' } });
    await role.deleteOne();
    res.json({ success: true, data: { id: role.id } });
  } catch (error) { next(error); }
});

function normalizePermissions(input) {
  const clean = {};
  for (const moduleName of MODULES) {
    clean[moduleName] = {};
    for (const action of ACTIONS) clean[moduleName][action] = Boolean(input?.[moduleName]?.[action]);
  }
  return clean;
}

export default router;
