import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { ah, httpError } from '../utils/http.js';
import { parseIdentifier, normalizeEmail, normalizePhone } from '../utils/identity.js';
import { issueOtp, checkOtp, clearOtps } from '../utils/otp.js';
import { deliverOtp } from '../utils/notify.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { setAuthCookie, userFromRequest } from '../middleware/auth.js';

const router = Router();
const sendLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many OTP requests. Try again in a few minutes.' } });
const verifyLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' } });

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role });
const isAdminEmail = (email) => !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL.trim().toLowerCase();

// ---- LOGIN (email OR phone + password) ----
router.post('/login', verifyLimiter, ah(async (req, res) => {
  const { kind, value } = parseIdentifier(req.body.identifier);
  const user = await User.findOne({ [kind]: value }).select('+passwordHash');
  const password = String(req.body.password || '');
  if (password.length > 128 || !user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    throw httpError(401, 'Invalid email/phone or password. Existing accounts can use Forgot password to set one.');
  }
  if (isAdminEmail(user.email) && user.role !== 'ADMIN') { user.role = 'ADMIN'; await user.save(); }
  setAuthCookie(res, user);
  res.json({ user: publicUser(user) });
}));

router.post('/login/send-reset-otp', sendLimiter, ah(async (req, res) => {
  const { kind, value } = parseIdentifier(req.body.identifier);
  const user = await User.findOne({ [kind]: value });
  const message = 'If an account exists, a password reset code has been sent.';
  if (!user) return res.json({ message });

  const code = await issueOtp(`${kind}:${value}`, 'password-reset');
  const dev = await deliverOtp(kind, value, code);
  res.json({ message, ...(dev && { devOtp: code }) });
}));

router.post('/login/reset-password', verifyLimiter, ah(async (req, res) => {
  const { kind, value } = parseIdentifier(req.body.identifier);
  const password = String(req.body.password || '');
  if (password.length < 8 || password.length > 128) {
    throw httpError(400, 'Password must be between 8 and 128 characters');
  }

  const user = await User.findOne({ [kind]: value });
  if (!user) throw httpError(400, 'Invalid or expired reset code');
  const key = `${kind}:${value}`;
  await checkOtp(key, 'password-reset', req.body.otp, { consume: false });
  user.passwordHash = await hashPassword(password);
  await user.save();
  await clearOtps([key], 'password-reset');
  setAuthCookie(res, user);
  res.json({ user: publicUser(user) });
}));

// ---- REGISTER (email OTP + phone OTP, both verified) ----
router.post('/register/send-otp', sendLimiter, ah(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  if (!email) throw httpError(400, 'Enter a valid email');
  if (!phone) throw httpError(400, 'Enter a valid phone number');
  if (await User.exists({ $or: [{ email }, { phone }] })) {
    throw httpError(409, 'An account with this email or phone already exists. Please login.');
  }
  const emailCode = await issueOtp(`email:${email}`, 'register');
  const phoneCode = await issueOtp(`phone:${phone}`, 'register');
  const devEmail = await deliverOtp('email', email, emailCode);
  const devPhone = await deliverOtp('phone', phone, phoneCode);
  res.json({
    message: 'OTPs sent to your email and phone',
    ...((devEmail || devPhone) && { devOtp: { email: emailCode, phone: phoneCode } }),
  });
}));

router.post('/register', verifyLimiter, ah(async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const password = String(req.body.password || '');
  if (name.length < 2 || name.length > 100) throw httpError(400, 'Enter your full name');
  if (!email || !phone) throw httpError(400, 'Enter a valid email and phone number');
  if (password.length < 8 || password.length > 128) {
    throw httpError(400, 'Password must be between 8 and 128 characters');
  }

  await checkOtp(`email:${email}`, 'register', req.body.emailOtp, { consume: false });
  await checkOtp(`phone:${phone}`, 'register', req.body.phoneOtp, { consume: false });

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash: await hashPassword(password),
    role: isAdminEmail(email) ? 'ADMIN' : 'USER',
  });
  await clearOtps([`email:${email}`, `phone:${phone}`], 'register');
  setAuthCookie(res, user);
  res.status(201).json({ user: publicUser(user) });
}));

// ---- SESSION ----
router.get('/me', ah(async (req, res) => {
  const user = await userFromRequest(req);
  res.json({ user: user ? publicUser(user) : null });
}));

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  res.json({ ok: true });
});

export default router;
