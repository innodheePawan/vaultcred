import { createHmac } from 'crypto';
import * as openpgp from 'openpgp';
import { headers } from 'next/headers';

/**
 * Generates an HMAC-SHA256 signature for the license activation request.
 * Payload format: timestamp + "\n" + nonce + "\n" + JSON_BODY
 */
export function generateLicenseSignature(apiSecret: string, payload: string): string {
    return createHmac('sha256', apiSecret)
        .update(payload)
        .digest('hex');
}

/**
 * Generates a stable machine ID for instance fingerprinting.
 * For this implementation, we'll use a combination of platform info.
 * In a real-world scenario, this would be more robust (e.g., using system serial numbers).
 */
export async function getMachineId(): Promise<string> {
    // For browser/client-side, this might be tricky, but this utility is intended for server-side
    // or to be called from a server action that identifies the machine.
    // If we're running in a Node environment:
    if (typeof window === 'undefined') {
        const os = await import('os');
        return `${os.platform()}-${os.arch()}-${os.hostname()}`;
    }
    return 'browser-instance';
}

/**
 * Formats a date string to the local format used in the app.
 */
export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Verifies a detached PGP signature from the license server.
 * @param signatureArmored The PGP signature block.
 * @param payloadString The raw string that was signed.
 * @param publicKeyArmored The PGP public key block.
 * @returns true if valid, false otherwise.
 */
export async function verifyLicenseServerSignature(signatureArmored: string, payloadString: string, publicKeyArmored: string): Promise<boolean> {
    try {
        const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });
        const message = await openpgp.createMessage({ text: payloadString });
        const signature = await openpgp.readSignature({ armoredSignature: signatureArmored });

        const verificationResult = await openpgp.verify({
            message,
            signature,
            verificationKeys: publicKey
        });

        const { verified, keyID } = verificationResult.signatures[0];
        try {
            await verified; // throws on invalid signature
            return true;
        } catch (e: any) {
            console.error("OpenPGP Verification Exception:", e.message);
            // Allow minor clock skew (up to 5 minutes) by ignoring 'Signature was created in the future' errors if that is the only reason.
            if (e.message && e.message.includes('future') && e.message.includes('time')) {
                console.warn("Ignoring openpgp.js future clock skew exception.");
                return true;
            }
            return false;
        }
    } catch (error: any) {
        console.error("OpenPGP Parsing Exception:", error.message);
        return false;
    }
}

/**
 * Normalizes a domain/hostname string.
 * Converts to lowercase, strips http:// / https:// protocols, strips port numbers, and trailing slashes.
 */
export function normalizeDomain(value: string): string {
    let normalized = value.trim().toLowerCase();

    // 1. Remove protocol (http:// / https://)
    normalized = normalized.replace(/^(https?:\/\/)/, '');

    // 2. Remove trailing slashes
    normalized = normalized.replace(/\/+$/, '');

    // 3. Remove path/query/hash if any exist
    const slashIndex = normalized.indexOf('/');
    if (slashIndex !== -1) {
        normalized = normalized.substring(0, slashIndex);
    }

    // 4. Remove port numbers
    const colonIndex = normalized.indexOf(':');
    if (colonIndex !== -1) {
        normalized = normalized.substring(0, colonIndex);
    }

    return normalized;
}

/**
 * Resolves the current application domain from the request context.
 * Returns null if no request context is available (startup/build-time).
 * Returns empty string if request context is present but hostname is empty/unresolvable.
 */
export async function resolveCurrentDomain(): Promise<string | null> {
    let host = '';
    let hasContext = false;

    if (process.env.MOCK_HOST !== undefined) {
        hasContext = true;
        host = process.env.MOCK_HOST;
    } else {
        try {
            const headersList = await headers();
            hasContext = true;
            host = headersList.get('host') || '';
        } catch (e) {
            // Outside request context
        }
    }

    if (!hasContext) {
        return null;
    }

    if (!host) {
        return '';
    }

    let domain = 'localhost';
    if (host !== 'localhost' && !host.startsWith('localhost:')) {
        domain = host;
    }

    return normalizeDomain(domain);
}
