import crypto from 'crypto';
import Otp from '../models/Otp.js';
import { httpError } from './http.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_GAP_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const hash = (key, code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${key}:${code}`).digest('hex');

export async function issueOtp(key, purpose) {
  const existing = await Otp.findOne({ key, purpose });
  if (existing && Date.now() - existing.lastSentAt.getTime() < RESEND_GAP_MS) {
    throw httpError(429, 'Please wait 30 seconds before requesting another OTP');
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await Otp.findOneAndUpdate(
    { key, purpose },
    { hash: hash(key, code), expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0, lastSentAt: new Date() },
    { upsert: true }
  );
  return code;
}

export async function checkOtp(key, purpose, code, { consume = true } = {}) {
  const rec = await Otp.findOne({ key, purpose });
  if (!rec || rec.expiresAt < new Date()) throw httpError(400, 'OTP expired. Please request a new one');
  if (rec.attempts >= MAX_ATTEMPTS) {
    await rec.deleteOne();
    throw httpError(429, 'Too many wrong attempts. Please request a new OTP');
  }
  const given = Buffer.from(hash(key, String(code || '').trim()));
  const real = Buffer.from(rec.hash);
  if (!crypto.timingSafeEqual(given, real)) {
    rec.attempts += 1;
    await rec.save();
    throw httpError(400, 'Invalid OTP');
  }
  if (consume) await rec.deleteOne();
}

export const clearOtps = (keys, purpose) => Otp.deleteMany({ key: { $in: keys }, purpose });
