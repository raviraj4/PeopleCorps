import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import Role from '../models/Role.js';

const router = Router();
router.use(authenticate, requirePermission('roles', 'view'));
router.get('/', async (_req, res, next) => {
  try { res.json({ success: true, data: await Role.find().sort({ name: 1 }) }); }
  catch (error) { next(error); }
});
export default router;
