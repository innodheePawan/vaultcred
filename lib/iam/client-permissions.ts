import { FeaturePermission } from './permissions';

export function normalizeFeatureKey(key: string): string {
    return key.replace(/^FEATURE:/i, '').toUpperCase();
}

/**
 * Executes an O(1) level hierarchy check for UI fragments based on frontend Session context.
 */
export function canView(rbac: any, feature: string): boolean {
    if (!rbac) return false;
    const key = normalizeFeatureKey(feature);
    
    if (process.env.NODE_ENV === 'development') {
        if (rbac.featurePermissions[key] === undefined) {
            console.warn(`[RBAC Config Warn]: Missing explicit mapping for feature '${key}'`);
        }
    }

    const permission: FeaturePermission = rbac.featurePermissions[key] ?? 'NO_ACCESS';
    return ['ALL', 'ALL_SCOPED', 'VIEW', 'VIEW_MASKED'].includes(permission);
}

export function canCreate(rbac: any, feature: string): boolean {
    if (!rbac) return false;
    const key = normalizeFeatureKey(feature);
    const permission: FeaturePermission = rbac.featurePermissions[key] ?? 'NO_ACCESS';
    return ['ALL', 'ALL_SCOPED'].includes(permission);
}

export function canEdit(rbac: any, feature: string): boolean {
    if (!rbac) return false;
    const key = normalizeFeatureKey(feature);
    const permission: FeaturePermission = rbac.featurePermissions[key] ?? 'NO_ACCESS';
    return ['ALL', 'ALL_SCOPED'].includes(permission);
}

export function canDelete(rbac: any, feature: string): boolean {
    if (!rbac) return false;
    const key = normalizeFeatureKey(feature);
    const permission: FeaturePermission = rbac.featurePermissions[key] ?? 'NO_ACCESS';
    return ['ALL', 'ALL_SCOPED'].includes(permission);
}

export function canUnmask(rbac: any, feature: string): boolean {
    if (!rbac) return false;
    const key = normalizeFeatureKey(feature);
    // Note: VIEW_MASKED explicitly does not allow unmask
    const permission: FeaturePermission = rbac.featurePermissions[key] ?? 'NO_ACCESS';
    return ['ALL', 'ALL_SCOPED', 'VIEW'].includes(permission);
}
