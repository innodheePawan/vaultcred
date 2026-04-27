'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export interface ReleaseNoteItem {
    id: string;
    version: string;
    title: string;
    tag: string;
    createdAt: Date;
}

export interface NotificationPayload {
    notes: ReleaseNoteItem[];
    hasUnread: boolean;
}

/**
 * Fetches active release notes and determines if the current user has unread ones.
 */
export async function getReleaseNotes(): Promise<NotificationPayload> {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;

        // Fetch all active release notes, newest first
        const notes = await prisma.releaseNote.findMany({
            where: { isActive: true },
            orderBy: [{ createdAt: 'desc' }, { sortOrder: 'asc' }],
            take: 20,
        });

        if (!userId || notes.length === 0) {
            return { notes: [], hasUnread: false };
        }

        // Check what the user has last read
        const readRecord = await prisma.userNotificationRead.findUnique({
            where: { userId },
        });

        const hasUnread = !readRecord || !readRecord.lastReadNoteId || 
            readRecord.lastReadNoteId !== notes[0].id;

        return {
            notes: notes.map(n => ({
                id: n.id,
                version: n.version,
                title: n.title,
                tag: n.tag,
                createdAt: n.createdAt,
            })),
            hasUnread,
        };
    } catch (error) {
        console.error('Failed to fetch release notes:', error);
        return { notes: [], hasUnread: false };
    }
}

/**
 * Marks notifications as read for the current user by storing the latest note ID.
 */
export async function markNotificationsRead(): Promise<void> {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id;
        if (!userId) return;

        const latestNote = await prisma.releaseNote.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });

        if (!latestNote) return;

        await prisma.userNotificationRead.upsert({
            where: { userId },
            create: { userId, lastReadNoteId: latestNote.id },
            update: { lastReadNoteId: latestNote.id, readAt: new Date() },
        });
    } catch (error) {
        console.error('Failed to mark notifications read:', error);
    }
}

/**
 * Admin action: Create a new release note.
 */
export async function createReleaseNote(data: {
    version: string;
    title: string;
    tag: string;
    sortOrder?: number;
}): Promise<{ success: boolean; message: string }> {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!userRole || !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
            return { success: false, message: 'Unauthorized' };
        }

        await prisma.releaseNote.create({
            data: {
                version: data.version,
                title: data.title,
                tag: data.tag,
                sortOrder: data.sortOrder ?? 0,
            },
        });

        return { success: true, message: 'Release note created' };
    } catch (error) {
        console.error('Failed to create release note:', error);
        return { success: false, message: 'Failed to create release note' };
    }
}
