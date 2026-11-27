import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

const router = Router();
router.get('/', authenticate, requirePermission('dashboard', 'view'), async (_req, res, next) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, totalRoles] = await Promise.all([
      User.countDocuments(), User.countDocuments({ isActive: true }), User.countDocuments({ isActive: false }), Role.countDocuments()
    ]);
    res.json({ success: true, data: { totalUsers, activeUsers, inactiveUsers, totalRoles } });
  } catch (error) { next(error); }
});
export default router;
