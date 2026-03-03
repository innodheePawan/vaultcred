import fs from 'fs';
import path from 'path';

/**
 * Reads the PGP public key from the local file system.
 * The key is stored in a static file to avoid GitHub secret scanning flags (GH013).
 * 
 * Uses multiple path resolution strategies to work across:
 *  - Local dev (process.cwd())
 *  - AWS Lambda / Amplify (__dirname relative)
 *  - Vercel serverless (process.cwd())
 */
function getLicencePublicKey(): string {
    // Try multiple paths for cross-environment compatibility
    const candidates = [
        path.join(process.cwd(), 'keys', 'license-public.asc'),
        path.resolve(__dirname, '..', 'keys', 'license-public.asc'),
        path.resolve(__dirname, '..', '..', 'keys', 'license-public.asc'),
        path.resolve(__dirname, '..', '..', '..', 'keys', 'license-public.asc'),
    ];

    for (const keyPath of candidates) {
        try {
            if (fs.existsSync(keyPath)) {
                const content = fs.readFileSync(keyPath, 'utf8').trim();
                if (content.length > 0) {
                    return content;
                }
            }
        } catch {
            // Try next path
        }
    }

    // Fallback: use environment variable if file is not found
    if (process.env.LICENCE_PUBLIC_KEY) {
        return process.env.LICENCE_PUBLIC_KEY.replace(/\\n/g, '\n').trim();
    }

    return '';
}

export const LICENCE_PUBLIC_KEY = getLicencePublicKey();
