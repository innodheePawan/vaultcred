import { prisma } from '@/lib/prisma';

export type Permission = 'READ' | 'EDIT' | 'CREATE' | 'DOWNLOAD' | 'ADMIN' | 'AUDIT';

export interface UserAccessContext {
    userId: string;
    role: string;
    allowedCategories: string[];
    allowedEnvironments: string[];
    // Map of Category -> Environment -> PermissionSet
    permissions: Record<string, Record<string, Set<Permission>>>;
    allowedCredentialIds: string[];
    isExternal: boolean;
}

/**
 * Fetches and aggregates all permissions for a user based on their User Groups and Access Groups.
 */
export async function getUserAccessContext(userId: string): Promise<UserAccessContext> {
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

    if (!user) {
        return {
            userId: userId,
            role: 'GUEST',
            allowedCategories: [],
            allowedEnvironments: [],
            permissions: {},
            allowedCredentialIds: [],
            isExternal: false
        };
    }

    if (user.role === 'ADMIN') {
        return {
            userId: user.id,
            role: 'ADMIN',
            allowedCategories: ['*'],
            allowedEnvironments: ['*'],
            permissions: {}, // Admins bypass detailed checks
            allowedCredentialIds: ['*'], // Admin sees all
            isExternal: false
        };
    }

    const context: UserAccessContext = {
        userId: user.id,
        role: user.role,
        allowedCategories: [],
        allowedEnvironments: [],
        permissions: {},
        allowedCredentialIds: (user as any).allowedCredentialIds ? (user as any).allowedCredentialIds.split(',').filter(Boolean) : [],
        isExternal: (user as any).isExternal || false
    };

    const isExternal = (user as any).isExternal;
    const externalType = (user as any).externalAccessType; // VIEW, CREATE



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
                let scopeCats = groupMapping.scopedCategories ? groupMapping.scopedCategories.split(',').filter(Boolean) : (isExternal ? [] : ['*']);
                let scopeEnvs = groupMapping.scopedEnvironments ? groupMapping.scopedEnvironments.split(',').filter(Boolean) : (isExternal ? [] : ['*']);

                // SPECIAL OVERRIDE for External: 
                // If they have a Group but NO direct scopes (Category/Env), we treat them as having '*' scope 
                // if they are NOT strictly scoped (legacy or wide access).
                if (isExternal && scopeCats.length === 0 && scopeEnvs.length === 0) {
                    scopeCats = ['*'];
                    scopeEnvs = ['*'];
                }

                const intersect = (pol: string, scopes: string[]) => {
                    if (scopes.includes('*')) return pol;
                    if (pol === '*') return scopes;
                    if (scopes.includes(pol)) return pol;
                    return null;
                };

                const effectiveCat = intersect(policyCat, scopeCats);
                const effectiveEnv = intersect(policyEnv, scopeEnvs);

                if (effectiveCat && effectiveEnv) {
                    const finalCats = Array.isArray(effectiveCat) ? effectiveCat : [effectiveCat];
                    const finalEnvs = Array.isArray(effectiveEnv) ? effectiveEnv : [effectiveEnv];

                    for (const c of finalCats) {
                        for (const e of finalEnvs) {
                            let permToGrant = policy.permission;

                            // Enforce External Type Limits
                            if (isExternal) {
                                if (externalType === 'VIEW' && !['READ', 'DOWNLOAD'].includes(permToGrant)) {
                                    continue;
                                }
                                if (externalType === 'CREATE' && !['READ', 'DOWNLOAD', 'CREATE'].includes(permToGrant)) {
                                    continue;
                                }
                            }

                            addPermission(c, e, permToGrant);

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

    // SPECIAL: Inject direct Creation Scopes for External Vendors (if no matching group policies)
    if (isExternal && externalType === 'CREATE') {
        const directCats = (user as any).allowedCategories ? (user as any).allowedCategories.split(',').filter(Boolean) : [];
        const directEnvs = (user as any).allowedEnvironments ? (user as any).allowedEnvironments.split(',').filter(Boolean) : [];



        for (const cat of directCats) {
            for (const env of directEnvs) {
                // External creates get 'CREATE' and 'READ' on their scope
                addPermission(cat, env, 'CREATE');
                addPermission(cat, env, 'READ');

                if (!context.allowedCategories.includes(cat)) context.allowedCategories.push(cat);
                if (!context.allowedEnvironments.includes(env)) context.allowedEnvironments.push(env);
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
    requiredPermission: Permission,
    credentialId?: string
): boolean {
    if (context.role === 'ADMIN') return true;

    // Direct Credential Check (Granular Sharing)
    if (credentialId && context.allowedCredentialIds.includes(credentialId)) {
        // External vendors: STRICTLY READ-ONLY for shared items.
        // Even if their "Access Type" is CREATE, they cannot edit/delete shared specific items.
        // They can only edit/delete items they created (checked via isOwner in caller).
        if (context.isExternal) {
            // Allow VIEW, READ, DOWNLOAD. Deny EDIT, DELETE, CREATE (on this specific item logic).
            if (['READ', 'DOWNLOAD'].includes(requiredPermission)) {
                return true;
            }
            return false;
        }

        // Internal users: Implicitly allow access if ID is in allowed list.
        // TODO: Refine this for Internal if we want granular ID assignment to imply specific permissions.
        // For now, assuming granular assignment implies generalized access.
        return true;
    }

    const cat = targetCategory || 'Uncategorized';
    const env = targetEnvironment || 'General';

    const hasPerm = (set: Set<Permission> | undefined) => {
        if (!set) return false;
        return set.has(requiredPermission) || set.has('ADMIN');
    };

    if (context.permissions[cat]?.[env] && hasPerm(context.permissions[cat][env])) return true;
    if (context.permissions[cat]?.['*'] && hasPerm(context.permissions[cat]['*'])) return true;
    if (context.permissions['*']?.[env] && hasPerm(context.permissions['*'][env])) return true;
    if (context.permissions['*']?.['*'] && hasPerm(context.permissions['*']['*'])) return true;

    return false;
}
