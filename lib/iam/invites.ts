import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

// Inline role normalizer — maps any incoming role string to a valid DB enum value
const VALID_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'VIEWER', 'USER']);
function deriveFinalRole(role: string): string {
    if (VALID_ROLES.has(role)) return role;
    return 'USER'; // Safe default
}
import { hashPassword } from '@/lib/utils/password';
import { sendInviteEmail } from '@/lib/email';

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
    scopedEnvironments: string | null = null,
    isExternal: boolean = false,
    externalAccessType: string | null = null,
    accessExpiresAt: Date | null = null,
    vendorName: string | null = null,
    targetCredentialIds: string[] = []
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
            targetScopedEnvironments: scopedEnvironments,
            isExternal,
            externalAccessType,
            accessExpiresAt,
            vendorName,
            targetCredentialIds: targetCredentialIds.length > 0 ? targetCredentialIds.join(',') : null
        } as any
    });

    // Send invitation email
    let emailSent = false;
    try {
        const inviter = await prisma.user.findUnique({
            where: { id: invitedByUserId },
            select: { name: true, email: true },
        });
        const inviterName = inviter?.name || inviter?.email || 'An administrator';
        await sendInviteEmail(email, token, inviterName);
        emailSent = true;
    } catch (emailError) {
        // Failed to send invite email
        // Don't throw — the invite is created, email failure is non-fatal
    }

    return { ...invite, emailSent };
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

    // --- License Limit Check ---
    const { getLicenseState } = await import('@/lib/license-enforcement');
    const licenseInfo = await getLicenseState();

    if (licenseInfo.state === 'UNACTIVATED' || licenseInfo.state === 'COMPROMISED') {
        throw new Error('System is in an unactivated or compromised state.');
    }

    if (!licenseInfo.activeUsers) {
        throw new Error('License user limit is missing.');
    }

    // Use transaction to ensure user creation and group assignment happen together
    const user = await prisma.$transaction(async (tx) => {
        // --- Atomic License Limit Check ---
        const currentActiveUsers = await tx.user.count({
            where: { status: 'ACTIVE' }
        });

        if (currentActiveUsers >= licenseInfo.activeUsers!) {
            throw new Error('Active user limit reached as per your license. Please ask your administrator to upgrade your license to add more users.');
        }
        // ------------------------------------

        // 1. Create User
        const finalRole = deriveFinalRole(invite.role);
        const newUser = await tx.user.create({
            data: {
                email: invite.email,
                name,
                passwordHash: hashedPassword,
                status: 'ACTIVE',
                role: finalRole,
                inviteToken: token, // Link for audit
                isExternal: (invite as any).isExternal,
                externalAccessType: (invite as any).externalAccessType,
                accessExpiresAt: (invite as any).accessExpiresAt,
                vendorName: (invite as any).vendorName,
                allowedCredentialIds: (invite as any).targetCredentialIds,
                allowedCategories: (invite as any).targetScopedCategories,
                allowedEnvironments: (invite as any).targetScopedEnvironments
            } as any
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
