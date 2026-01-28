import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRoles(prismaClient: PrismaClient = prisma) {
    console.log('Seeding Role Groups...');

    const roles = [
        {
            name: 'Admin',
            description: 'Scoped Admin Access (No Settings)',
            permissions: ['ADMIN']
        },
        {
            name: 'User',
            description: 'Can Create, Edit, Delete Credentials',
            permissions: ['CREATE', 'EDIT', 'DELETE', 'READ', 'DOWNLOAD', 'AUDIT']
        },
        {
            name: 'Viewer',
            description: 'Read-Only Access',
            permissions: ['READ', 'DOWNLOAD']
        },
        {
            name: 'Auditor',
            description: 'Can View Audit Logs',
            permissions: ['AUDIT']
        }
    ];

    for (const role of roles) {
        // 1. Create User Group
        const userGroup = await prismaClient.userGroup.upsert({
            where: { name: role.name },
            update: {},
            create: {
                name: role.name,
                description: role.description,
                isSystem: true
            }
        });

        // 2. Create Access Group (The Policy Holder)
        const accessGroupName = `Role_${role.name}_Access`;
        const accessGroup = await prismaClient.accessGroup.upsert({
            where: { name: accessGroupName },
            update: {},
            create: {
                name: accessGroupName,
                description: `Policies for ${role.name}`
            }
        });

        // 3. Link UserGroup -> AccessGroup
        // Check if exists
        const existingLink = await prismaClient.userGroupAccess.findUnique({
            where: {
                userGroupId_accessGroupId: {
                    userGroupId: userGroup.id,
                    accessGroupId: accessGroup.id
                }
            }
        });

        if (!existingLink) {
            await prismaClient.userGroupAccess.create({
                data: {
                    userGroupId: userGroup.id,
                    accessGroupId: accessGroup.id
                }
            });
        }

        // 4. Create Policies
        // Wipe existing policies for this AccessGroup to ensure state matches script
        await prismaClient.accessGroupPolicy.deleteMany({
            where: { accessGroupId: accessGroup.id }
        });

        for (const perm of role.permissions) {
            await prismaClient.accessGroupPolicy.create({
                data: {
                    accessGroupId: accessGroup.id,
                    permission: perm,
                    category: null, // ALL
                    environment: null // ALL
                }
            });
        }

        console.log(`Setup ${role.name} complete.`);
    }
}

// Allow standalone execution
if (require.main === module) {
    seedRoles()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

