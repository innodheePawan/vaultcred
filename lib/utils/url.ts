import { headers } from 'next/headers';

/**
 * Get the base URL for the application dynamically based on the request headers
 * or environment variables. This ensures redirects and links use the correct host.
 */
export async function getBaseUrl(): Promise<string> {
    // 1. Try to get from headers (works in server actions/SSR)
    try {
        const headersList = await headers();
        const host = headersList.get('host');
        const proto = headersList.get('x-forwarded-proto') || 'https';
        if (host) {
            // Handle local development (http) vs production (https)
            const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : proto;
            return `${protocol}://${host}`;
        }
    } catch (e) {
        // Fallback if headers are not available or not in request lifecycle
    }

    // 2. Use environment variables defined in deployment, fallback to localhost
    const envUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;

    if (envUrl) {
        return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    }

    return 'http://localhost:3000';
}
