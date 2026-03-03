import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
    // DATABASE_URL is undefined - Prisma Client will fail to connect
} else {
    // Hide credentials in logs natively
}

// Prevent crash on startup if Env Var is missing.
const safeDbUrl = dbUrl || "mysql://dummy:dummy@localhost:3306/dummy";

// In serverless environments (like AWS Amplify), each Lambda instance spins up its own Prisma Client.
// This quickly exhausts the MySQL `max_user_connections` limit if not capped.
// We force connection_limit=1 for production serverless deployments.
const isProd = process.env.NODE_ENV === 'production';
const connectionUrl = isProd && dbUrl
    ? (dbUrl.includes('?') ? `${dbUrl}&connection_limit=1` : `${dbUrl}?connection_limit=1`)
    : safeDbUrl;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: connectionUrl,
        },
    },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
