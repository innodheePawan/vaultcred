import { NextResponse } from 'next/server';

export async function GET() {
    // Only expose detailed status in development
    const isDev = process.env.NODE_ENV === 'development';

    const status: Record<string, any> = {
        status: 'ok',
        timestamp: new Date().toISOString(),
    };

    if (isDev) {
        status.nodeEnv = process.env.NODE_ENV;
        status.dbUrlDefined = !!process.env.DATABASE_URL;
        status.nextAuthUrlDefined = !!process.env.NEXTAUTH_URL;
        status.nextPublicAppUrlDefined = !!process.env.NEXT_PUBLIC_APP_URL;
        status.dbConnection = 'PENDING';

        try {
            const { prisma } = await import('@/lib/prisma');
            await prisma.$connect();
            status.dbConnection = 'SUCCESS';
        } catch (error: any) {
            status.dbConnection = `FAILED: ${error.message}`;
        }
    }

    return NextResponse.json(status);
}
