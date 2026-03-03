import fs from 'fs';
import path from 'path';

/**
 * Reads the PGP public key from the local file system.
 * The key is stored in a static file to avoid GitHub secret scanning flags (GH013).
 */
function getLicencePublicKey(): string {
    try {
        const keyPath = path.join(process.cwd(), 'keys', 'license-public.asc');

        // Ensure the file exists before attempting to read
        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8').trim();
        }

        console.warn(`[Warning] License public key not found at ${keyPath}. License verification will fail.`);
        return '';
    } catch (error) {
        console.error('[Error] Failed to read license public key:', error);
        return '';
    }
}

export const LICENCE_PUBLIC_KEY = getLicencePublicKey();
