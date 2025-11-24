const crypto = require('crypto');

// ENCRYPTION_KEY must be 32 bytes (base64 or hex). Provide via env var `ENCRYPTION_KEY`.
const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set in environment');
  // Allow raw 32-byte key or base64 input
  let buf = null;
  try {
    buf = Buffer.from(key, 'base64');
    if (buf.length !== 32) {
      buf = Buffer.from(key, 'hex');
    }
  } catch (e) {
    buf = Buffer.from(key, 'utf8');
  }
  if (buf.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 or hex)');
  return buf;
}

function encrypt(plaintext) {
  if (plaintext === undefined || plaintext === null) return null;
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Store as base64 iv:cipher:tag
  return `${iv.toString('base64')}:${encrypted.toString('base64')}:${authTag.toString('base64')}`;
}

function decrypt(payload) {
  if (!payload) return null;
  const parts = String(payload).split(':');
  if (parts.length !== 3) return null;
  const [ivB64, cipherB64, tagB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const encrypted = Buffer.from(cipherB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: 16 });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
