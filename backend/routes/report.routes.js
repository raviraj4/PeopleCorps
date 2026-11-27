import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

const router = Router();
router.get('/', authenticate, requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    const roleFilter = req.query.role ? { role: req.query.role } : {};
    const [roles, grouped] = await Promise.all([
      Role.find().select('name').sort({ name: 1 }).lean(),
      User.aggregate([
        { $match: roleFilter },
        { $group: { _id: '$role', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }
      ])
    ]);
    const summaries = new Map(grouped.map((item) => [String(item._id), item]));
    const data = roles.map((role) => {
      const summary = summaries.get(String(role._id)) || { total: 0, active: 0 };
      return { roleId: role._id, roleName: role.name, totalUsers: summary.total, activeUsers: summary.active, inactiveUsers: summary.total - summary.active };
    }).filter((item) => !req.query.role || String(item.roleId) === req.query.role);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
export default router;
