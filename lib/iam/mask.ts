import { canUnmask, UserAccessContext } from '@/lib/iam/permissions';

// ─────────────────────────────────────────────
// SENSITIVE FIELD REGISTRY
// This is a security contract — treat it as such.
// Any new sensitive field MUST be added here.
// validateSensitiveFields() enforces this at startup.
// ─────────────────────────────────────────────

export const SENSITIVE_FIELDS: Record<string, string[]> = {
    'FEATURE:CREDENTIALS': [
        'passwordEncrypted',
        'clientSecretEnc',
        'apiKeyEncrypted',
        'privateKeyEnc',
        'passphraseEnc',
        'tokenEncrypted',
        'noteEncrypted',
    ],
    'FEATURE:ONE_TIME_SECRETS': ['secretData'],
};

// ─────────────────────────────────────────────
// RUNTIME VALIDATION (call at startup + seed)
// Throws hard if any sensitive field is missing from registry
// ─────────────────────────────────────────────

export function validateSensitiveFields(schemaFields: string[], featureKey: string): void {
    const configured = new Set(SENSITIVE_FIELDS[featureKey] || []);
    const SENSITIVE_PATTERNS = ['secret', 'token', 'encrypted', 'password', 'enc', 'key'];

    for (const field of schemaFields) {
        const lower = field.toLowerCase();
        const isSensitive = SENSITIVE_PATTERNS.some((p) => lower.includes(p));
        if (isSensitive && !configured.has(field)) {
            throw new Error(
                `[RBAC] Missing sensitive field mapping: ${featureKey}.${field} — add to SENSITIVE_FIELDS in lib/iam/mask.ts`
            );
        }
    }
}

// ─────────────────────────────────────────────
// MASKING UTILITY
// Never mutates input — always returns a deep clone
// ─────────────────────────────────────────────

function deepMaskFields(obj: any, fields: string[]): any {
    if (Array.isArray(obj)) {
        return obj.map((item) => deepMaskFields(item, fields));
    }
    if (obj !== null && typeof obj === 'object') {
        const result: any = {};
        for (const [k, v] of Object.entries(obj)) {
            if (fields.includes(k)) {
                result[k] = '****';
            } else if (v !== null && typeof v === 'object') {
                result[k] = deepMaskFields(v, fields);
            } else {
                result[k] = v;
            }
        }
        return result;
    }
    return obj;
}

/**
 * Returns a deep-cloned version of data with sensitive fields masked.
 * If the user can unmask, returns data unchanged.
 * NEVER mutates the input.
 */
export function maskSensitive<T>(
    data: T,
    userContext: UserAccessContext,
    featureKey: string
): T {
    if (canUnmask(userContext, featureKey)) return data;

    const fields = SENSITIVE_FIELDS[featureKey] ?? [];
    if (fields.length === 0) return data;

    // Safe deep clone — structuredClone preferred, JSON fallback for older runtimes
    const clone =
        typeof structuredClone === 'function'
            ? structuredClone(data)
            : JSON.parse(JSON.stringify(data));

    return deepMaskFields(clone, fields) as T;
}
