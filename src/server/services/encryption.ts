/**
 * Encryption/Decryption service using Web Crypto API (edge-compatible)
 * Used for encrypting sensitive tokens in the database
 */

const IV_LENGTH = 12; // GCM uses 12 bytes

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || '';
  const encoder = new TextEncoder();
  const keyMaterial = encoder.encode(secret.padEnd(32, '0').slice(0, 32));

  return await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt text using AES-GCM
 * @param text - Plain text to encrypt
 * @returns Encrypted text as hex string
 */
export async function encrypt(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getEncryptionKey();

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Convert to hex
  return Array.from(combined)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Decrypt text using AES-GCM
 * @param text - Encrypted text as hex string
 * @returns Decrypted plain text
 */
export async function decrypt(text: string): Promise<string> {
  // Convert hex to bytes
  const bytes = new Uint8Array(
    text.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)),
  );

  // Split IV and encrypted data
  const iv = bytes.slice(0, IV_LENGTH);
  const data = bytes.slice(IV_LENGTH);
  const key = await getEncryptionKey();

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}
