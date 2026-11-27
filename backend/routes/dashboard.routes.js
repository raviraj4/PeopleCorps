import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

const router = Router();
router.get('/', authenticate, requirePermission('dashboard', 'view'), async (_req, res, next) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, totalRoles, roleCounts] = await Promise.all([
      User.countDocuments(), User.countDocuments({ isActive: true }), User.countDocuments({ isActive: false }), Role.countDocuments(),
      User.aggregate([{ $group: { _id: '$role', userCount: { $sum: 1 } } }])
    ]);
    const counts = new Map(roleCounts.map((item) => [String(item._id), item.userCount]));
    const roles = await Role.find().select('name').sort({ name: 1 }).lean();
    const rolesBreakdown = roles.map((role) => ({ id: String(role._id), name: role.name, userCount: counts.get(String(role._id)) || 0 }));
    res.json({ success: true, data: { totalUsers, activeUsers, inactiveUsers, totalRoles, roles: rolesBreakdown } });
  } catch (error) { next(error); }
});
export default router;
