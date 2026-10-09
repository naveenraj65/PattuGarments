import mongoose from 'mongoose';
import { toJSON } from './plugin.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  },
  { timestamps: true, toJSON }
);

export default mongoose.model('User', userSchema);
