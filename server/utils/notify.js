import nodemailer from 'nodemailer';
import { httpError } from './http.js';

const isProd = process.env.NODE_ENV === 'production';
let transporter;

const DEFAULT_PLACEHOLDER_VALUES = new Set([
  'yourgmail@gmail.com',
  'your-16-char-app-password',
  'change-me-to-a-long-random-string-at-least-32-chars',
  'you@example.com',
]);

export function shouldUseDevOtpFallback(kind, env = process.env) {
  if (env.NODE_ENV === 'production') return false;

  if (kind === 'email') {
    const host = String(env.SMTP_HOST || '').trim();
    const user = String(env.SMTP_USER || '').trim();
    const pass = String(env.SMTP_PASS || '').trim();
    return !host || !user || !pass || DEFAULT_PLACEHOLDER_VALUES.has(user) || DEFAULT_PLACEHOLDER_VALUES.has(pass);
  }

  if (kind === 'phone') {
    const provider = String(env.SMS_PROVIDER || '').trim();
    const fast2smsKey = String(env.FAST2SMS_API_KEY || '').trim();
    const hasTwilio = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM);
    if (!provider) return true;
    if (provider === 'fast2sms') return !fast2smsKey || DEFAULT_PLACEHOLDER_VALUES.has(fast2smsKey);
    if (provider === 'twilio') return !hasTwilio;
    return true;
  }

  return false;
}

function getTransporter() {
  if (shouldUseDevOtpFallback('email')) return null;
  if (!process.env.SMTP_HOST) return null;
  transporter ||= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendSms(phone, code) {
  const provider = process.env.SMS_PROVIDER; // 'fast2sms' | 'twilio'
  if (shouldUseDevOtpFallback('phone')) return false;
  if (provider === 'fast2sms') {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { authorization: process.env.FAST2SMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ route: 'otp', variables_values: code, numbers: phone.replace(/^\+91/, '') }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.return === false) throw new Error(`Fast2SMS failed: ${data.message || res.status}`);
    return true;
  }
  if (provider === 'twilio') {
    const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: phone, From: from, Body: `Your Pattu Garments OTP is ${code}. Valid for 5 minutes.` }),
    });
    if (!res.ok) throw new Error(`Twilio failed: ${res.status}`);
    return true;
  }
  return false;
}

/**
 * Sends the OTP. Returns true when NO provider is configured and we are in
 * development (OTP is printed to the server console instead).
 */
export async function deliverOtp(kind, target, code) {
  try {
    if (kind === 'email') {
      if (shouldUseDevOtpFallback('email')) {
        console.log(`\n[DEV OTP] ${kind} ${target} -> ${code}\n`);
        return true;
      }
      const t = getTransporter();
      if (t) {
        await t.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: target,
          subject: 'Your Pattu Garments login code',
          text: `Your OTP is ${code}. It is valid for 5 minutes. If you didn't request it, ignore this email.`,
        });
        return false;
      }
    } else if (await sendSms(target, code)) {
      return false;
    }
  } catch (err) {
    if (!isProd) {
      console.warn(`\n[DEV OTP fallback] ${kind} ${target} -> ${code} (delivery failed: ${err.message})\n`);
      return true;
    }
    console.error('OTP delivery error:', err.message);
    throw httpError(502, `Could not send OTP to your ${kind}. Please try again.`);
  }
  if (isProd) throw httpError(500, `${kind} OTP delivery is not configured on the server`);
  console.log(`\n[DEV OTP] ${kind} ${target} -> ${code}\n`);
  return true;
}
