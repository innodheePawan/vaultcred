import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma'; // Dynamic import used instead

export async function GET() {
    const envStatus = {
        nodeEnv: process.env.NODE_ENV,
        dbUrlDefined: !!process.env.DATABASE_URL,
        nextAuthUrlDefined: !!process.env.NEXTAUTH_URL,
        nextPublicAppUrlDefined: !!process.env.NEXT_PUBLIC_APP_URL,
        dbConnection: 'PENDING'
    };

    try {
        // Dynamically import prisma to avoid top-level crash if binary is missing
        const { prisma } = await import('@/lib/prisma');
        await prisma.$connect();
        envStatus.dbConnection = 'SUCCESS';
    } catch (error: any) {
        envStatus.dbConnection = `FAILED: ${error.message}`;
    }

    return NextResponse.json(envStatus);
}
