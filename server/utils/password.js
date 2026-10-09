import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password, passwordHash) {
  if (typeof passwordHash !== 'string') return false;
  const [algorithm, salt, storedKey] = passwordHash.split('$');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(storedKey)) {
    return false;
  }

  const key = await scrypt(password, salt, KEY_LENGTH);
  const expected = Buffer.from(storedKey, 'hex');
  return crypto.timingSafeEqual(key, expected);
}
