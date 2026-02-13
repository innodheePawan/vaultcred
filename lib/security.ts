import { prisma } from './prisma';

// Tiered Logic Constants
const USER_FAILURE_LIMIT_CAPTCHA = 3;
const USER_FAILURE_WINDOW_CAPTCHA = 10 * 60 * 1000; // 10 mins

const USER_FAILURE_LIMIT_LOCK = 5;
const USER_FAILURE_WINDOW_LOCK = 15 * 60 * 1000; // 15 mins
const USER_LOCKOUT_DURATION = 30 * 60 * 1000; // 30 mins

const IP_FAILURE_LIMIT_BLOCK = 20;
const IP_FAILURE_WINDOW_BLOCK = 30 * 60 * 1000; // 30 mins
const IP_BLOCK_DURATION = 4 * 60 * 60 * 1000; // 4 hours

const IP_BLOCKS_PERMANENT_LIMIT = 5;
const IP_BLOCKS_PERMANENT_WINDOW = 4 * 24 * 60 * 60 * 1000; // 4 days
const IP_SECOND_BLOCK_24H_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export type SecurityState = {
    isIpBlocked: boolean;
    isIpPermanentBlocked: boolean;
    isUserLocked: boolean;
    requiresCaptcha: boolean;
    lockExpiresAt?: Date;
    blockedUntil?: Date;
    remainingAttemptsUser?: number;
};

/**
 * Checks the security state of a user (email) and IP address.
 */
export async function getSecurityState(email: string | null, ip: string): Promise<SecurityState> {
    const state: SecurityState = {
        isIpBlocked: false,
        isIpPermanentBlocked: false,
        isUserLocked: false,
        requiresCaptcha: false,
    };

    // 1. Check IP Security using Raw Query (to avoid crash if prisma client is stale)
    try {
        const ipSecs: any[] = await prisma.$queryRaw`SELECT * FROM security_ip_blocks WHERE ip_address = ${ip} LIMIT 1`;
        const ipSec = ipSecs[0];

        if (ipSec) {
            if (ipSec.is_permanent_block || ipSec.isPermanentBlock) {
                state.isIpPermanentBlocked = true;
            } else if (ipSec.blocked_until && new Date(ipSec.blocked_until) > new Date()) {
                state.isIpBlocked = true;
                state.blockedUntil = new Date(ipSec.blocked_until);
            }
        }
    } catch (e) {
        console.error('[Security] Error checking IP state:', e);
    }

    // 2. Check User Security (if email provided)
    if (email) {
        try {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    // @ts-ignore
                    failedAttempts: true,
                    // @ts-ignore
                    lockExpiresAt: true,
                    // @ts-ignore
                    requiresCaptcha: true
                }
            });

            if (user) {
                // @ts-ignore
                state.requiresCaptcha = user.requiresCaptcha || false;
                // @ts-ignore
                if (user.lockExpiresAt && new Date(user.lockExpiresAt) > new Date()) {
                    state.isUserLocked = true;
                    // @ts-ignore
                    state.lockExpiresAt = new Date(user.lockExpiresAt);
                }
            }
        } catch (e) {
            console.error('[Security] Error checking User state:', e);
        }
    }

    return state;
}


/**
 * Records a failed attempt for a user and IP.
 * Applies tier logic for throttling, lockout, and blocking.
 */
export async function recordFailure(email: string | null, ip: string) {
    const now = new Date();

    // 1. Update IP Security using Raw Queries
    try {
        const ipSecs: any[] = await prisma.$queryRaw`SELECT * FROM security_ip_blocks WHERE ip_address = ${ip} LIMIT 1`;
        let ipSec = ipSecs[0];

        if (!ipSec) {
            await prisma.$executeRaw`INSERT INTO security_ip_blocks (ip_security_id, ip_address, failed_attempts, updated_at) VALUES (${Math.random().toString(36).substring(2)}, ${ip}, 1, ${now})`;
        } else {
            const newAttempts = (ipSec.failed_attempts || ipSec.failedAttempts || 0) + 1;
            let blockedUntil = ipSec.blocked_until || ipSec.blockedUntil;
            let blockCount24h = ipSec.block_count_24h || ipSec.blockCount24h || 0;
            let totalBlockCount = ipSec.total_block_count || ipSec.totalBlockCount || 0;
            let isPermanentBlock = ipSec.is_permanent_block || ipSec.isPermanentBlock || false;

            const lastBlockAt = ipSec.last_block_at || ipSec.lastBlockAt;
            // Reset 24h block count if last block was > 24h ago
            if (lastBlockAt && (now.getTime() - new Date(lastBlockAt).getTime() > 24 * 60 * 60 * 1000)) {
                blockCount24h = 0;
            }

            // IP Level 1/2 Blocking
            if (newAttempts >= IP_FAILURE_LIMIT_BLOCK) {
                blockCount24h++;
                totalBlockCount++;
                const duration = blockCount24h >= 2 ? IP_SECOND_BLOCK_24H_DURATION : IP_BLOCK_DURATION;
                blockedUntil = new Date(now.getTime() + duration);

                if (totalBlockCount >= IP_BLOCKS_PERMANENT_LIMIT) {
                    isPermanentBlock = true;
                }
            }

            await prisma.$executeRaw`UPDATE security_ip_blocks SET 
                failed_attempts = ${blockedUntil && blockedUntil > now ? 0 : newAttempts},
                blocked_until = ${blockedUntil ? new Date(blockedUntil) : null},
                block_count_24h = ${blockCount24h},
                total_block_count = ${totalBlockCount},
                last_block_at = ${blockedUntil && blockedUntil > now ? now : (lastBlockAt ? new Date(lastBlockAt) : null)},
                is_permanent_block = ${isPermanentBlock ? 1 : 0},
                updated_at = ${now}
                WHERE ip_address = ${ip}`;
        }
    } catch (e) {
        console.error('[Security] Error recording IP failure:', e);
    }

    // 2. Update User Security
    if (email) {
        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                // @ts-ignore
                const newAttempts = (user.failedAttempts || 0) + 1;
                // @ts-ignore
                let lockExpiresAt = user.lockExpiresAt;
                // @ts-ignore
                let requiresCaptcha = user.requiresCaptcha || false;

                if (newAttempts >= USER_FAILURE_LIMIT_LOCK) {
                    lockExpiresAt = new Date(now.getTime() + USER_LOCKOUT_DURATION);
                    requiresCaptcha = true;
                } else if (newAttempts >= USER_FAILURE_LIMIT_CAPTCHA) {
                    requiresCaptcha = true;
                }

                await prisma.user.update({
                    where: { email },
                    data: {
                        // @ts-ignore
                        failedAttempts: lockExpiresAt && lockExpiresAt > now ? 0 : newAttempts,
                        // @ts-ignore
                        lockExpiresAt,
                        // @ts-ignore
                        requiresCaptcha
                    }
                });
            }
        } catch (e) {
            console.error('[Security] Error recording User failure:', e);
        }
    }
}

/**
 * Resets failure counts on successful login or password reset.
 */
export async function recordSuccess(email: string | null, ip: string) {
    if (email) {
        try {
            await prisma.user.update({
                where: { email },
                data: {
                    // @ts-ignore
                    failedAttempts: 0,
                    // @ts-ignore
                    lockExpiresAt: null,
                    // @ts-ignore
                    requiresCaptcha: false
                }
            });
        } catch (e) {
            console.error('[Security] Error resetting User success:', e);
        }
    }

    try {
        await prisma.$executeRaw`UPDATE security_ip_blocks SET failed_attempts = 0, blocked_until = NULL WHERE ip_address = ${ip}`;
    } catch (e) {
        // IP might not have entry
    }
}

