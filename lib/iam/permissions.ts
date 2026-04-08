import { prisma } from '@/lib/prisma';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type FeaturePermission = 'ALL' | 'ALL_SCOPED' | 'VIEW' | 'VIEW_MASKED' | 'NO_ACCESS';
export type FeatureAction = 'VIEW' | 'CREATE' | 'EDIT' | 'DELETE' | 'UNMASK';

// Hierarchy: index = rank (higher index = more access)
export const PERMISSION_HIERARCHY: FeaturePermission[] = [
    'NO_ACCESS',
    'VIEW_MASKED',
    'VIEW',
    'ALL_SCOPED',
    'ALL',
];

export const VALID_ACTIONS: FeatureAction[] = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'UNMASK'];

export interface UserAccessContext {
    userId: string;
    role: string;
    featurePermissions: Record<string, FeaturePermission>; // { 'FEATURE:CREDENTIALS': 'VIEW_MASKED' }
    activeFeatures: Set<string>;                           // globally loaded active feature keys
    allowedCategories: string[];
    allowedEnvironments: string[];
    allowedCredentialIds: string[];
    isExternal: boolean;
    externalAccessType?: string;
}

// ─────────────────────────────────────────────
// GLOBAL FEATURE CACHE (version-based)
// ─────────────────────────────────────────────

let _globalActiveFeatures: Set<string> = new Set();
let _currentFeatureVersion = -1;

export async function loadGlobalActiveFeatures(version: number): Promise<Set<string>> {
    if (version !== _currentFeatureVersion) {
        const features = await prisma.iamFeature.findMany({
            where: { isActive: true },
            select: { featureKey: true },
        });
        _globalActiveFeatures = new Set(features.map((f) => f.featureKey));
        _currentFeatureVersion = version;
    }
    return _globalActiveFeatures;
}

// ─────────────────────────────────────────────
// USER ACCESS CONTEXT
// ─────────────────────────────────────────────

export async function getUserAccessContext(userId: string): Promise<UserAccessContext> {
    // 1. Load current rbacVersion for cache key
    const settings = await prisma.systemSettings.findFirst({
        select: { rbacVersion: true },
    });
    const rbacVersion = settings?.rbacVersion ?? 1;

    // 2. Load global active features (version-based cache)
    const activeFeatures = await loadGlobalActiveFeatures(rbacVersion);

    // 3. Fetch user with groups → access groups → policies
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            userGroups: {
                include: {
                    group: {
                        include: {
                            access: {
                                include: {
                                    accessGroup: {
                                        include: { policies: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    if (!user) {
        return emptyContext(userId, activeFeatures);
    }

    const isExternal = (user as any).isExternal || false;
    const externalType = (user as any).externalAccessType;

    const ctx: UserAccessContext = {
        userId: user.id,
        role: user.role,
        featurePermissions: {},
        activeFeatures,
        allowedCategories: [],
        allowedEnvironments: [],
        allowedCredentialIds: (user as any).allowedCredentialIds
            ? (user as any).allowedCredentialIds.split(',').filter(Boolean)
            : [],
        isExternal,
        externalAccessType: externalType,
    };

    // 4. Aggregate permissions across all groups (highest-wins per feature)
    const allCategories = new Set<string>();
    const allEnvironments = new Set<string>();

    for (const groupMapping of user.userGroups) {
        // Extract scope from this group mapping
        const scopeCats = groupMapping.scopedCategories
            ? groupMapping.scopedCategories.split(',').filter(Boolean)
            : ['*'];
        const scopeEnvs = groupMapping.scopedEnvironments
            ? groupMapping.scopedEnvironments.split(',').filter(Boolean)
            : ['*'];

        // Union scope across all groups
        scopeCats.forEach((c) => allCategories.add(c));
        scopeEnvs.forEach((e) => allEnvironments.add(e));

        for (const access of groupMapping.group.access) {
            for (const policy of access.accessGroup.policies) {
                // Only process FEATURE: permission tokens
                if (!policy.featureKey) continue;

                const featureKey = policy.featureKey;
                const incomingPerm = policy.permission as FeaturePermission;

                if (!PERMISSION_HIERARCHY.includes(incomingPerm)) continue;

                // Highest-wins aggregation
                const currentRank = PERMISSION_HIERARCHY.indexOf(
                    ctx.featurePermissions[featureKey] ?? 'NO_ACCESS'
                );
                const incomingRank = PERMISSION_HIERARCHY.indexOf(incomingPerm);

                if (incomingRank > currentRank) {
                    ctx.featurePermissions[featureKey] = incomingPerm;
                }
            }
        }
    }

    // Deduplicated scope UNION
    ctx.allowedCategories = Array.from(allCategories);
    ctx.allowedEnvironments = Array.from(allEnvironments);

    // 5. Default NO_ACCESS fill — every active feature gets an explicit entry
    for (const featureKey of activeFeatures) {
        if (!ctx.featurePermissions[featureKey]) {
            ctx.featurePermissions[featureKey] = 'NO_ACCESS';
        }
    }

    return ctx;
}

function emptyContext(userId: string, activeFeatures: Set<string>): UserAccessContext {
    const featurePermissions: Record<string, FeaturePermission> = {};
    for (const key of activeFeatures) {
        featurePermissions[key] = 'NO_ACCESS';
    }
    return {
        userId,
        role: 'GUEST',
        featurePermissions,
        activeFeatures,
        allowedCategories: [],
        allowedEnvironments: [],
        allowedCredentialIds: [],
        isExternal: false,
    };
}

// ─────────────────────────────────────────────
// SAFE WRAPPER (for server actions)
// ─────────────────────────────────────────────

export async function getSafeUserContext(userId: string): Promise<UserAccessContext> {
    try {
        return await getUserAccessContext(userId);
    } catch (err) {
        console.error('[RBAC] getUserAccessContext failed:', err);
        throw new Error('INTERNAL_ERROR');
    }
}

// ─────────────────────────────────────────────
// canAccess — core evaluator
// ─────────────────────────────────────────────

// Throttle map for misconfiguration logs
const _misconfigThrottle = new Map<string, number>();

function logMisconfigurationThrottled(userId: string, featureKey: string, reason: string) {
    const key = `${userId}:${featureKey}:${reason}`;
    const last = _misconfigThrottle.get(key) ?? 0;
    if (Date.now() - last > 60_000) {
        console.warn(`[RBAC_MISCONFIG] userId=${userId} feature=${featureKey} reason=${reason}`);
        _misconfigThrottle.set(key, Date.now());
    }
}

export function canAccess(
    ctx: UserAccessContext,
    featureKey: string,
    action: FeatureAction
): boolean {
    // Guard 1: Invalid action
    if (!VALID_ACTIONS.includes(action)) {
        logMisconfigurationThrottled(ctx.userId, featureKey, `Invalid action: ${action}`);
        return false;
    }

    // Guard 2: Unknown feature key (not in registry)
    if (!ctx.activeFeatures.has(featureKey)) {
        logMisconfigurationThrottled(ctx.userId, featureKey, 'Unknown or inactive featureKey');
        return false;
    }

    // Guard 3: Get resolved permission (guaranteed by default fill, but defensive)
    const permission = ctx.featurePermissions[featureKey];
    if (!permission) {
        logMisconfigurationThrottled(ctx.userId, featureKey, 'No permission entry found');
        return false;
    }

    // Guard 4: NO_ACCESS = deny everything
    if (permission === 'NO_ACCESS') return false;

    // Guard 5: ALL_SCOPED scope validation
    if (permission === 'ALL_SCOPED') {
        if (ctx.allowedCategories.length === 0 && ctx.allowedEnvironments.length === 0) {
            logMisconfigurationThrottled(
                ctx.userId,
                featureKey,
                'ALL_SCOPED with empty scope → NO_ACCESS'
            );
            return false;
        }
    }

    // Action matrix enforcement
    switch (action) {
        case 'VIEW':
            // ALL, ALL_SCOPED, VIEW, VIEW_MASKED all allow viewing
            return ['ALL', 'ALL_SCOPED', 'VIEW', 'VIEW_MASKED'].includes(permission);

        case 'CREATE':
        case 'EDIT':
        case 'DELETE':
            // Only ALL and ALL_SCOPED allow mutations
            return ['ALL', 'ALL_SCOPED'].includes(permission);

        case 'UNMASK':
            // VIEW_MASKED NEVER allows unmask — hard boundary
            // Only ALL, ALL_SCOPED, and VIEW allow unmask
            return ['ALL', 'ALL_SCOPED', 'VIEW'].includes(permission);

        default:
            return false;
    }
}

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

export function canView(ctx: UserAccessContext, featureKey: string): boolean {
    return canAccess(ctx, featureKey, 'VIEW');
}

export function canEdit(ctx: UserAccessContext, featureKey: string): boolean {
    return canAccess(ctx, featureKey, 'EDIT');
}

export function canDelete(ctx: UserAccessContext, featureKey: string): boolean {
    return canAccess(ctx, featureKey, 'DELETE');
}

export function canCreate(ctx: UserAccessContext, featureKey: string): boolean {
    return canAccess(ctx, featureKey, 'CREATE');
}

export function canUnmask(ctx: UserAccessContext, featureKey: string): boolean {
    return canAccess(ctx, featureKey, 'UNMASK');
}

// ─────────────────────────────────────────────
// SCOPE HELPERS
// ─────────────────────────────────────────────

/**
 * Returns a Prisma WHERE clause for scope filtering.
 * ONLY applies filters when permission is ALL_SCOPED.
 * ALL permission = global, no filters applied regardless of scope arrays.
 */
export function getScopeFilter(
    ctx: UserAccessContext,
    featureKey: string
): { category?: { in: string[] }; environment?: { in: string[] } } {
    const permission = ctx.featurePermissions[featureKey];
    const isScoped = permission === 'ALL_SCOPED';

    if (!isScoped) return {}; // ALL = global, no filter

    return {
        ...(ctx.allowedCategories.length > 0 && {
            category: { in: ctx.allowedCategories },
        }),
        ...(ctx.allowedEnvironments.length > 0 && {
            environment: { in: ctx.allowedEnvironments },
        }),
    };
}

// ─────────────────────────────────────────────
// STANDARD FORBIDDEN ERROR
// ─────────────────────────────────────────────

export const FORBIDDEN_RESPONSE = {
    success: false,
    error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
        status: 403,
    },
};

export const UNAUTHORIZED_RESPONSE = {
    success: false,
    error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
    },
};

export function forbiddenError(): Error {
    const err = new Error('Access denied');
    (err as any).code = 'FORBIDDEN';
    (err as any).status = 403;
    return err;
}

export function internalError(): Error {
    const err = new Error('Internal server error');
    (err as any).code = 'INTERNAL_ERROR';
    (err as any).status = 500;
    return err;
}
