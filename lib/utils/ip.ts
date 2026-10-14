import { headers } from 'next/headers';
import { isIP } from 'net';

/**
 * Validates whether a given string is a valid IPv4 or IPv6 address.
 */
function isValidIp(ip: string): boolean {
    if (!ip) return false;
    const cleanIp = ip.trim();
    return isIP(cleanIp) !== 0;
}

/**
 * Resolves the real client IP address from request headers or Request object.
 * Validates IP format to prevent IP spoofing via malformed or injected x-forwarded-for headers.
 * Prioritizes trusted edge headers (x-real-ip, cf-connecting-ip) over x-forwarded-for.
 */
export function extractClientIp(reqOrHeaders?: Request | Headers | { get(name: string): string | null } | null): string {
    if (!reqOrHeaders) return 'unknown';

    const getHeader = (name: string): string | null => {
        if ('headers' in reqOrHeaders && reqOrHeaders.headers && typeof (reqOrHeaders.headers as any).get === 'function') {
            return (reqOrHeaders.headers as any).get(name);
        }
        if (typeof (reqOrHeaders as any).get === 'function') {
            return (reqOrHeaders as any).get(name);
        }
        return null;
    };

    // 1. Check reverse-proxy direct headers (x-real-ip, cf-connecting-ip)
    const realIp = getHeader('x-real-ip') || getHeader('cf-connecting-ip');
    if (realIp && isValidIp(realIp)) {
        return realIp.trim();
    }

    // 2. Fallback to x-forwarded-for (validate candidate IPs)
    const forwardedFor = getHeader('x-forwarded-for');
    if (forwardedFor) {
        const ips = forwardedFor.split(',').map(s => s.trim());
        for (const ip of ips) {
            if (isValidIp(ip)) {
                return ip;
            }
        }
    }

    return 'unknown';
}

/**
 * Server component / Server Action helper to resolve the client IP from next/headers.
 */
export async function getClientIp(): Promise<string> {
    try {
        const headersList = await headers();
        return extractClientIp(headersList);
    } catch {
        return 'unknown';
    }
}

