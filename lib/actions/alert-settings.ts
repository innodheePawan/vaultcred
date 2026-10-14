'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { logAudit } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';
import { evaluateAndDispatchExpiryAlerts, AlertEvaluationResult } from '@/lib/alert-engine';
import { sendExpiryAlertDigestEmail } from '@/lib/email';
import { ExpiryCredentialItem } from '@/lib/email-templates';

/**
 * Returns current Global Expiry Alert policies and user permissions.
 */
export async function getAlertSettings() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized: Please log in', status: 401 };
    }

    const ctx = await getSafeUserContext(session.user.id);
    const canView = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'VIEW') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!canView) {
        return { error: 'Forbidden: You do not have permission to view alert setup', status: 403 };
    }

    const canEdit = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'EDIT') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    const settings = await prisma.systemSettings.findFirst();

    return {
        tier1Days: settings?.alertTier1Days ?? 60,
        tier2Days: settings?.alertTier2Days ?? 30,
        tier3Days: settings?.alertTier3Days ?? 15,
        lastEvaluationAt: settings?.lastAlertEvaluationAt ? settings.lastAlertEvaluationAt.toISOString() : null,
        canEdit,
        userRole: ctx.role,
        isScopedAdmin: ctx.role === 'Scoped Admin' || (!canEdit && canView),
    };
}

/**
 * Updates Global Expiry Alert thresholds.
 * Enforces strict validation: Tier 1 > Tier 2 > Tier 3 > 0.
 * Writes audit log capturing user, timestamp, previous, and new values.
 */
export async function updateAlertSettings(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized: Session invalid' };
    }

    const ctx = await getSafeUserContext(session.user.id);
    const canEdit = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'EDIT') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!canEdit) {
        return { error: 'Forbidden: Only Global Administrators can update alert policies' };
    }

    const rawT1 = formData.get('tier1Days');
    const rawT2 = formData.get('tier2Days');
    const rawT3 = formData.get('tier3Days');

    const tier1 = parseInt(String(rawT1), 10);
    const tier2 = parseInt(String(rawT2), 10);
    const tier3 = parseInt(String(rawT3), 10);

    if (isNaN(tier1) || isNaN(tier2) || isNaN(tier3)) {
        return { error: 'Invalid input: All threshold tiers must be valid integers.' };
    }

    // Validation Rules (BRD Section 4 line 25):
    // Strict descending hierarchy: Tier 1 > Tier 2 > Tier 3 > 0
    if (tier3 <= 0) {
        return { error: 'Validation Error: Tier 3 (Urgent) must be greater than 0 days.' };
    }
    if (tier2 <= tier3) {
        return { error: `Validation Error: Tier 2 (${tier2}d) must be strictly greater than Tier 3 (${tier3}d).` };
    }
    if (tier1 <= tier2) {
        return { error: `Validation Error: Tier 1 (${tier1}d) must be strictly greater than Tier 2 (${tier2}d).` };
    }
    if (tier1 > 365) {
        return { error: 'Validation Error: Tier 1 cannot exceed 365 days.' };
    }

    try {
        const currentSettings = await prisma.systemSettings.findFirst();
        const oldTier1 = currentSettings?.alertTier1Days ?? 60;
        const oldTier2 = currentSettings?.alertTier2Days ?? 30;
        const oldTier3 = currentSettings?.alertTier3Days ?? 15;

        // Update settings
        await prisma.systemSettings.updateMany({
            data: {
                alertTier1Days: tier1,
                alertTier2Days: tier2,
                alertTier3Days: tier3,
                updatedBy: session.user.email || session.user.id,
            },
        });

        // Audit Logging (BRD Section 4 line 26)
        const oldValues = { tier1: oldTier1, tier2: oldTier2, tier3: oldTier3 };
        const newValues = { tier1, tier2, tier3 };

        await logAudit({
            action: 'UPDATE_ALERT_POLICY',
            details: `Updated expiry alert thresholds: Tier 1 (${oldTier1}d -> ${tier1}d), Tier 2 (${oldTier2}d -> ${tier2}d), Tier 3 (${oldTier3}d -> ${tier3}d)`,
            oldValue: JSON.stringify(oldValues),
            newValue: JSON.stringify(newValues),
            userId: session.user.id,
        });

        revalidatePath('/settings/alert-setup');
        revalidatePath('/settings');

        return {
            success: true,
            message: `Alert policies successfully updated (Tier 1: ${tier1}d, Tier 2: ${tier2}d, Tier 3: ${tier3}d).`,
        };
    } catch (err: any) {
        console.error('[AlertSettings] Failed to update alert policies:', err);
        return { error: `Failed to save alert settings: ${err?.message || 'Internal error'}` };
    }
}

/**
 * Triggers an immediate alert evaluation on demand (Super Admin only).
 */
export async function triggerAlertEvaluationAction(): Promise<AlertEvaluationResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            success: false,
            error: 'Unauthorized',
            evaluatedCount: 0,
            matchingCount: 0,
            dispatchedDigestCount: 0,
            recipientsNotifiedCount: 0,
            tiersEvaluated: [],
            details: [],
        };
    }

    const ctx = await getSafeUserContext(session.user.id);
    const canEdit = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'EDIT') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!canEdit) {
        return {
            success: false,
            error: 'Forbidden: Only Global Administrators can run alert evaluations',
            evaluatedCount: 0,
            matchingCount: 0,
            dispatchedDigestCount: 0,
            recipientsNotifiedCount: 0,
            tiersEvaluated: [],
            details: [],
        };
    }

    const result = await evaluateAndDispatchExpiryAlerts({ forceDispatch: false });

    // Log audit
    await logAudit({
        action: 'MANUAL_ALERT_EVALUATION',
        details: `Super Admin manually triggered alert evaluation. Result: ${result.dispatchedDigestCount} digests sent, ${result.recipientsNotifiedCount} recipients notified.`,
        newValue: JSON.stringify({
            evaluated: result.evaluatedCount,
            matching: result.matchingCount,
            dispatched: result.dispatchedDigestCount,
        }),
        userId: session.user.id,
    });

    revalidatePath('/settings/alert-setup');
    return result;
}

/**
 * Sends a sample test digest email to preview formatting and verify SMTP.
 */
export async function sendTestAlertDigestAction(targetEmail: string, tier: number = 1) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Unauthorized' };
    }

    const ctx = await getSafeUserContext(session.user.id);
    const canEdit = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'EDIT') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!canEdit) {
        return { error: 'Forbidden: Only Global Administrators can trigger test emails' };
    }

    if (!targetEmail || !targetEmail.includes('@')) {
        return { error: 'Please provide a valid recipient email address.' };
    }

    const settings = await prisma.systemSettings.findFirst();
    const tierDays = tier === 1 ? (settings?.alertTier1Days ?? 60) : tier === 2 ? (settings?.alertTier2Days ?? 30) : (settings?.alertTier3Days ?? 15);

    const { getBaseUrl } = await import('@/lib/utils/url');
    const baseUrl = await getBaseUrl();

    // Mock realistic sample credentials for demonstration
    const sampleCredentials: ExpiryCredentialItem[] = [
        {
            id: 'sample-cred-1',
            name: 'Production SAP Gateway API Key',
            type: 'API_OAUTH',
            category: 'Integration',
            environment: 'Prod',
            expiryDate: new Date(Date.now() + tierDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            daysRemaining: tierDays,
            actionUrl: `${baseUrl}/credentials`,
        },
        {
            id: 'sample-cred-2',
            name: 'PostgreSQL DB Root Password',
            type: 'PASSWORD',
            category: 'Infra',
            environment: 'Prod',
            expiryDate: new Date(Date.now() + tierDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            daysRemaining: tierDays,
            actionUrl: `${baseUrl}/credentials`,
        },
    ];

    try {
        await sendExpiryAlertDigestEmail({
            recipientEmail: targetEmail,
            recipientName: session.user.name || 'Administrator',
            recipientRole: 'Super Admin',
            tier,
            tierDays,
            credentials: sampleCredentials,
            canEdit: true,
        });

        return {
            success: true,
            message: `Sample Tier ${tier} (${tierDays}d) alert digest successfully dispatched to ${targetEmail}`,
        };
    } catch (err: any) {
        return { error: `Failed to dispatch test digest: ${err?.message || 'SMTP error'}` };
    }
}

/**
 * Fetches recent alert dispatch history logs.
 */
export async function getAlertDispatchLogs(limit: number = 25) {
    const session = await auth();
    if (!session?.user?.id) return { data: [] };

    const ctx = await getSafeUserContext(session.user.id);
    const canView = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'VIEW') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!canView) return { data: [] };

    try {
        const logs = await (prisma as any).expiryAlertLog.findMany({
            orderBy: { sentAt: 'desc' },
            take: limit,
        });

        return {
            data: logs.map((log: any) => ({
                id: log.id,
                tier: log.tier,
                daysRemaining: log.daysRemaining,
                recipientEmail: log.recipientEmail,
                recipientRole: log.recipientRole,
                credentialCount: log.credentialCount,
                status: log.status,
                errorMessage: log.errorMessage,
                sentAt: log.sentAt ? log.sentAt.toISOString() : null,
            })),
        };
    } catch (err) {
        console.error('[AlertSettings] Failed to fetch dispatch logs:', err);
        return { data: [] };
    }
}
