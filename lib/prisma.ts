import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.error("❌ [Prisma] DATABASE_URL is undefined. Prisma Client will fail to connect.");
} else {
    // Hide credentials in logs
    const safeUrl = dbUrl.replace(/:[^:@]*@/, ':****@');
    console.log("✅ [Prisma] Connecting to:", safeUrl);
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: dbUrl,
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
