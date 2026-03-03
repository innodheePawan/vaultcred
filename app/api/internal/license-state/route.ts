import { NextRequest, NextResponse } from 'next/server';
import { getLicenseState, invalidateLicenseCache } from '@/lib/license-enforcement';

// Force Node.js runtime so we can access the global cache
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const forceRefresh = req.nextUrl.searchParams.get('refresh') === 'true';
        if (forceRefresh) {
            invalidateLicenseCache();
        }
        const info = await getLicenseState(forceRefresh);
        return NextResponse.json({
            state: info.state,
            activeUsers: info.activeUsers,
        });
    } catch (e) {
        // If the engine fails completely, default to UNACTIVATED
        return NextResponse.json({ state: 'UNACTIVATED' });
    }
}
