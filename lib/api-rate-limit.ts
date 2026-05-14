import { prisma } from '@/lib/prisma';
import { rateLimit } from './rate-limit';
import { getSecurityState, recordFailure } from './security';

interface ApiSettingsCache {
    settings: {
        allowApiAccess: boolean;
        exposeRateLimitHeaders: boolean;
        apiLimitAuthToken: number;
        apiLimitCredentials: number;
        apiLimitCredentialReveal: number;
        apiLimitCredentialFile: number;
    } | null;
    expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

const globalForApiSettings = global as unknown as { apiSettingsCache: ApiSettingsCache | null };

async function getCachedApiSettings() {
    const now = Date.now();
    
    if (globalForApiSettings.apiSettingsCache && globalForApiSettings.apiSettingsCache.expiresAt > now) {
        return globalForApiSettings.apiSettingsCache.settings;
    }

    try {
        const dbSettings = await prisma.systemSettings.findFirst({
            select: {
                allowApiAccess: true,
                exposeRateLimitHeaders: true,
                apiLimitAuthToken: true,
                apiLimitCredentials: true,
                apiLimitCredentialReveal: true,
                apiLimitCredentialFile: true,
            }
        });

        globalForApiSettings.apiSettingsCache = {
            settings: dbSettings,
            expiresAt: now + CACHE_TTL_MS
        };

        return dbSettings;
    } catch (e) {
        // Fallback or previously cached
        if (globalForApiSettings.apiSettingsCache?.settings) {
            return globalForApiSettings.apiSettingsCache.settings;
        }
        return null;
    }
}



export async function rateLimitApi(
    clientIdOrIp: string, 
    ipAddress: string,
    endpointType: 'auth_token' | 'credentials' | 'credential_reveal' | 'credential_file',
) {
    const settings = await getCachedApiSettings();
    
    // 1. Blocked IP Check (Fastest)
    const securityState = await getSecurityState(null, ipAddress);
    if (securityState.isIpPermanentBlocked || securityState.isIpBlocked) {
        return { allowed: false, retryAfterMs: 0, remaining: 0, disabled: false, exposeHeaders: false, isIpBlocked: true };
    }

    // 2. Global Access Check
    if (settings && !settings.allowApiAccess) {
        return { allowed: false, retryAfterMs: 0, remaining: 0, disabled: true, exposeHeaders: false, isIpBlocked: false };
    }

    // Determine specific limit
    let limit = 50; // Default fallback
    if (settings) {
        switch (endpointType) {
            case 'auth_token': limit = settings.apiLimitAuthToken; break;
            case 'credentials': limit = settings.apiLimitCredentials; break;
            case 'credential_reveal': limit = settings.apiLimitCredentialReveal; break;
            case 'credential_file': limit = settings.apiLimitCredentialFile; break;
        }
    } else {
        // Hardcoded fallbacks if DB fails
        switch (endpointType) {
            case 'auth_token': limit = 10; break;
            case 'credentials': limit = 50; break;
            case 'credential_reveal': limit = 200; break;
            case 'credential_file': limit = 30; break;
        }
    }

    const windowMs = 60 * 1000; // 1 minute window for API rate limits
    const key = `api_limit:${endpointType}:${clientIdOrIp}`;
    
    const result = rateLimit(key, limit, windowMs);
    
    // If not allowed, record a failure for the IP to contribute to abuse escalation
    if (!result.allowed) {
        await recordFailure(null, ipAddress);
    }
    
    return {
        ...result,
        limit,
        disabled: false,
        exposeHeaders: settings?.exposeRateLimitHeaders ?? false,
        isIpBlocked: false
    };
}
