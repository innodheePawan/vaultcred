import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    console.warn("⚠️ [Prisma] DATABASE_URL is not yet defined. This is expected during initial setup.");
} else {
    // Hide credentials in logs
    const safeUrl = dbUrl.replace(/:[^:@]*@/, ':****@');
    console.log("✅ [Prisma] Connecting to:", safeUrl);
}

// Prevent crash on startup if Env Var is missing. 
// Connection will fail later (caught by try/catch), but app will boot.
const safeDbUrl = dbUrl || "mysql://dummy:dummy@localhost:3306/dummy";

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: safeDbUrl,
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
