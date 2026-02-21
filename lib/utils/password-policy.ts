import { z } from 'zod';

/**
 * Enterprise-grade password validation schema.
 * Enforces minimum complexity requirements for all new passwords.
 */
export const PasswordSchema = z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

/**
 * Validates a password against the enterprise policy.
 * Returns { valid: true } or { valid: false, error: 'reason' }.
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
    const result = PasswordSchema.safeParse(password);
    if (!result.success) {
        return { valid: false, error: result.error.errors[0].message };
    }
    return { valid: true };
}
