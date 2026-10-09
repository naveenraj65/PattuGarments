import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from './password.js';

test('password hashes are salted and verify only the matching password', async () => {
  const password = 'correct-horse-battery';
  const firstHash = await hashPassword(password);
  const secondHash = await hashPassword(password);

  assert.notEqual(firstHash, secondHash);
  assert.equal(await verifyPassword(password, firstHash), true);
  assert.equal(await verifyPassword('incorrect-password', firstHash), false);
  assert.equal(await verifyPassword(password, undefined), false);
});
