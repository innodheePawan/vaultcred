'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function getDatabaseInfo() {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const dbUrl = process.env.DATABASE_URL;
    let details = {
        type: 'Unknown',
        host: 'Unknown',
        port: 'Unknown',
        user: 'Unknown',
        database: 'Unknown',
        ssl: false
    };

    if (dbUrl) {
        try {
            const url = new URL(dbUrl);
            details = {
                type: url.protocol.replace(':', ''),
                host: url.hostname,
                port: url.port,
                user: url.username,
                database: url.pathname.replace('/', ''),
                ssl: url.searchParams.get('sslaccept') === 'strict' || url.searchParams.get('ssl') === 'true'
            };
        } catch (e) {
            console.error("Failed to parse DATABASE_URL", e);
        }
    }

    let status = 'Error';
    let latency = 0;

    try {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        latency = Date.now() - start;
        status = 'Connected';
    } catch (e: any) {
        status = 'Disconnected';
        console.error("Database connection check failed:", e.message);
    }

    return {
        ...details,
        status,
        latency
    };
}
