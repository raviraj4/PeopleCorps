import mongoose from 'mongoose';

export const MODULES = ['dashboard', 'users', 'roles', 'reports', 'settings', 'profile'];
export const ACTIONS = ['view', 'create', 'edit', 'delete'];

const permissionSchema = new mongoose.Schema({
  view: { type: Boolean, default: false },
  create: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
}, { _id: false });

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true, default: '' },
  permissions: {
    type: Map,
    of: permissionSchema,
    default: () => Object.fromEntries(MODULES.map((module) => [module, {}]))
  }
}, { timestamps: true });

export default mongoose.models.Role || mongoose.model('Role', roleSchema);
