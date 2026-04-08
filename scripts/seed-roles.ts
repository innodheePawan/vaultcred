import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// FEATURE REGISTRY (14 features)
// ─────────────────────────────────────────────

const FEATURES = [
    { featureKey: 'FEATURE:DASHBOARD',           module: 'DASHBOARD',        submodule: null,           description: 'Main dashboard with stats and charts' },
    { featureKey: 'FEATURE:CREDENTIALS',          module: 'CREDENTIALS',      submodule: null,           description: 'Credential management (create, view, edit, delete)' },
    { featureKey: 'FEATURE:ONE_TIME_SECRETS',     module: 'ONE_TIME_SECRETS', submodule: null,           description: 'One-time secret sharing' },
    { featureKey: 'FEATURE:ADMIN_USERS_GROUPS',   module: 'ADMIN',            submodule: 'USERS_GROUPS', description: 'Admin: user and group management' },
    { featureKey: 'FEATURE:ADMIN_API_CLIENTS',    module: 'ADMIN',            submodule: 'API_CLIENTS',  description: 'Admin: API client management' },
    { featureKey: 'FEATURE:ADMIN_BULK_IMPORT',    module: 'ADMIN',            submodule: 'BULK_IMPORT',  description: 'Admin: bulk credential import' },
    { featureKey: 'FEATURE:ACTIVITY_SYSTEM_LOG',  module: 'ACTIVITY',         submodule: 'SYSTEM_LOG',   description: 'Activity: system/audit logs' },
    { featureKey: 'FEATURE:ACTIVITY_API_LOG',     module: 'ACTIVITY',         submodule: 'API_LOG',      description: 'Activity: API access logs' },
    { featureKey: 'FEATURE:ACTIVITY_LOGIN',       module: 'ACTIVITY',         submodule: 'LOGIN',        description: 'Activity: login history' },
    { featureKey: 'FEATURE:ACTIVITY_IP_BLOCK',    module: 'ACTIVITY',         submodule: 'IP_BLOCK',     description: 'Activity: IP security blocks' },
    { featureKey: 'FEATURE:SETTINGS',             module: 'SETTINGS',         submodule: null,           description: 'System settings' },
    { featureKey: 'FEATURE:PROFILE',              module: 'PROFILE',          submodule: null,           description: 'User profile management' },
    { featureKey: 'FEATURE:SEARCH',               module: 'SEARCH',           submodule: null,           description: 'Global search' },
    { featureKey: 'FEATURE:NOTIFICATIONS',        module: 'NOTIFICATIONS',    submodule: null,           description: 'Notifications' },
] as const;

type FeatureKey = typeof FEATURES[number]['featureKey'];

const VALID_PERMISSIONS = new Set(['ALL', 'ALL_SCOPED', 'VIEW', 'VIEW_MASKED', 'NO_ACCESS']);

// ─────────────────────────────────────────────
// RBAC MATRIX — 5 roles × 14 features
// ─────────────────────────────────────────────

const ROLES_MATRIX: {
    name: string;
    description: string;
    permissions: Record<FeatureKey, string>;
}[] = [
    {
        name: 'Super Admin',
        description: 'Full system access — no restrictions',
        permissions: {
            'FEATURE:DASHBOARD':           'ALL',
            'FEATURE:CREDENTIALS':         'ALL',
            'FEATURE:ONE_TIME_SECRETS':    'ALL',
            'FEATURE:ADMIN_USERS_GROUPS':  'ALL',
            'FEATURE:ADMIN_API_CLIENTS':   'ALL',
            'FEATURE:ADMIN_BULK_IMPORT':   'ALL',
            'FEATURE:ACTIVITY_SYSTEM_LOG': 'ALL',
            'FEATURE:ACTIVITY_API_LOG':    'ALL',
            'FEATURE:ACTIVITY_LOGIN':      'ALL',
            'FEATURE:ACTIVITY_IP_BLOCK':   'ALL',
            'FEATURE:SETTINGS':            'ALL',
            'FEATURE:PROFILE':             'ALL',
            'FEATURE:SEARCH':              'ALL',
            'FEATURE:NOTIFICATIONS':       'ALL',
        },
    },
    {
        name: 'Scoped Admin',
        description: 'Admin access restricted to assigned categories and environments',
        permissions: {
            'FEATURE:DASHBOARD':           'ALL_SCOPED',
            'FEATURE:CREDENTIALS':         'ALL_SCOPED',
            'FEATURE:ONE_TIME_SECRETS':    'ALL',
            'FEATURE:ADMIN_USERS_GROUPS':  'ALL_SCOPED',
            'FEATURE:ADMIN_API_CLIENTS':   'ALL_SCOPED',
            'FEATURE:ADMIN_BULK_IMPORT':   'ALL_SCOPED',
            'FEATURE:ACTIVITY_SYSTEM_LOG': 'ALL_SCOPED',
            'FEATURE:ACTIVITY_API_LOG':    'ALL_SCOPED',
            'FEATURE:ACTIVITY_LOGIN':      'ALL_SCOPED',
            'FEATURE:ACTIVITY_IP_BLOCK':   'ALL_SCOPED',
            'FEATURE:SETTINGS':            'VIEW',
            'FEATURE:PROFILE':             'ALL',
            'FEATURE:SEARCH':              'ALL',
            'FEATURE:NOTIFICATIONS':       'ALL',
        },
    },
    {
        name: 'User',
        description: 'Standard user that can create and view scoped credentials and secrets',
        permissions: {
            'FEATURE:DASHBOARD':           'ALL_SCOPED',
            'FEATURE:CREDENTIALS':         'ALL_SCOPED',
            'FEATURE:ONE_TIME_SECRETS':    'ALL_SCOPED',
            'FEATURE:ADMIN_USERS_GROUPS':  'NO_ACCESS',
            'FEATURE:ADMIN_API_CLIENTS':   'NO_ACCESS',
            'FEATURE:ADMIN_BULK_IMPORT':   'NO_ACCESS',
            'FEATURE:ACTIVITY_SYSTEM_LOG': 'VIEW',
            'FEATURE:ACTIVITY_API_LOG':    'VIEW',
            'FEATURE:ACTIVITY_LOGIN':      'NO_ACCESS',
            'FEATURE:ACTIVITY_IP_BLOCK':   'VIEW',
            'FEATURE:SETTINGS':            'NO_ACCESS',
            'FEATURE:PROFILE':             'ALL',
            'FEATURE:SEARCH':              'ALL',
            'FEATURE:NOTIFICATIONS':       'ALL',
        },
    },
    {
        name: 'Auditor',
        description: 'Security and compliance reviewer — masked credential view',
        permissions: {
            'FEATURE:DASHBOARD':           'VIEW',
            'FEATURE:CREDENTIALS':         'VIEW_MASKED',
            'FEATURE:ONE_TIME_SECRETS':    'VIEW_MASKED',
            'FEATURE:ADMIN_USERS_GROUPS':  'NO_ACCESS',
            'FEATURE:ADMIN_API_CLIENTS':   'NO_ACCESS',
            'FEATURE:ADMIN_BULK_IMPORT':   'NO_ACCESS',
            'FEATURE:ACTIVITY_SYSTEM_LOG': 'VIEW',
            'FEATURE:ACTIVITY_API_LOG':    'VIEW',
            'FEATURE:ACTIVITY_LOGIN':      'VIEW',
            'FEATURE:ACTIVITY_IP_BLOCK':   'VIEW',
            'FEATURE:SETTINGS':            'NO_ACCESS',
            'FEATURE:PROFILE':             'ALL',
            'FEATURE:SEARCH':              'ALL',
            'FEATURE:NOTIFICATIONS':       'ALL',
        },
    },
    {
        name: 'Viewer',
        description: 'Read-only observer — full view access to scoped credentials, no activity logs',
        permissions: {
            'FEATURE:DASHBOARD':           'VIEW',
            'FEATURE:CREDENTIALS':         'VIEW',
            'FEATURE:ONE_TIME_SECRETS':    'VIEW',
            'FEATURE:ADMIN_USERS_GROUPS':  'NO_ACCESS',
            'FEATURE:ADMIN_API_CLIENTS':   'NO_ACCESS',
            'FEATURE:ADMIN_BULK_IMPORT':   'NO_ACCESS',
            'FEATURE:ACTIVITY_SYSTEM_LOG': 'NO_ACCESS',
            'FEATURE:ACTIVITY_API_LOG':    'NO_ACCESS',
            'FEATURE:ACTIVITY_LOGIN':      'NO_ACCESS',
            'FEATURE:ACTIVITY_IP_BLOCK':   'NO_ACCESS',
            'FEATURE:SETTINGS':            'NO_ACCESS',
            'FEATURE:PROFILE':             'ALL',
            'FEATURE:SEARCH':              'ALL',
            'FEATURE:NOTIFICATIONS':       'ALL',
        },
    },
];

// ─────────────────────────────────────────────
// SEED — sequential (no transaction to avoid remote DB timeout)
// ─────────────────────────────────────────────

export async function seedRoles(prismaClient: PrismaClient = prisma) {
    console.log('\n🔐 Starting RBAC v11 seed...\n');

    // ── Pre-flight validation ──
    const featureKeys = new Set(FEATURES.map((f) => f.featureKey));

    for (const role of ROLES_MATRIX) {
        const roleKeys = Object.keys(role.permissions) as FeatureKey[];
        if (roleKeys.length !== FEATURES.length) {
            throw new Error(`[seed] Role "${role.name}" has ${roleKeys.length} features, expected ${FEATURES.length}`);
        }
        for (const [fk, perm] of Object.entries(role.permissions)) {
            if (!featureKeys.has(fk as FeatureKey)) throw new Error(`[seed] Unknown featureKey "${fk}" in role "${role.name}"`);
            if (!VALID_PERMISSIONS.has(perm)) throw new Error(`[seed] Invalid permission "${perm}" for "${role.name}:${fk}"`);
        }
        console.log(`  ✅ Pre-flight OK: "${role.name}" — ${roleKeys.length} features`);
    }

    // ── Step 1: Seed iam_features registry ──
    console.log('\n  📋 Seeding iam_features registry...');
    for (const f of FEATURES) {
        await prismaClient.iamFeature.upsert({
            where: { featureKey: f.featureKey },
            update: { module: f.module, submodule: f.submodule ?? null, description: f.description, isActive: true },
            create: { featureKey: f.featureKey, module: f.module, submodule: f.submodule ?? null, description: f.description, isActive: true },
        });
    }
    console.log(`     ✅ ${FEATURES.length} features registered`);

    // ── Step 2: Seed roles ──
    for (const role of ROLES_MATRIX) {
        console.log(`\n  👤 Seeding: ${role.name}`);

        // Upsert User Group
        const userGroup = await (prismaClient as any).userGroup.upsert({
            where: { name: role.name },
            update: { description: role.description },
            create: { name: role.name, description: role.description, isSystem: true },
        });

        // Upsert Access Group
        const accessGroupName = `Role_${role.name}_Access`;
        const accessGroup = await (prismaClient as any).accessGroup.upsert({
            where: { name: accessGroupName },
            update: { description: `Policies for ${role.name}` },
            create: { name: accessGroupName, description: `Policies for ${role.name}` },
        });

        // Link User Group → Access Group
        const existingLink = await (prismaClient as any).userGroupAccess.findFirst({
            where: { userGroupId: userGroup.id, accessGroupId: accessGroup.id },
        });
        if (!existingLink) {
            await (prismaClient as any).userGroupAccess.create({
                data: { userGroupId: userGroup.id, accessGroupId: accessGroup.id },
            });
            console.log(`     🔗 Linked "${role.name}" → "${accessGroupName}"`);
        }

        // Upsert policies — one per feature key
        for (const [featureKey, permission] of Object.entries(role.permissions)) {
            await (prismaClient as any).accessGroupPolicy.upsert({
                where: {
                    accessGroupId_featureKey: {
                        accessGroupId: accessGroup.id,
                        featureKey,
                    },
                },
                update: { permission },
                create: {
                    accessGroupId: accessGroup.id,
                    featureKey,
                    permission,
                    category: null,
                    environment: null,
                },
            });
        }
        console.log(`     ✅ ${Object.keys(role.permissions).length} policies seeded`);
    }

    // ── Step 3: Clean up legacy 'Administrator' group ──
    const legacy = await (prismaClient as any).userGroup.findFirst({ where: { name: 'Administrator' } });
    if (legacy) {
        await (prismaClient as any).userGroup.delete({ where: { id: legacy.id } });
        console.log('\n  🧹 Removed legacy group: Administrator');
    }

    // ── Step 3.5: Migrate Legacy Admins ──
    // Ensure all existing users with role ADMIN or SUPER_ADMIN belong to the Super Admin user group
    const superAdminGroup = await (prismaClient as any).userGroup.findUnique({ where: { name: 'Super Admin' } });
    if (superAdminGroup) {
        const adminUsers = await (prismaClient as any).user.findMany({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
            include: { userGroups: true }
        });
        
        let fixedCount = 0;
        for (const user of adminUsers) {
            const hasGroup = user.userGroups.some((g: any) => g.groupId === superAdminGroup.id);
            if (!hasGroup) {
                await (prismaClient as any).userGroupMapping.create({
                    data: { userId: user.id, groupId: superAdminGroup.id, assignedBy: 'SYSTEM_FIX' }
                });
                fixedCount++;
            }
        }
        if (fixedCount > 0) {
            console.log(`\n  ✅ Migrated ${fixedCount} legacy admin profiles to 'Super Admin' role`);
        }
    }

    // ── Step 4: Increment rbacVersion in SystemSettings ──
    const settings = await (prismaClient as any).systemSettings.findFirst();
    if (settings) {
        await (prismaClient as any).systemSettings.update({
            where: { id: settings.id },
            data: { rbacVersion: { increment: 1 } },
        });
        console.log(`\n  🔄 rbacVersion → ${settings.rbacVersion + 1}`);
    }

    // ── Post-seed validation ──
    console.log('\n  🔍 Post-seed validation...');
    for (const role of ROLES_MATRIX) {
        const ag = await (prismaClient as any).accessGroup.findUnique({
            where: { name: `Role_${role.name}_Access` },
            include: { policies: true },
        });
        if (!ag) throw new Error(`[seed] AccessGroup not found for role: ${role.name}`);
        const count = ag.policies.length;
        if (count < FEATURES.length) throw new Error(`[seed] Role "${role.name}" has ${count} policies, expected ${FEATURES.length}`);
        console.log(`     ✅ "${role.name}" — ${count} policies verified`);
    }

    console.log('\n✅ RBAC v11 seed complete!\n');
}

// ─────────────────────────────────────────────
// STANDALONE
// ─────────────────────────────────────────────

if (require.main === module) {
    seedRoles()
        .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
        .finally(async () => { await prisma.$disconnect(); });
}
