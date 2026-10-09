import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldUseDevOtpFallback } from './utils/notify.js';

test('dev fallback is used for placeholder SMTP credentials', () => {
  assert.equal(
    shouldUseDevOtpFallback('email', {
      NODE_ENV: 'development',
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_USER: 'yourgmail@gmail.com',
      SMTP_PASS: 'your-16-char-app-password',
    }),
    true,
  );
});

test('dev fallback is used when no SMS provider is configured', () => {
  assert.equal(
    shouldUseDevOtpFallback('phone', {
      NODE_ENV: 'development',
      SMS_PROVIDER: '',
      FAST2SMS_API_KEY: '',
    }),
    true,
  );
});
