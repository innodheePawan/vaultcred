'use server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateUserProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    const name = formData.get('name') as string;
    const profileImage = formData.get('profileImage') as string; // Expecting Base64 string

    // Security: Prevent massive base64 payloads (DoS/OOM protection)
    if (profileImage && profileImage.length > 0) {
        // A base64 string's size in bytes is roughly (length * (3/4)) - padding
        const approximateByteSize = profileImage.length * 0.75;
        const MAX_SIZE_BYTES = 500 * 1024; // 500 KB limit for profile avatars
        if (approximateByteSize > MAX_SIZE_BYTES) {
            return { error: 'Profile image is too large. Maximum size allowed is 500KB.' };
        }
    }

    if (!name || name.trim().length === 0) {
        return { error: 'Name is required' };
    }

    try {
        const updateData: any = {
            name,
            profileImage: profileImage || null
        };

        // If muteExpiryAlerts is passed, only standard users and viewers can change it
        const muteVal = formData.get('muteExpiryAlerts');
        if (muteVal !== null) {
            const isMuted = muteVal === 'true' || muteVal === 'on' || muteVal === '1';
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { userGroups: { include: { group: true } } },
            });
            const groupNames = user?.userGroups.map(g => g.group.name) || [];
            const isAdminOrScoped = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || groupNames.includes('Super Admin') || groupNames.includes('Scoped Admin');
            if (!isAdminOrScoped) {
                updateData.muteExpiryAlerts = isMuted;
            }
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        revalidatePath('/dashboard');
        revalidatePath('/profile');

        return { success: true, message: 'Profile updated successfully' };
    } catch (error: any) {
        // Profile update failed
        return { error: 'Failed to update profile: ' + error.message };
    }
}

/**
 * Toggles "Mute Expiry Alerts" preference for standard Users and Viewers.
 * Global Admins and Scope Admins are strictly prevented from opting out (Mandatory Compliance).
 */
export async function updateAlertPreferenceAction(mute: boolean) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { userGroups: { include: { group: true } } },
        });

        if (!user) return { error: 'User not found' };

        const groupNames = user.userGroups.map(g => g.group.name);
        const isAdminOrScoped = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || groupNames.includes('Super Admin') || groupNames.includes('Scoped Admin');

        if (isAdminOrScoped) {
            return { error: 'Mandatory Compliance: Administrators cannot opt out of expiry alerts.' };
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { muteExpiryAlerts: mute } as any,
        });

        revalidatePath('/profile');
        return { success: true, message: mute ? 'Expiry alerts muted.' : 'Expiry alerts unmuted.' };
    } catch (err: any) {
        return { error: 'Failed to update alert preference: ' + err.message };
    }
}

