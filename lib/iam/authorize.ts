import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import {
    canAccess,
    FORBIDDEN_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    FeatureAction,
    getSafeUserContext,
    getScopeFilter,
    UserAccessContext,
} from '@/lib/iam/permissions';

// ─────────────────────────────────────────────
// FORBIDDEN LOG THROTTLE
// ─────────────────────────────────────────────

const _forbiddenThrottle = new Map<string, number>();

export function logForbiddenThrottled(
    userId: string,
    featureKey: string,
    action: string,
    metadata?: { ip?: string; userAgent?: string; requestId?: string; category?: string | null; environment?: string | null }
) {
    const key = `${userId}:${featureKey}:${action}`;
    const last = _forbiddenThrottle.get(key) ?? 0;
    if (Date.now() - last > 60_000) {
        console.warn('[RBAC_FORBIDDEN]', JSON.stringify({
            userId,
            feature: featureKey,
            action,
            reason: 'FORBIDDEN',
            metadata: {
                category: metadata?.category ?? null,
                environment: metadata?.environment ?? null,
            },
            ip: metadata?.ip ?? null,
            userAgent: metadata?.userAgent ?? null,
            requestId: metadata?.requestId ?? null,
            timestamp: new Date().toISOString(),
        }));
        _forbiddenThrottle.set(key, Date.now());
    }
}

// ─────────────────────────────────────────────
// AUTHORIZE MIDDLEWARE (Next.js App Router Route Handlers)
// ─────────────────────────────────────────────

export interface AuthorizedRequest extends NextRequest {
    userContext: UserAccessContext;
    scope: {
        categories: string[];
        environments: string[];
        filter: Record<string, any>;
    };
}

/**
 * Wraps a Next.js route handler with RBAC enforcement.
 * Injects userContext + scope into the request object.
 *
 * Usage:
 *   export const GET = withAuthorize('FEATURE:CREDENTIALS', 'VIEW')(async (req) => { ... })
 */
export function withAuthorize(featureKey: string, action: FeatureAction) {
    return function (
        handler: (req: AuthorizedRequest, context?: any) => Promise<NextResponse>
    ) {
        return async function (req: NextRequest, context?: any): Promise<NextResponse> {
            const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined;
            const userAgent = req.headers.get('user-agent') ?? undefined;
            const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();

            // 1. Auth check
            let session: any;
            try {
                session = await auth();
            } catch {
                return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
            }

            if (!session?.user?.id) {
                return NextResponse.json(UNAUTHORIZED_RESPONSE, { status: 401 });
            }

            // 2. Load user context (with error boundary)
            let ctx: UserAccessContext;
            try {
                ctx = await getSafeUserContext(session.user.id);
            } catch {
                return NextResponse.json(
                    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Authorization failed', status: 500 } },
                    { status: 500 }
                );
            }

            // 3. Permission check
            if (!canAccess(ctx, featureKey, action)) {
                logForbiddenThrottled(ctx.userId, featureKey, action, { ip, userAgent, requestId });
                return NextResponse.json(FORBIDDEN_RESPONSE, { status: 403 });
            }

            // 4. Inject context + scope into request
            const authorizedReq = req as AuthorizedRequest;
            authorizedReq.userContext = ctx;
            authorizedReq.scope = {
                categories: ctx.allowedCategories,
                environments: ctx.allowedEnvironments,
                filter: getScopeFilter(ctx, featureKey),
            };

            return handler(authorizedReq, context);
        };
    };
}
