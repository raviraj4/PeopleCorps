import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/database.js';
import Role, { MODULES } from '../models/Role.js';
import User from '../models/User.js';

const all = { view: true, create: true, edit: true, delete: true };
const view = { view: true, create: false, edit: false, delete: false };
const none = { view: false, create: false, edit: false, delete: false };
const profile = { ...all };
const defaults = [
  {
    name: 'Admin', description: 'Full access to all modules',
    permissions: Object.fromEntries(MODULES.map((module) => [module, { ...all }]))
  },
  {
    name: 'Manager', description: 'Can view dashboard, users, and reports',
    permissions: { dashboard: { ...view }, users: { ...view }, roles: { ...none }, reports: { ...view }, settings: { ...none }, profile: { ...profile } }
  },
  {
    name: 'Employee', description: 'Can view the dashboard and manage their profile',
    permissions: { dashboard: { ...view }, users: { ...none }, roles: { ...none }, reports: { ...none }, settings: { ...none }, profile: { ...profile } }
  }
];

try {
  await connectDatabase();
  const roles = new Map();
  for (const roleData of defaults) {
    const role = await Role.findOneAndUpdate({ name: roleData.name }, { $set: roleData }, { new: true, upsert: true, runValidators: true });
    roles.set(role.name, role);
    console.log(`Seeded ${role.name} role`);
  }

  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || 'PeopleCorps Admin';
  if (email && password) {
    if (password.length < 12) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters');
    const existing = await User.findOne({ email });
    if (!existing) {
      await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: roles.get('Admin')._id, isActive: true });
      console.log(`Created initial administrator ${email}`);
    } else {
      console.log(`Administrator ${email} already exists; left it unchanged`);
    }
  } else {
    console.log('No administrator created. Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create one.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  const mongoose = await import('mongoose');
  await mongoose.default.disconnect();
}
