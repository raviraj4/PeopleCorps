import { Router } from 'express';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import Setting from '../models/Setting.js';

const router = Router();
router.use(authenticate);
router.get('/', requirePermission('settings', 'view'), async (_req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: 'workspace' }).lean();
    res.json({ success: true, data: setting?.value || { organizationName: 'PeopleCorps' } });
  } catch (error) { next(error); }
});
router.patch('/', requirePermission('settings', 'edit'), async (req, res, next) => {
  try {
    const organizationName = req.body?.organizationName?.trim();
    if (!organizationName) return res.status(400).json({ success: false, error: { message: 'Organization name is required' } });
    const setting = await Setting.findOneAndUpdate({ key: 'workspace' }, { $set: { value: { organizationName } } }, { new: true, upsert: true, runValidators: true });
    res.json({ success: true, data: setting.value });
  } catch (error) { next(error); }
});
export default router;
