'use server';

import { headers } from 'next/headers';

/**
 * Resolves the real client IP address from request headers.
 * Prioritizes x-real-ip (set by reverse proxies like Nginx/AWS ALB)
 * over x-forwarded-for (which can be spoofed by clients).
 */
export async function getClientIp(): Promise<string> {
    const headersList = await headers();
    return headersList.get('x-real-ip')
        || headersList.get('x-forwarded-for')?.split(',')[0].trim()
        || 'unknown';
}
