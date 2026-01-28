import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    console.log('Syncing Roles based on Groups...')

    // 1. Get Administrator Group ID
    const adminGroup = await prisma.userGroup.findUnique({
        where: { name: 'Administrator' }
    });

    if (!adminGroup) {
        throw new Error('Administrator group not found! Run seed first.');
    }

    const users = await prisma.user.findMany({
        include: { userGroups: true }
    });

    for (const user of users) {
        const groupIds = user.userGroups.map(ug => ug.groupId);
        const isAdminGroupMember = groupIds.includes(adminGroup.id);

        let needsUpdate = false;
        let newRole = user.role;

        // Case A: User is in Admin Group but role is USER -> Fix to ADMIN
        if (isAdminGroupMember && user.role !== 'ADMIN') {
            newRole = 'ADMIN';
            needsUpdate = true;
            console.log(`- Updating ${user.email}: Group Administrator -> Role ADMIN`);
        }

        // Case B: User has no Admin Group but role is ADMIN -> Fix to USER (or add to group?)
        // Use Policy: Group is source of truth. If not in group, lose admin privileges.
        else if (!isAdminGroupMember && user.role === 'ADMIN') {
            // Wait, safety check: Is this the main admin?
            // If we demote the main admin we might lock ourselves out if we rely on group check.
            // But we said we want to synchronize.
            // Let's Add them to the group instead to be safe.
            console.log(`- Fixing ${user.email}: Role ADMIN -> Added to Administrator Group`);
            await prisma.userGroupMapping.create({
                data: {
                    userId: user.id,
                    groupId: adminGroup.id,
                    assignedBy: 'SYSTEM'
                }
            });
            continue; // Skip the update below since we fixed it via mapping
        }

        if (needsUpdate) {
            await prisma.user.update({
                where: { id: user.id },
                data: { role: newRole }
            });
        }
    }

    console.log('Sync complete.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
