import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  key: { type: String, required: true },       // "email:a@b.com" | "phone:+9198..."
  purpose: { type: String, enum: ['login', 'register'], required: true },
  hash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  lastSentAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});
otpSchema.index({ key: 1, purpose: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-delete

export default mongoose.model('Otp', otpSchema);
