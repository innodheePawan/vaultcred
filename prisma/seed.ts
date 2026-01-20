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

    // 1. Create Default Admin User
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

    // 2. Create User Groups (Role Groups)

    // Administrator
    const adminGroup = await prisma.userGroup.upsert({
        where: { name: 'Administrator' },
        update: {},
        create: {
            name: 'Administrator',
            description: 'Full System Access',
            isSystem: true,
        }
    })

    // Moderator
    const moderatorGroup = await prisma.userGroup.upsert({
        where: { name: 'Moderator' },
        update: {},
        create: {
            name: 'Moderator',
            description: 'Can View/Edit Credentials, No User Invite',
            isSystem: true,
        }
    })

    // Viewer
    const viewerGroup = await prisma.userGroup.upsert({
        where: { name: 'Viewer' },
        update: {},
        create: {
            name: 'Viewer',
            description: 'Read-Only Access',
            isSystem: true,
        }
    })

    // Developers (Standard)
    const developersGroup = await prisma.userGroup.upsert({
        where: { name: 'Developers' },
        update: {},
        create: {
            name: 'Developers',
            description: 'General Developers',
            isSystem: false,
        }
    })


    // 3. Create Access Policies (Access Groups)

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

    // Moderator Policy
    const moderatorAccess = await prisma.accessGroup.upsert({
        where: { name: 'Moderator Access' },
        update: {},
        create: {
            name: 'Moderator Access',
            description: 'Edit and View all Credentials',
            policies: {
                create: [
                    { permission: 'READ' },
                    { permission: 'EDIT' },
                    { permission: 'CREATE' },
                    { permission: 'DOWNLOAD' }
                ]
            }
        }
    })

    // Viewer Policy
    const viewerAccess = await prisma.accessGroup.upsert({
        where: { name: 'Viewer Access' },
        update: {},
        create: {
            name: 'Viewer Access',
            description: 'Read-only access to all credentials',
            policies: {
                create: [
                    { permission: 'READ' },
                    { permission: 'DOWNLOAD' }
                ]
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

    // 4. Assign Policies to Groups (Group Access)

    // Administrator -> Full Admin Access
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

    // Moderator -> Moderator Access
    await prisma.userGroupAccess.upsert({
        where: {
            userGroupId_accessGroupId: {
                userGroupId: moderatorGroup.id,
                accessGroupId: moderatorAccess.id
            }
        },
        update: {},
        create: {
            userGroupId: moderatorGroup.id,
            accessGroupId: moderatorAccess.id,
        }
    })

    // Viewer -> Viewer Access
    await prisma.userGroupAccess.upsert({
        where: {
            userGroupId_accessGroupId: {
                userGroupId: viewerGroup.id,
                accessGroupId: viewerAccess.id
            }
        },
        update: {},
        create: {
            userGroupId: viewerGroup.id,
            accessGroupId: viewerAccess.id,
        }
    })

    // 5. Assign Users to Groups

    // Assign Admin User to Administrator Group
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

    console.log('Seeding completed successfully.')
    console.log(`Created Groups: ${adminGroup.name}, ${moderatorGroup.name}, ${viewerGroup.name}`)
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
