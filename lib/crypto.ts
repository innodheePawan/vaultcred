import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

function getMasterKey(): Buffer {
    const keyHex = process.env.MASTER_KEY;
    if (!keyHex) {
        throw new Error('MASTER_KEY environment variable is not set.');
    }
    // If the key is already 32 bytes (64 hex chars), use it directly.
    // Otherwise, you might want to hash it or derive it, but for this app we expect a 32-byte hex key.
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
        throw new Error('MASTER_KEY must be a 32-byte hex string (64 characters).');
    }
    return key;
}

/**
 * Encrypts a string using AES-256-GCM.
 * format: iv:authTag:encryptedContent
 */
export function encrypt(text: string): string {
    const masterKey = getMasterKey();
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, masterKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-GCM.
 * Expects format: iv:authTag:encryptedContent
 */
export function decrypt(text: string): string {
    const masterKey = getMasterKey();
    const [ivHex, authTagHex, encryptedHex] = text.split(':');

    if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid encrypted text format.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, masterKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
