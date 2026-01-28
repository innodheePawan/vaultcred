
import { prisma } from '../lib/prisma';

async function deleteUserSafely(targetEmail: string) {
    try {
        const targetUser = await prisma.user.findUnique({ where: { email: targetEmail } });
        if (!targetUser) {
            console.log(`Target user ${targetEmail} not found.`);
            return;
        }

        console.log(`Found target user: ${targetUser.email} (${targetUser.id})`);

        // Find a successor (another Admin)
        const successor = await prisma.user.findFirst({
            where: {
                role: 'ADMIN',
                id: { not: targetUser.id }
            }
        });

        if (!successor) {
            console.error("CRITICAL: No other INTENDED Admin found. Cannot safely reassign dependencies.");
            // Determine if we should proceed with deletion if we can nullify everything?
            // Invites are required. If no successor, we must delete the invite or fail.
            // Let's assume we delete the invite if no successor? No, that's risky.
            // But wait, the user asked to delete THIS user.
            console.log("Checking if we can delete invite...");
            const invites = await prisma.invite.count({ where: { createdById: targetUser.id } });
            if (invites > 0) {
                console.error(`Cannot delete user: ${invites} invites exist and no successor admin found to reassign to.`);
                return;
            }
        } else {
            console.log(`Found successor admin: ${successor.email} (${successor.id})`);

            // Reassign Invites
            const invites = await prisma.invite.updateMany({
                where: { createdById: targetUser.id },
                data: { createdById: successor.id }
            });
            console.log(`Reassigned ${invites.count} invites to successor.`);
        }

        // Nullify Audit Logs (performedBy is optional)
        const audits = await prisma.auditLog.updateMany({
            where: { performedById: targetUser.id },
            data: { performedById: null } // Set to null to preserve log but remove link
        });
        console.log(`Nullified ${audits.count} audit logs.`);

        // Nullify System Settings (updatedBy is optional)
        const settings = await prisma.systemSettings.updateMany({
            where: { updatedBy: targetUser.id },
            data: { updatedBy: null }
        });
        console.log(`Nullified ${settings.count} system settings updates.`);

        // Nullify Credential Master creation/modification?
        // Wait, createdById is REQUIRED in CredentialMaster. 
        // We checked earlier and count was 0.
        // If count > 0, we must reassign.

        if (successor) {
            const credsCreated = await prisma.credentialMaster.updateMany({
                where: { createdById: targetUser.id },
                data: { createdById: successor.id }
            });
            if (credsCreated.count > 0) console.log(`Reassigned ${credsCreated.count} created credentials.`);

            const credsMod = await prisma.credentialMaster.updateMany({
                where: { lastModifiedById: targetUser.id },
                data: { lastModifiedById: successor.id }
            });
            if (credsMod.count > 0) console.log(`Reassigned ${credsMod.count} modified credentials.`);
        }

        // Now Delete User
        await prisma.user.delete({
            where: { id: targetUser.id }
        });
        console.log(`Successfully deleted user ${targetEmail}.`);

    } catch (error) {
        console.error('Error deleting user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

deleteUserSafely('admin@credentialmanager.com');
