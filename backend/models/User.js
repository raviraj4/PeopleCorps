import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  isActive: { type: Boolean, default: true },
  phone: { type: String, trim: true, default: '' }
}, { timestamps: true });

userSchema.index({ name: 'text', email: 'text' });
export default mongoose.models.User || mongoose.model('User', userSchema);
