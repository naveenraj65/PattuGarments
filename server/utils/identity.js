import { httpError } from './http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(raw) {
  const e = String(raw || '').trim().toLowerCase();
  return EMAIL_RE.test(e) && e.length <= 254 ? e : null;
}

export function normalizePhone(raw) {
  const cc = process.env.DEFAULT_COUNTRY_CODE || '+91';
  let p = String(raw || '').replace(/[\s\-()]/g, '');
  if (/^\d{10}$/.test(p)) p = cc + p;
  else if (/^0\d{10}$/.test(p)) p = cc + p.slice(1);
  else if (/^\d{11,15}$/.test(p)) p = '+' + p;
  return /^\+[1-9]\d{9,14}$/.test(p) ? p : null;
}

// "abc@x.com" -> {kind:'email'}, "9876543210" -> {kind:'phone'}
export function parseIdentifier(raw) {
  const s = String(raw || '').trim();
  const value = s.includes('@') ? normalizeEmail(s) : normalizePhone(s);
  if (!value) throw httpError(400, 'Enter a valid email or phone number');
  return { kind: s.includes('@') ? 'email' : 'phone', value };
}
