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
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                profileImage: profileImage || null
            } as any
        });

        revalidatePath('/dashboard');
        revalidatePath('/profile');

        return { success: true, message: 'Profile updated successfully' };
    } catch (error: any) {
        // Profile update failed
        return { error: 'Failed to update profile: ' + error.message };
    }
}
