'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';

export async function searchUsers(query: string) {
    const session = await auth();
    if (!session?.user) return [];

    // External users cannot search for internal users
    if ((session.user as any).isExternal) return [];

    if (!query || query.length < 2) return [];

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query } },
                { email: { contains: query } }
            ],
            AND: [
                { id: { not: session.user.id } },
                { status: 'ACTIVE' },
                { isExternal: false } // Don't expose external vendors in search results
            ]
        },
        take: 5,
        select: { id: true, name: true, email: true }
    });

    return users;
}

export async function shareCredential(credentialId: string, userId: string) {
    return { error: 'Direct sharing deprecated in favor of IAM groups' };
}

export async function unshareCredential(credentialId: string, userId: string) {
    return { error: 'Direct unsharing deprecated in favor of IAM groups' };
}

