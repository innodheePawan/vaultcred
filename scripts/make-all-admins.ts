import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    console.log('Promoting ALL users to Administrator...')

    // 1. Get Administrator Group
    const adminGroup = await prisma.userGroup.findUnique({
        where: { name: 'Administrator' }
    });

    if (!adminGroup) {
        throw new Error('Administrator group not found!');
    }

    // 2. Get All Users
    const users = await prisma.user.findMany();

    for (const user of users) {
        console.log(`Processing ${user.email}...`);

        // Remove existing mappings
        await prisma.userGroupMapping.deleteMany({
            where: { userId: user.id }
        });

        // Add to Administrator Group
        await prisma.userGroupMapping.create({
            data: {
                userId: user.id,
                groupId: adminGroup.id,
                assignedBy: 'SYSTEM'
            }
        });

        // Update Role Field
        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
        });
    }

    console.log('All users are now Administrators.')
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
