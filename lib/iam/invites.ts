import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { hashPassword } from '@/lib/utils/password';

/**
 * Creates a new invite for a user.
 * Generates a secure token and stores the intended group assignments.
 */
export async function createInvite(
    email: string,
    invitedByUserId: string,
    targetGroupIds: string[],
    role: string = 'USER',
    scopedCategories: string | null = null,
    scopedEnvironments: string | null = null
) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new Error('User already exists');
    }

    // Check if pending invite already exists
    const existingInvite = await prisma.invite.findFirst({
        where: {
            email,
            accepted: false,
            expiresAt: { gt: new Date() }
        }
    });

    if (existingInvite) {
        throw new Error('An active invite already exists for this email');
    }

    // Generate random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

    // Create Invite Record
    const invite = await prisma.invite.create({
        data: {
            email,
            token,
            role, // Use passed role
            expiresAt,
            createdById: invitedByUserId,
            targetGroupIds: JSON.stringify(targetGroupIds), // Store as simple JSON
            // @ts-ignore
            targetScopedCategories: scopedCategories,
            // @ts-ignore
            targetScopedEnvironments: scopedEnvironments
        }
    });

    // In a real app, send email here.
    // For now, we return the token to be displayed to the admin.
    return invite;
}

/**
 * Validates an invite token.
 */
export async function validateInvite(token: string) {
    const invite = await prisma.invite.findUnique({
        where: { token },
        include: { createdBy: { select: { name: true, email: true } } }
    });

    if (!invite) return null;
    if (invite.accepted) return null;
    if (invite.expiresAt < new Date()) return null;

    return invite;
}

/**
 * Accepts an invite, creates the user, and assigns groups.
 */
export async function acceptInvite(token: string, name: string, passwordPlain: string) {
    const invite = await validateInvite(token);
    if (!invite) throw new Error('Invalid or expired invite');

    const hashedPassword = await hashPassword(passwordPlain);

    // Use transaction to ensure user creation and group assignment happen together
    const user = await prisma.$transaction(async (tx) => {
        // 1. Create User
        const newUser = await tx.user.create({
            data: {
                email: invite.email,
                name,
                passwordHash: hashedPassword,
                status: 'ACTIVE',
                role: invite.role,
                inviteToken: token, // Link for audit
            }
        });

        // 2. Mark Invite as Accepted
        await tx.invite.update({
            where: { id: invite.id },
            data: {
                accepted: true,
                acceptedAt: new Date()
            }
        });

        // 3. Assign Groups
        if (invite.targetGroupIds) {
            const groupIds = JSON.parse(invite.targetGroupIds) as string[];
            if (groupIds.length > 0) {
                // Verify groups exist to be safe? (Optional, skipping for speed)
                await tx.userGroupMapping.createMany({
                    data: groupIds.map(gid => ({
                        userId: newUser.id,
                        groupId: gid,
                        assignedBy: 'SYSTEM_INVITE',
                        // @ts-ignore
                        scopedCategories: invite.targetScopedCategories,
                        // @ts-ignore
                        scopedEnvironments: invite.targetScopedEnvironments
                    }))
                });
            }
        }

        return newUser;
    });

    return user;
}
