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
        console.error("Profile update failed:", error);
        return { error: 'Failed to update profile: ' + error.message };
    }
}
