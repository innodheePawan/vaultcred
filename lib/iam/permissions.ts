import { prisma } from '@/lib/prisma';

export type Permission = 'READ' | 'EDIT' | 'CREATE' | 'DOWNLOAD' | 'ADMIN' | 'AUDIT';

export type UserAccessContext = {
    isAdmin: boolean;
    allowedCategories: string[]; // '*' for all
    allowedEnvironments: string[]; // '*' for all
    // Map of Category -> Environment -> PermissionSet
    permissions: Record<string, Record<string, Set<Permission>>>;
};

/**
 * Fetches and aggregates all permissions for a user based on their User Groups and Access Groups.
 * Returns a context object optimized for checking access.
 */
export async function getUserAccessContext(userId: string): Promise<UserAccessContext> {
    // Setup Admin now exists in DB, no mock handling needed.

    let user = null;
    try {
        user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                userGroups: {
                    include: {
                        group: {
                            include: {
                                access: {
                                    include: {
                                        accessGroup: {
                                            include: {
                                                policies: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Failed to fetch user permissions (DB Error):", error);
        // Fallback: Non-admin, empty permissions. Allows UI to render (safety net)
        return {
            isAdmin: false,
            allowedCategories: [],
            allowedEnvironments: [],
            permissions: {}
        };
    }

    if (!user) {
        console.warn(`[Permissions] User ${userId} not found in DB. Returning guest context.`);
        return {
            isAdmin: false,
            allowedCategories: [],
            allowedEnvironments: [],
            permissions: {}
        };
    }

    if (user.role === 'ADMIN') {
        return {
            isAdmin: true,
            allowedCategories: ['*'],
            allowedEnvironments: ['*'],
            permissions: {} // Admins bypass detailed checks
        };
    }

    const context: UserAccessContext = {
        isAdmin: false,
        allowedCategories: [],
        allowedEnvironments: [],
        permissions: {}
    };

    // Helper: Add permission to the map
    const addPermission = (category: string, env: string, perm: string) => {
        if (!context.permissions[category]) context.permissions[category] = {};
        if (!context.permissions[category][env]) context.permissions[category][env] = new Set();
        context.permissions[category][env].add(perm as Permission);
    };

    // Iterate through all groups and policies
    for (const groupMapping of user.userGroups) {
        for (const access of groupMapping.group.access) {
            for (const policy of access.accessGroup.policies) {
                const policyCat = policy.category || '*';
                const policyEnv = policy.environment || '*';

                // Get Scopes from Mapping
                const scopeCats = groupMapping.scopedCategories ? groupMapping.scopedCategories.split(',') : ['*'];
                const scopeEnvs = groupMapping.scopedEnvironments ? groupMapping.scopedEnvironments.split(',') : ['*'];

                // Logic: Intersection of Policy & Scope.
                // If Policy is ALL ('*'), effective access is the SCOPE.
                // If Policy is Specific (e.g. 'App'), and Scope is ALL ('*'), effective is 'App'.
                // If Policy is Specific ('App'), and Scope is Specific ('App'), effective is 'App'.
                // If Policy is 'App' and Scope is 'Infra', NO MATCH -> No Permission granted.

                // Helper to check intersection
                const intersect = (pol: string, scopes: string[]) => {
                    if (scopes.includes('*')) return pol; // Scope allows all, so Policy dictates limit.
                    if (pol === '*') return scopes; // Policy allows all, so Scopes dictate limit.
                    if (scopes.includes(pol)) return pol; // Overlap found.
                    return null; // No overlap.
                };

                const effectiveCat = intersect(policyCat, scopeCats);
                const effectiveEnv = intersect(policyEnv, scopeEnvs);

                if (effectiveCat && effectiveEnv) {
                    const finalCats = Array.isArray(effectiveCat) ? effectiveCat : [effectiveCat];
                    const finalEnvs = Array.isArray(effectiveEnv) ? effectiveEnv : [effectiveEnv];

                    for (const c of finalCats) {
                        for (const e of finalEnvs) {
                            addPermission(c, e, policy.permission);

                            // Add to allowed lists (Used for UI filters/dropdowns?)
                            if (c === '*' && !context.allowedCategories.includes('*')) context.allowedCategories.push('*');
                            else if (c !== '*' && !context.allowedCategories.includes(c)) context.allowedCategories.push(c);

                            if (e === '*' && !context.allowedEnvironments.includes('*')) context.allowedEnvironments.push('*');
                            else if (e !== '*' && !context.allowedEnvironments.includes(e)) context.allowedEnvironments.push(e);
                        }
                    }
                }
            }
        }
    }

    return context;
}

/**
 * Checks if a user has the specific permission for a target resource.
 */
export function canAccess(
    context: UserAccessContext,
    targetCategory: string | null,
    targetEnvironment: string | null,
    requiredPermission: Permission
): boolean {
    if (context.isAdmin) return true;

    // Use default if null
    const cat = targetCategory || 'Uncategorized';
    const env = targetEnvironment || 'General';

    // Helper to check precise permission in a set
    const hasPerm = (set: Set<Permission> | undefined) => {
        if (!set) return false;
        return set.has(requiredPermission) || set.has('ADMIN');
    };

    // Check specific specific
    if (context.permissions[cat]?.[env] && hasPerm(context.permissions[cat][env])) return true;

    // Check specific category, ALL env
    if (context.permissions[cat]?.['*'] && hasPerm(context.permissions[cat]['*'])) return true;

    // Check ALL category, specific env
    if (context.permissions['*']?.[env] && hasPerm(context.permissions['*'][env])) return true;

    // Check ALL category, ALL env
    if (context.permissions['*']?.['*'] && hasPerm(context.permissions['*']['*'])) return true;

    return false;
}
