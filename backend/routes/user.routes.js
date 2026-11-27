import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

const router = Router();
router.use(authenticate, requirePermission('users', 'view'));

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = 10;
    const filter = {};
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
    }
    if (req.query.role) filter.role = req.query.role;
    if (req.query.active === 'true' || req.query.active === 'false') filter.isActive = req.query.active === 'true';
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').populate('role', 'name').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

// CRUD routes are added alongside permission-checked controllers.
export default router;
