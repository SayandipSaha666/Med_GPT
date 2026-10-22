// src/utils/encryption.ts
// AES-256-GCM encryption utility for protecting PII in the database.
// The master key is sourced from environment variables — never from the DB.

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits for GCM
const TAG_LENGTH = 16; // 128 bits auth tag
const SALT_LENGTH = 16;

/**
 * Derives a 256-bit encryption key from the master secret.
 * Uses scrypt for key derivation (resistant to brute-force).
 */
function getEncryptionKey(salt: Buffer): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKey) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY environment variable is required for PII encryption. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return scryptSync(masterKey, salt, KEY_LENGTH);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a combined string: salt:iv:ciphertext:authTag (all hex-encoded).
 */
export function encryptField(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const key = getEncryptionKey(salt);
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: salt:iv:ciphertext:authTag
  return [
    salt.toString("hex"),
    iv.toString("hex"),
    encrypted,
    authTag.toString("hex"),
  ].join(":");
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Expects input format: salt:iv:ciphertext:authTag
 */
export function decryptField(encryptedString: string): string {
  const parts = encryptedString.split(":");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted field format. Expected salt:iv:ciphertext:authTag");
  }

  const [saltHex, ivHex, ciphertext, authTagHex] = parts;

  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const key = getEncryptionKey(salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypts a JSON-serializable value (arrays, objects).
 * Useful for encrypting allergies[], conditions[], etc.
 */
export function encryptJSON(data: unknown): string {
  return encryptField(JSON.stringify(data));
}

/**
 * Decrypts and parses a JSON-encrypted field.
 */
export function decryptJSON<T = unknown>(encryptedString: string): T {
  return JSON.parse(decryptField(encryptedString)) as T;
}
