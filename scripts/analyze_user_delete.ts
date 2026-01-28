
import { prisma } from '../lib/prisma';

async function analyzeUserUsage(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                _count: {
                    select: {
                        createdCredentials: true,
                        modifiedCredentials: true,
                        auditLogs: true,
                        invitesSent: true,
                        userGroups: true, // Membership
                    }
                }
            }
        });

        if (!user) {
            console.log(`User ${email} not found.`);
            return;
        }

        console.log(`User Found: ${user.id} (${user.email})`);
        console.log('Dependencies:');
        console.log(`- Created Credentials: ${user._count.createdCredentials}`);
        console.log(`- Modified Credentials: ${user._count.modifiedCredentials}`);
        console.log(`- Audit Logs: ${user._count.auditLogs}`);
        console.log(`- Invites Sent: ${user._count.invitesSent}`);
        console.log(`- Group Memberships: ${user._count.userGroups}`);

        // Check System Settings
        const settings = await prisma.systemSettings.findFirst({
            where: { updatedBy: user.id }
        });
        if (settings) {
            console.log(`- System Settings: Last updated by this user.`);
        }

        return user;
    } catch (error) {
        console.error('Error analyzing user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

analyzeUserUsage('admin@credentialmanager.com');
