import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// The key must be 32 bytes (256 bits) for aes-256-gcm
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Ensure the key is exactly 32 bytes long for aes-256-gcm
const getKey = () => {
    let key = Buffer.from(ENCRYPTION_KEY, 'hex');
    if (key.length !== 32) {
        key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    }
    return key;
};

const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypts data using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt.
 * @returns {string|null} - The encrypted string in format iv:authTag:encryptedText
 */
export const encryptData = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(12); // standard for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts data using AES-256-GCM.
 * @param {string} encryptedData - The encrypted string.
 * @returns {string|null} - The decrypted plaintext.
 */
export const decryptData = (encryptedData) => {
    if (!encryptedData) return null;
    const parts = encryptedData.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted data format');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encryptedText = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};

/**
 * Produces a deterministic HMAC-SHA256 of the given plaintext using the
 * ENCRYPTION_KEY as the HMAC secret. Used for equality checks (deduplication)
 * on PII fields without revealing the plaintext. Store alongside the AES
 * ciphertext and put a UNIQUE index on the HMAC column.
 *
 * @param {string} text - The plaintext to hash (e.g. an Aadhaar number).
 * @returns {string|null} - A 64-character hex HMAC string, or null if input is falsy.
 */
export const hmacData = (text) => {
    if (!text) return null;
    return crypto
        .createHmac('sha256', getKey())
        .update(String(text))
        .digest('hex');
};

