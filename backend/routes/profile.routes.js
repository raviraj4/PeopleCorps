import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);
router.get('/', (req, res) => res.json({ success: true, data: { id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone, role: req.user.role } }));
export default router;
