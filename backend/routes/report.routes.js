import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, requirePermission } from '../middleware/auth.middleware.js';
import User from '../models/User.js';
import Role from '../models/Role.js';

const router = Router();
const genderLabels = {
  woman: 'Woman',
  man: 'Man',
  non_binary: 'Non-binary',
  another_identity: 'Another identity',
  prefer_not_to_say: 'Prefer not to say',
  not_provided: 'Not provided'
};

function roleFilterFromQuery(value) {
  if (!value) return {};
  if (!mongoose.isValidObjectId(value)) throw Object.assign(new Error('Invalid role filter'), { status: 400 });
  return { role: new mongoose.Types.ObjectId(value) };
}

router.get('/diversity', authenticate, requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    const filter = roleFilterFromQuery(req.query.role);
    const grouped = await User.aggregate([
      { $match: filter },
      { $group: { _id: { $cond: [{ $in: [{ $ifNull: ['$gender', ''] }, ['', null]] }, 'not_provided', '$gender'] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const total = grouped.reduce((sum, item) => sum + item.count, 0);
    const data = grouped.map(({ _id, count }) => ({ key: _id, label: genderLabels[_id] || 'Not provided', count, percentage: total ? Math.round((count / total) * 1000) / 10 : 0 }));
    res.json({ success: true, data: { total, categories: data, updatedAt: new Date().toISOString() } });
  } catch (error) { next(error); }
});

router.get('/export', authenticate, requirePermission('reports', 'view'), requirePermission('users', 'view'), async (req, res, next) => {
  try {
    const filter = roleFilterFromQuery(req.query.role);
    const [users, groupedUsers, groupedGender] = await Promise.all([
      User.find(filter).select('name email role gender isActive createdAt').populate('role', 'name').sort({ name: 1 }).lean(),
      User.aggregate([{ $match: filter }, { $group: { _id: '$role', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }]),
      User.aggregate([
        { $match: filter },
        { $group: { _id: { $cond: [{ $in: [{ $ifNull: ['$gender', ''] }, ['', null]] }, 'not_provided', '$gender'] }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ])
    ]);
    const roleCounts = new Map(groupedUsers.map((item) => [String(item._id), item]));
    const roles = await Role.find(filter.role ? { _id: filter.role } : {}).select('name').sort({ name: 1 }).lean();
    const roleSummary = roles.map((role) => {
      const counts = roleCounts.get(String(role._id)) || { total: 0, active: 0 };
      return { roleId: String(role._id), roleName: role.name, totalUsers: counts.total, activeUsers: counts.active, inactiveUsers: counts.total - counts.active };
    });
    const total = groupedGender.reduce((sum, item) => sum + item.count, 0);
    const diversity = groupedGender.map(({ _id, count }) => ({ key: _id, label: genderLabels[_id] || 'Not provided', count, percentage: total ? Math.round((count / total) * 1000) / 10 : 0 }));
    res.json({ success: true, data: { generatedAt: new Date().toISOString(), totalUsers: users.length, users, roleSummary, diversity } });
  } catch (error) { next(error); }
});

router.get('/', authenticate, requirePermission('reports', 'view'), async (req, res, next) => {
  try {
    const roleFilter = roleFilterFromQuery(req.query.role);
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
