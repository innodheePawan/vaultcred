import { prisma } from '@/lib/prisma';
import { getUserAccessContext, canAccess } from '@/lib/iam/permissions';
import { sendExpiryAlertDigestEmail } from '@/lib/email';
import { ExpiryCredentialItem } from '@/lib/email-templates';

export interface AlertEvaluationResult {
    success: boolean;
    error?: string;
    evaluatedCount: number;
    matchingCount: number;
    dispatchedDigestCount: number;
    recipientsNotifiedCount: number;
    tiersEvaluated: { tier: number; days: number; count: number }[];
    details: {
        recipientEmail: string;
        recipientRole: string;
        tier: number;
        tierDays: number;
        credentialsCount: number;
        status: string;
    }[];
}

/**
 * Normalizes a Date to midnight UTC for pure calendar day comparison.
 */
function toMidnightUtc(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Formats a Date object into a readable string (e.g. "Oct 15, 2026").
 */
function formatDisplayDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    });
}

/**
 * Core Evaluation Engine for Expiry Alerts (as per AlertNotification.md BRD).
 * - Runs exact-day targeting based on global config tiers (Tier 1, Tier 2, Tier 3).
 * - Enforces Least-Privilege & Zero-Leakage (User only receives credentials they have explicit rights to view).
 * - Deduplicates multi-role and multi-scope assignments into one consolidated email digest per tier.
 * - Enforces Mandatory Compliance (Global Admins and Scope Admins cannot opt out).
 * - Respects opt-out toggle (muteExpiryAlerts) for standard Users and Viewers.
 * - Idempotency: skips duplicate emails if already sent today for the same tier & recipient.
 */
export async function evaluateAndDispatchExpiryAlerts(options?: {
    forceDispatch?: boolean; // If true, bypasses "already sent today" check (useful for manual runs/testing)
    baseUrlOverride?: string;
}): Promise<AlertEvaluationResult> {
    try {
        // 1. Fetch Global Settings & Tiers
        const settings = await prisma.systemSettings.findFirst();
        const tier1Days = settings?.alertTier1Days ?? 60;
        const tier2Days = settings?.alertTier2Days ?? 30;
        const tier3Days = settings?.alertTier3Days ?? 15;

        const tiers = [
            { tier: 1, days: tier1Days, label: 'Informational' },
            { tier: 2, days: tier2Days, label: 'Warning' },
            { tier: 3, days: tier3Days, label: 'Urgent' },
        ];

        const todayUtc = toMidnightUtc(new Date());

        // 2. Fetch all active credentials with an expiryDate and their notification history
        const activeCredentials = await prisma.credentialMaster.findMany({
            where: {
                status: 'ACTIVE',
                expiryDate: { not: null },
            },
            select: {
                id: true,
                name: true,
                type: true,
                category: true,
                environment: true,
                expiryDate: true,
                isPersonal: true,
                createdById: true,
                expiryNotify: {
                    select: {
                        id: true,
                        notifyBeforeDays: true,
                        lastNotified: true,
                    },
                },
            },
        });

        // 3. Evaluation Logic (Option B: Exact-Day Targeting + Initial Catch-Up on Creation)
        // Credential matches if:
        // - Exact Milestone: daysRemaining === tier.days (e.g. Day 60, Day 30, Day 15)
        // OR
        // - Initial Catch-Up: Credential was created/modified inside a tier bracket (e.g. created with 45d for Tier 1, or 10d for Tier 3)
        //   and has NEVER received an alert for this tier bracket yet.
        interface MatchedCredential {
            cred: typeof activeCredentials[0];
            tier: number;
            tierDays: number;
            daysRemaining: number;
            isCatchUp: boolean;
        }

        const matchedCredentials: MatchedCredential[] = [];

        for (const cred of activeCredentials) {
            if (!cred.expiryDate) continue;
            const credExpiryUtc = toMidnightUtc(new Date(cred.expiryDate));
            const msDiff = credExpiryUtc.getTime() - todayUtc.getTime();
            const daysRemaining = Math.round(msDiff / (1000 * 60 * 60 * 24));

            // Skip credentials that are already expired (< 0 days)
            if (daysRemaining < 0) continue;

            // Determine which tier bracket this credential belongs to:
            // Tiers: Tier 1 (e.g. 60d), Tier 2 (e.g. 30d), Tier 3 (e.g. 15d)
            // - If daysRemaining > tier1Days: outside alert horizon, no alert yet.
            // - If tier2Days < daysRemaining <= tier1Days: Bracket is Tier 1 (e.g. 31 - 60 days)
            // - If tier3Days < daysRemaining <= tier2Days: Bracket is Tier 2 (e.g. 16 - 30 days)
            // - If 0 <= daysRemaining <= tier3Days: Bracket is Tier 3 (e.g. 0 - 15 days)
            let targetTier = null;
            if (daysRemaining <= tier3Days) {
                targetTier = tiers.find((t) => t.tier === 3);
            } else if (daysRemaining <= tier2Days) {
                targetTier = tiers.find((t) => t.tier === 2);
            } else if (daysRemaining <= tier1Days) {
                targetTier = tiers.find((t) => t.tier === 1);
            }

            if (!targetTier) continue; // Outside all tier brackets (> tier1Days)

            // Check if this credential has already been alerted for this tier
            const hasNotifiedThisTier = cred.expiryNotify?.some(
                (n) => n.notifyBeforeDays === targetTier.days && n.lastNotified !== null
            );

            // A credential matches if:
            // 1. Exact milestone: daysRemaining === targetTier.days
            // OR
            // 2. Initial Catch-Up: created inside this tier and has never received an alert for it
            // OR
            // 3. Force dispatch is enabled for on-demand admin manual runs
            const isExactMilestone = daysRemaining === targetTier.days;
            const isCatchUp = !hasNotifiedThisTier;
            const shouldMatch = isExactMilestone || isCatchUp || Boolean(options?.forceDispatch);

            if (shouldMatch) {
                matchedCredentials.push({
                    cred,
                    tier: targetTier.tier,
                    tierDays: targetTier.days,
                    daysRemaining,
                    isCatchUp: !isExactMilestone && isCatchUp,
                });
            }
        }

        const tiersSummary = tiers.map((t) => ({
            tier: t.tier,
            days: t.days,
            count: matchedCredentials.filter((m) => m.tier === t.tier).length,
        }));

        if (matchedCredentials.length === 0) {
            // Update last evaluation timestamp even if no credentials matched
            await prisma.systemSettings.updateMany({
                data: { lastAlertEvaluationAt: new Date() },
            });

            return {
                success: true,
                evaluatedCount: activeCredentials.length,
                matchingCount: 0,
                dispatchedDigestCount: 0,
                recipientsNotifiedCount: 0,
                tiersEvaluated: tiersSummary,
                details: [],
            };
        }

        // 4. Fetch all active users and their group mappings
        const users = await prisma.user.findMany({
            where: { status: 'ACTIVE' },
            include: {
                userGroups: {
                    include: { group: true },
                },
            },
        });

        // Dynamic base URL for deep links
        const { getBaseUrl } = await import('@/lib/utils/url');
        const baseUrl = options?.baseUrlOverride || await getBaseUrl();

        let totalDigestsDispatched = 0;
        const recipientsSet = new Set<string>();
        const executionDetails: AlertEvaluationResult['details'] = [];

        // Check today's date range for idempotency check in ExpiryAlertLog
        const startOfDayUtc = new Date(todayUtc);
        const endOfDayUtc = new Date(todayUtc);
        endOfDayUtc.setUTCDate(endOfDayUtc.getUTCDate() + 1);

        // 5. Evaluate and build digests per recipient
        for (const user of users) {
            // Determine user's persona and roles
            const groupNames = user.userGroups.map((ug) => ug.group.name);
            const isGlobalAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || groupNames.includes('Super Admin');
            const isScopeAdmin = !isGlobalAdmin && (groupNames.includes('Scoped Admin') || user.role === 'SCOPED_ADMIN');
            const isViewer = !isGlobalAdmin && !isScopeAdmin && (groupNames.includes('Viewer') || user.role === 'VIEWER');
            const isAuditor = !isGlobalAdmin && !isScopeAdmin && groupNames.includes('Auditor');

            // Auditors have NO_ACCESS to alert notifications as per RBAC
            if (isAuditor) continue;

            // Check Opt-Out toggle (muteExpiryAlerts)
            // Mandatory compliance: Global Admin and Scope Admin CANNOT opt out
            const isMuted = (user as any).muteExpiryAlerts === true;
            if (isMuted && !isGlobalAdmin && !isScopeAdmin) {
                // Standard User or Viewer who opted out -> skip
                continue;
            }

            // Retrieve Access Context for fine-grained permissions
            const ctx = await getUserAccessContext(user.id, user);

            // Determine if recipient has edit/update access to credentials
            const hasCredentialEditAccess = isGlobalAdmin || canAccess(ctx, 'FEATURE:CREDENTIALS', 'EDIT');
            const roleLabel = isGlobalAdmin 
                ? 'Global Admin' 
                : isScopeAdmin 
                    ? 'Scope Admin' 
                    : isViewer 
                        ? 'Viewer' 
                        : 'User';

            // Filter credentials for this user per tier (Zero Leakage Principle)
            for (const t of tiers) {
                const tierMatches = matchedCredentials.filter((m) => m.tier === t.tier);
                if (tierMatches.length === 0) continue;

                // Authorized credentials set for this user
                const authorizedItemsMap = new Map<string, MatchedCredential>();

                for (const item of tierMatches) {
                    const c = item.cred;

                    // Personal credentials rule: ONLY visible to creator
                    if (c.isPersonal) {
                        if (c.createdById === user.id) {
                            authorizedItemsMap.set(c.id, item);
                        }
                        continue;
                    }

                    // Shared credentials rule:
                    if (isGlobalAdmin) {
                        // Global Admin sees all shared expiring credentials
                        authorizedItemsMap.set(c.id, item);
                    } else if (isScopeAdmin) {
                        // Scope Admin sees credentials within assigned Category & Environment
                        const cats = ctx.allowedCategories || [];
                        const envs = ctx.allowedEnvironments || [];
                        const catMatch = cats.includes('*') || (c.category && cats.includes(c.category));
                        const envMatch = envs.includes('*') || (c.environment && envs.includes(c.environment));
                        if (catMatch && envMatch) {
                            authorizedItemsMap.set(c.id, item);
                        }
                    } else {
                        // Standard User (Editor) or Viewer
                        // Check if creator (they always have access to items they created)
                        if (c.createdById === user.id) {
                            authorizedItemsMap.set(c.id, item);
                            continue;
                        }

                        // Check direct allowed IDs (granular sharing)
                        if (ctx.allowedCredentialIds.includes(c.id)) {
                            authorizedItemsMap.set(c.id, item);
                            continue;
                        }

                        // Check Scoped Category + Environment match
                        const cats = ctx.allowedCategories || [];
                        const envs = ctx.allowedEnvironments || [];
                        const catMatch = cats.includes('*') || (c.category && cats.includes(c.category));
                        const envMatch = envs.includes('*') || (c.environment && envs.includes(c.environment));

                        if (catMatch && envMatch) {
                            authorizedItemsMap.set(c.id, item);
                        }
                    }
                }

                const authorizedItems = Array.from(authorizedItemsMap.values());
                if (authorizedItems.length === 0) continue;

                // Idempotency check: Skip if already dispatched to this user for this tier today
                if (!options?.forceDispatch) {
                    const existingLog = await (prisma as any).expiryAlertLog.findFirst({
                        where: {
                            recipientEmail: user.email,
                            tier: t.tier,
                            sentAt: {
                                gte: startOfDayUtc,
                                lt: endOfDayUtc,
                            },
                        },
                    });

                    if (existingLog) {
                        executionDetails.push({
                            recipientEmail: user.email,
                            recipientRole: roleLabel,
                            tier: t.tier,
                            tierDays: t.days,
                            credentialsCount: authorizedItems.length,
                            status: 'SKIPPED_ALREADY_SENT_TODAY',
                        });
                        continue;
                    }
                }

                // Format credential items for email digest
                const credentialItems: ExpiryCredentialItem[] = authorizedItems.map((item) => {
                    const c = item.cred;
                    const targetPath = `/credentials/${c.id}`;

                    return {
                        id: c.id,
                        name: c.name,
                        type: c.type,
                        category: c.category,
                        environment: c.environment,
                        expiryDate: c.expiryDate ? formatDisplayDate(new Date(c.expiryDate)) : 'N/A',
                        daysRemaining: item.daysRemaining,
                        actionUrl: `${baseUrl}${targetPath}`,
                    };
                });

                // Dispatch personalized email digest
                let dispatchStatus = 'SENT';
                let dispatchError: string | null = null;

                try {
                    await sendExpiryAlertDigestEmail({
                        recipientEmail: user.email,
                        recipientName: user.name || 'Valued User',
                        recipientRole: roleLabel,
                        tier: t.tier,
                        tierDays: t.days,
                        credentials: credentialItems,
                        canEdit: hasCredentialEditAccess,
                    });
                    totalDigestsDispatched++;
                    recipientsSet.add(user.email);
                } catch (sendErr: any) {
                    console.error(`[AlertEngine] Failed to dispatch Tier ${t.tier} digest to ${user.email}:`, sendErr);
                    dispatchStatus = 'FAILED';
                    dispatchError = String(sendErr?.message || sendErr);
                }

                // Record in ExpiryAlertLog
                try {
                    await (prisma as any).expiryAlertLog.create({
                        data: {
                            tier: t.tier,
                            daysRemaining: t.days,
                            recipientEmail: user.email,
                            recipientRole: roleLabel,
                            credentialCount: credentialItems.length,
                            credentialIds: authorizedItems.map((item) => item.cred.id).join(','),
                            status: dispatchStatus,
                            errorMessage: dispatchError,
                            sentAt: new Date(),
                        },
                    });
                } catch (logErr) {
                    console.error('[AlertEngine] Failed to log alert in ExpiryAlertLog:', logErr);
                }

                // Upsert ExpiryNotification records for each credential
                if (dispatchStatus === 'SENT') {
                    for (const item of authorizedItems) {
                        const c = item.cred;
                        try {
                            const existingNotif = await prisma.expiryNotification.findFirst({
                                where: { credentialId: c.id, notifyBeforeDays: t.days },
                            });
                            if (existingNotif) {
                                await prisma.expiryNotification.update({
                                    where: { id: existingNotif.id },
                                    data: { lastNotified: new Date() },
                                });
                            } else {
                                await prisma.expiryNotification.create({
                                    data: {
                                        credentialId: c.id,
                                        notifyBeforeDays: t.days,
                                        lastNotified: new Date(),
                                    },
                                });
                            }
                        } catch (notifErr) {
                            // Non-fatal
                        }
                    }
                }

                executionDetails.push({
                    recipientEmail: user.email,
                    recipientRole: roleLabel,
                    tier: t.tier,
                    tierDays: t.days,
                    credentialsCount: credentialItems.length,
                    status: dispatchStatus,
                });
            }
        }

        // Update last evaluation timestamp in SystemSettings
        await prisma.systemSettings.updateMany({
            data: { lastAlertEvaluationAt: new Date() },
        });

        return {
            success: true,
            evaluatedCount: activeCredentials.length,
            matchingCount: matchedCredentials.length,
            dispatchedDigestCount: totalDigestsDispatched,
            recipientsNotifiedCount: recipientsSet.size,
            tiersEvaluated: tiersSummary,
            details: executionDetails,
        };
    } catch (error: any) {
        console.error('[AlertEngine] Evaluation error:', error);
        return {
            success: false,
            error: error?.message || 'Unknown alert evaluation error',
            evaluatedCount: 0,
            matchingCount: 0,
            dispatchedDigestCount: 0,
            recipientsNotifiedCount: 0,
            tiersEvaluated: [],
            details: [],
        };
    }
}
