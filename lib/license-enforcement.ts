import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { verifyLicenseServerSignature } from '@/lib/license-utils';
import { LICENCE_PUBLIC_KEY } from '@/lib/public-key';

export type LicenseState = 'UNACTIVATED' | 'COMPROMISED' | 'VALID' | 'GRACE' | 'LOCKED';

export interface LicenseInfo {
    state: LicenseState;
    validityTill?: Date;
    graceEnd?: Date;
    gracePeriodDays?: number;
    activeUsers?: number;
    rawPayload?: string;
    signatureVerified?: boolean;
}

// Global cache for Node.js runtime to ensure <200ms checks
let CACHED_LICENSE_INFO: LicenseInfo | null = null;

export async function getLicenseState(forceRefresh = false): Promise<LicenseInfo> {
    if (!forceRefresh && CACHED_LICENSE_INFO) {
        return CACHED_LICENSE_INFO;
    }

    try {
        const records = await prisma.licenseRegistry.findMany({
            where: { isActive: true }
        });

        if (!records || records.length === 0) {
            CACHED_LICENSE_INFO = { state: 'UNACTIVATED' };
            return CACHED_LICENSE_INFO;
        }

        const data: Record<string, string> = {};

        for (const record of records) {
            try {
                const key = decrypt(record.regKey);

                // Safe parsing for serverless environments (Uint8Array vs Buffer)
                // Prisma translates Bytes to Buffer in Node, but Uint8Array in Edge. Buffer.from handles both.
                const valueStr = Buffer.from(record.regValue as any).toString('utf-8');
                const value = decrypt(valueStr);
                data[key] = value;
            } catch (e) {
                // If any key fails decryption, we consider the registry potentially tampered
                console.error('[License] Decryption failed for a registry entry. Treating as COMPROMISED.', e);
                CACHED_LICENSE_INFO = { state: 'COMPROMISED' };
                return CACHED_LICENSE_INFO;
            }
        }

        const validityTillStr = data['VALIDITY_TILL'];
        const graceDaysStr = data['GRACE_DAYS'];
        const activeUsersStr = data['ACTIVE_USERS'];
        const signature = data['SIGNATURE'];
        const rawPayload = data['RAW_PAYLOAD'];

        if (!validityTillStr || !graceDaysStr || !activeUsersStr || !signature || !rawPayload) {

            CACHED_LICENSE_INFO = { state: 'COMPROMISED' };
            return CACHED_LICENSE_INFO;
        }

        // Verify PGP Signature
        const isSignatureValid = await verifyLicenseServerSignature(signature, rawPayload, LICENCE_PUBLIC_KEY);

        if (!isSignatureValid) {

            CACHED_LICENSE_INFO = { state: 'COMPROMISED' };
            return CACHED_LICENSE_INFO;
        }

        // Parse Dates - strictly using UTC to avoid local timezone drift
        // Assuming validityTillStr is in format YYYY-MM-DD
        const validityTill = new Date(`${validityTillStr}T23:59:59Z`);
        const gracePeriodDays = parseInt(graceDaysStr, 10);
        const activeUsers = parseInt(activeUsersStr, 10);

        const graceEnd = new Date(validityTill.getTime());
        graceEnd.setUTCDate(graceEnd.getUTCDate() + gracePeriodDays);

        const now = new Date();

        let state: LicenseState = 'VALID';

        if (now > graceEnd) {
            state = 'LOCKED';
        } else if (now > validityTill && now <= graceEnd) {
            state = 'GRACE';
        } else {
            state = 'VALID';
        }

        CACHED_LICENSE_INFO = {
            state,
            validityTill,
            graceEnd,
            gracePeriodDays,
            activeUsers,
            rawPayload,
            signatureVerified: true
        };

        // Log state transition if we had a previous state (requires audit log implementation later)
        // For now, console log


        return CACHED_LICENSE_INFO;

    } catch (error) {

        // If the DB is unreachable, we don't crash, we return the last known state if available
        // If no state is known, we must assume UNACTIVATED to be safe and let middleware route to /activation
        if (CACHED_LICENSE_INFO) {

            return CACHED_LICENSE_INFO;
        }
        return { state: 'UNACTIVATED' };
    }
}

/**
 * Validates if a new user can be created or an existing user activated based on the license limits.
 */
export async function validateUserLimit(): Promise<boolean> {
    const info = await getLicenseState();

    if (info.state === 'UNACTIVATED' || info.state === 'COMPROMISED') {
        throw new Error('System is in an unactivated or compromised state.');
    }

    if (!info.activeUsers) {
        throw new Error('License user limit is missing.');
    }

    const currentActiveUsers = await prisma.user.count({
        where: {
            status: 'ACTIVE'
        }
    });

    if (currentActiveUsers >= info.activeUsers) {
        return false;
    }

    return true;
}

/**
 * Clear the cache explicitly, used after activation/renewal
 */
export function invalidateLicenseCache() {
    CACHED_LICENSE_INFO = null;
}
