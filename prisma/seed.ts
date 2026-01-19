import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/utils/password'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.ADMIN_PASSWORD || 'password123'

    if (process.env.NODE_ENV === 'production' && password === 'password123') {
        console.warn('WARNING: Using default password in production!')
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    })

    // --------------------------------------
    // IAM SEEDING
    // --------------------------------------

    // 1. Create System Groups
    const adminGroup = await prisma.userGroup.upsert({
        where: { name: 'Admins' },
        update: {},
        create: {
            name: 'Admins',
            description: 'System Administrators',
            isSystem: true,
        }
    })

    const developersGroup = await prisma.userGroup.upsert({
        where: { name: 'Developers' },
        update: {},
        create: {
            name: 'Developers',
            description: 'General Developers',
            isSystem: false,
        }
    })

    // 2. Create Access Policies (Access Groups)

    // Admin Policy (Full Access)
    const adminAccess = await prisma.accessGroup.upsert({
        where: { name: 'Full Admin Access' },
        update: {},
        create: {
            name: 'Full Admin Access',
            description: 'Full access to all credentials',
            policies: {
                create: {
                    permission: 'ADMIN',
                    // Null category/env means ALL
                }
            }
        }
    })

    // Developer Policy (Dev/QA Read/Write)
    const devAccess = await prisma.accessGroup.upsert({
        where: { name: 'Standard Developer Access' },
        update: {},
        create: {
            name: 'Standard Developer Access',
            description: 'Access to Dev and QA environments',
            policies: {
                create: [
                    { category: 'Application', environment: 'Dev', permission: 'EDIT' },
                    { category: 'Application', environment: 'QA', permission: 'READ' },
                ]
            }
        }
    })

    // 3. Assign User to Admin Group
    await prisma.userGroupMapping.upsert({
        where: {
            userId_groupId: {
                userId: user.id,
                groupId: adminGroup.id
            }
        },
        update: {},
        create: {
            userId: user.id,
            groupId: adminGroup.id,
            assignedBy: 'SYSTEM'
        }
    })

    // 4. Assign Policy to Admin Group
    await prisma.userGroupAccess.upsert({
        where: {
            userGroupId_accessGroupId: {
                userGroupId: adminGroup.id,
                accessGroupId: adminAccess.id
            }
        },
        update: {},
        create: {
            userGroupId: adminGroup.id,
            accessGroupId: adminAccess.id,
        }
    })

    console.log({ user, adminGroup, adminAccess })
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
