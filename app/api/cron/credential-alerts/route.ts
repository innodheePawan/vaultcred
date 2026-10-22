import { NextResponse } from 'next/server';
import { evaluateAndDispatchExpiryAlerts } from '@/lib/alert-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // 1. Cron Security: Validate Authorization header if CRON_SECRET is configured
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${cronSecret}`) {
            return new NextResponse('Unauthorized: Invalid or missing Bearer token', { status: 401 });
        }
    }

    try {
        // 2. Execute automated 24-hour alert evaluation
        const result = await evaluateAndDispatchExpiryAlerts();

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Evaluation completed. Evaluated ${result.evaluatedCount} credentials, matched ${result.matchingCount}, dispatched ${result.dispatchedDigestCount} digests across ${result.recipientsNotifiedCount} recipients.`,
            metrics: result,
        });
    } catch (error: any) {
        console.error('[Cron Credential Alerts] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Internal error during cron evaluation' },
            { status: 500 }
        );
    }
}
