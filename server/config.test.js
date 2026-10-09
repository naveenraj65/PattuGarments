import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRuntimeConfig } from './config.js';

test('uses sensible dev defaults when env vars are missing', () => {
  const config = resolveRuntimeConfig({ NODE_ENV: 'development' });

  assert.equal(config.MONGODB_URI, 'mongodb://127.0.0.1:27017/voguevibe');
  assert.ok(config.JWT_SECRET.length >= 32);
  assert.equal(config.PORT, 3000);
});

test('requires production secrets to be set explicitly', () => {
  assert.throws(
    () => resolveRuntimeConfig({ NODE_ENV: 'production' }),
    /MONGODB_URI|JWT_SECRET/
  );
});
