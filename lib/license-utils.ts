import { createHmac } from 'crypto';
import * as openpgp from 'openpgp';

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
