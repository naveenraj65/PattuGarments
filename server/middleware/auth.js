import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { ah, httpError } from '../utils/http.js';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res, user) {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: WEEK,
  });
}

export async function userFromRequest(req) {
  const token = req.cookies?.token;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(id);
  } catch {
    return null;
  }
}

export const requireAuth = ah(async (req, _res, next) => {
  const user = await userFromRequest(req);
  if (!user) throw httpError(401, 'Please login to continue');
  req.user = user;
  next();
});

export const requireAdmin = [
  requireAuth,
  (req, _res, next) =>
    req.user.role === 'ADMIN' ? next() : next(httpError(403, 'Admin access only')),
];
