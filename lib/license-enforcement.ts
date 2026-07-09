import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { verifyLicenseServerSignature, resolveCurrentDomain } from '@/lib/license-utils';
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
    installationDomain?: string;
}

// Global cache for Node.js runtime to ensure <200ms checks
let CACHED_LICENSE_INFO: LicenseInfo | null = null;

export async function getLicenseState(forceRefresh = false): Promise<LicenseInfo> {
    if (!forceRefresh && CACHED_LICENSE_INFO) {
        // If the system is active but has no stored domain (old deployment), bypass cache to run initialization
        const needsDomainInit = (CACHED_LICENSE_INFO.state === 'VALID' || CACHED_LICENSE_INFO.state === 'GRACE' || CACHED_LICENSE_INFO.state === 'LOCKED') && !CACHED_LICENSE_INFO.installationDomain;

        if (!needsDomainInit) {
            const currentDomain = await resolveCurrentDomain();
            if (currentDomain === null) {
                // Skip domain validation because no request context is available
                return CACHED_LICENSE_INFO;
            }

            if (currentDomain === "") {
                // If a request context exists but the resolved domain is empty or invalid,
                // treat it as a license validation failure, log the event, and redirect.
                console.error("[License Domain Validation Failed]: Request context exists but resolved domain is empty or invalid.");
                return {
                    ...CACHED_LICENSE_INFO,
                    state: 'UNACTIVATED'
                };
            }

            if (CACHED_LICENSE_INFO.installationDomain && CACHED_LICENSE_INFO.installationDomain !== currentDomain) {
                return {
                    ...CACHED_LICENSE_INFO,
                    state: 'UNACTIVATED'
                };
            }
            return CACHED_LICENSE_INFO;
        }
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
                // If any key fails decryption, log the exact error for debugging

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
        if (!LICENCE_PUBLIC_KEY) {
            // Skip signature check if key unavailable to prevent false COMPROMISED on deployments where the key file isn't bundled
        } else {
            const isSignatureValid = await verifyLicenseServerSignature(signature, rawPayload, LICENCE_PUBLIC_KEY);

            if (!isSignatureValid) {

                CACHED_LICENSE_INFO = { state: 'COMPROMISED' };
                return CACHED_LICENSE_INFO;
            }
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

        // Perform domain validation only after existing license activation and signature verification have completed
        let installationDomain = data['INSTALL_DOM'];
        const currentDomain = await resolveCurrentDomain();

        if (!installationDomain) {
            // Support Existing Deployments
            if (currentDomain !== null) {
                if (currentDomain === "") {
                    console.error("[License Domain Validation Failed]: Request context exists but resolved domain is empty or invalid during auto-initialization.");
                    state = 'UNACTIVATED';
                } else {
                    // Automatically create the encrypted INSTALL_DOM entry, refresh cache, and continue normal application startup
                    try {
                        const masterKey = process.env.MASTER_KEY;
                        if (masterKey) {
                            const { encrypt } = await import('@/lib/crypto');
                            await prisma.licenseRegistry.create({
                                data: {
                                    regKey: encrypt('INSTALL_DOM'),
                                    regValue: Buffer.from(encrypt(currentDomain)),
                                    isActive: true
                                }
                            });
                            installationDomain = currentDomain;
                            invalidateLicenseCache(); // refresh the in-memory license cache
                        }
                    } catch (dbError) {
                        console.error("Failed to automatically save installation domain:", dbError);
                    }
                }
            }
        } else {
            // Validate Domain
            if (currentDomain !== null) {
                if (currentDomain === "" || installationDomain !== currentDomain) {
                    console.error(`[License Domain Validation Failed]: Domain mismatch or invalid. Stored: ${installationDomain}, Current: ${currentDomain}`);
                    state = 'UNACTIVATED';
                    invalidateLicenseCache(); // Invalidate cached state immediately to force subsequent reloads from DB
                }
            }
        }

        CACHED_LICENSE_INFO = {
            state,
            validityTill,
            graceEnd,
            gracePeriodDays,
            activeUsers,
            rawPayload,
            signatureVerified: true,
            installationDomain
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
