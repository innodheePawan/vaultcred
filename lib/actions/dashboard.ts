'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserAccessContext } from '@/lib/iam/permissions';

export type DashboardStats = {
    personal: {
        total: number;
        expiringSoon: number; // Next 60 days
        expired: number;
        timeline: { month: string; count: number }[];
    };
    shared: {
        total: number;
        expiringSoon: number;
        // Updated to include expiring counts within groups
        byCategory: { name: string; value: number; expiring: number }[];
        byEnvironment: { name: string; value: number; expiring: number }[];
    };
    risk: {
        totalExpired: number;
        totalNearExpiry: number;
    };
};

export async function getDashboardStats(): Promise<DashboardStats> {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const userId = session.user.id!;
    const accessContext = await getUserAccessContext(userId);
    const now = new Date();
    const nearFuture = new Date();
    nearFuture.setDate(now.getDate() + 60);

    // 1. Personal Stats
    const personalCreds = await prisma.credentialMaster.findMany({
        where: {
            createdById: userId,
            isPersonal: true
        },
        select: {
            expiryDate: true
        }
    });

    const personalTotal = personalCreds.length;
    const personalExpired = personalCreds.filter(c => c.expiryDate && c.expiryDate < now).length;
    const personalExpiringSoon = personalCreds.filter(c => c.expiryDate && c.expiryDate >= now && c.expiryDate <= nearFuture).length;

    // Timeline
    const timelineMap: Record<string, number> = {};
    personalCreds.forEach(c => {
        if (c.expiryDate) {
            const key = c.expiryDate.toLocaleString('default', { month: 'short', year: 'numeric' });
            timelineMap[key] = (timelineMap[key] || 0) + 1;
        }
    });
    const timeline = Object.entries(timelineMap).map(([month, count]) => ({ month, count }));

    // 2. Shared Stats
    const sharedWhere: any = {
        isPersonal: false,
        AND: []
    };

    if (!accessContext.isAdmin) {
        if (!accessContext.allowedCategories.includes('*')) {
            sharedWhere.AND.push({ category: { in: accessContext.allowedCategories } });
        }
        if (!accessContext.allowedEnvironments.includes('*')) {
            sharedWhere.AND.push({ environment: { in: accessContext.allowedEnvironments } });
        }
    }

    const sharedCreds = await prisma.credentialMaster.findMany({
        where: sharedWhere,
        select: {
            category: true,
            environment: true,
            expiryDate: true
        }
    });

    const sharedTotal = sharedCreds.length;
    const sharedExpired = sharedCreds.filter(c => c.expiryDate && c.expiryDate < now).length;
    const sharedExpiringSoon = sharedCreds.filter(c => c.expiryDate && c.expiryDate >= now && c.expiryDate <= nearFuture).length;

    // Group By Category with Expiry Logic
    const catMap: Record<string, { total: number; expiring: number }> = {};
    sharedCreds.forEach(c => {
        const cat = c.category || 'Uncategorized';
        if (!catMap[cat]) catMap[cat] = { total: 0, expiring: 0 };
        catMap[cat].total++;
        if (c.expiryDate && c.expiryDate <= nearFuture) {
            catMap[cat].expiring++;
        }
    });
    const byCategory = Object.entries(catMap).map(([name, stats]) => ({
        name,
        value: stats.total,
        expiring: stats.expiring
    }));

    // Group By Environment with Expiry Logic
    const envMap: Record<string, { total: number; expiring: number }> = {};
    sharedCreds.forEach(c => {
        const env = c.environment || 'No Env';
        if (!envMap[env]) envMap[env] = { total: 0, expiring: 0 };
        envMap[env].total++;
        if (c.expiryDate && c.expiryDate <= nearFuture) {
            envMap[env].expiring++;
        }
    });
    const byEnvironment = Object.entries(envMap).map(([name, stats]) => ({
        name,
        value: stats.total,
        expiring: stats.expiring
    }));

    return {
        personal: {
            total: personalTotal,
            expiringSoon: personalExpiringSoon,
            expired: personalExpired,
            timeline
        },
        shared: {
            total: sharedTotal,
            expiringSoon: sharedExpiringSoon,
            byCategory,
            byEnvironment
        },
        risk: {
            totalExpired: personalExpired + sharedExpired,
            totalNearExpiry: personalExpiringSoon + sharedExpiringSoon
        }
    };
}
