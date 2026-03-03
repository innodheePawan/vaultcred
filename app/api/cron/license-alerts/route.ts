import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLicenseState } from '@/lib/license-enforcement';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Basic Cron Security: Require an Authorization header matching a cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Return 401 Unauthorized if missing or incorrect
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const licenseInfo = await getLicenseState();

        if (licenseInfo.state === 'UNACTIVATED' || !licenseInfo.validityTill) {
            return NextResponse.json({ message: 'No active license to monitor.' });
        }

        // Derive license version deterministically from signature or payload hash
        const licenseVersion = crypto.createHash('sha256').update(licenseInfo.rawPayload || 'unknown').digest('hex');

        const nowUtc = new Date();
        // Zero out the time to only compare pure days
        const todayUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));

        const validityDate = new Date(licenseInfo.validityTill);
        const validityUtc = new Date(Date.UTC(validityDate.getUTCFullYear(), validityDate.getUTCMonth(), validityDate.getUTCDate()));

        const graceEndDate = licenseInfo.graceEnd ? new Date(licenseInfo.graceEnd) : validityUtc;
        const graceEndUtc = new Date(Date.UTC(graceEndDate.getUTCFullYear(), graceEndDate.getUTCMonth(), Math.max(graceEndDate.getUTCDate(), validityUtc.getUTCDate())));

        const isGracePhase = todayUtc > validityUtc;

        let milestoneString: string | null = null;
        let daysRefName = '';
        let emailSubject = '';
        let emailHeadline = '';
        let emailBody = '';

        if (!isGracePhase) {
            // Phase 1: Before Expiry
            const msDiff = validityUtc.getTime() - todayUtc.getTime();
            const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

            const exactMilestones = [60, 30, 15, 7, 3, 1, 0];

            if (exactMilestones.includes(daysRemaining)) {
                milestoneString = `EXPIRY_${daysRemaining}_DAYS`;
                daysRefName = `days until your license expires`;

                if (daysRemaining === 0) {
                    emailSubject = `ACTION REQUIRED: License Expiring Today`;
                    emailHeadline = `Your CRED Secure license expires today!`;
                } else if (daysRemaining <= 7) {
                    emailSubject = `URGENT: License Expiring in ${daysRemaining} Days`;
                    emailHeadline = `Renew your CRED Secure license immediately`;
                } else {
                    emailSubject = `NOTICE: License Expiring in ${daysRemaining} Days`;
                    emailHeadline = `Your CRED Secure license will expire soon`;
                }
            }
        } else {
            // Phase 2: During Grace
            const msDiff = graceEndUtc.getTime() - todayUtc.getTime();
            const daysRemainingGrace = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

            const graceMilestones = [3, 1, 0]; // 3 days before, 1 day before, 0 (lock day)
            // If they are inside the grace period, but not triggering an exact milestone, we might skip
            // The BRD states: "Trigger at 3 days before grace end, 1 day before grace end, 0 lock day"

            if (graceMilestones.includes(daysRemainingGrace)) {
                milestoneString = `GRACE_END_${daysRemainingGrace}_DAYS`;
                daysRefName = `days until your grace period ends and the system locks`;

                if (daysRemainingGrace === 0) {
                    emailSubject = `CRITICAL: System Locked - Grace Period Ended`;
                    emailHeadline = `Your CRED Secure license grace period has officially ended. The system is now locked.`;
                } else {
                    emailSubject = `CRITICAL: Grace Period Ending in ${daysRemainingGrace} Days`;
                    emailHeadline = `Your CRED Secure license grace period is running out`;
                }
            }
        }

        if (!milestoneString) {
            return NextResponse.json({ message: 'No alert milestone reached today.' });
        }

        // Check if we already sent this exact milestone for this specific license
        const existingLog = await prisma.licenseAlertLog.findUnique({
            where: {
                milestoneType_licenseVersion: {
                    milestoneType: milestoneString,
                    licenseVersion: licenseVersion
                }
            }
        });

        if (existingLog) {
            return NextResponse.json({ message: `Alert ${milestoneString} was already sent for this license versoin.` });
        }

        // Fetch superusers
        const superUsers = await prisma.user.findMany({
            where: { role: 'ADMIN', status: 'ACTIVE' },
            select: { email: true, name: true }
        });

        if (superUsers.length === 0) {
            // No active SUPERUSER found to receive license alerts
            // We should still record the milestone so we don't spam errors every day
        } else {
            // Prepare email content
            emailBody = `<p><strong>License Status Overview:</strong></p>
                <ul>
                    <li><strong>Expiry Date (UTC):</strong> ${validityUtc.toUTCString()}</li>
                    <li><strong>Grace End Date (UTC):</strong> ${graceEndUtc.toUTCString()}</li>
                    <li><strong>Licensed Users:</strong> ${licenseInfo.activeUsers}</li>
                </ul>
                <p>Please contact your provider to renew your license to ensure uninterrupted access.</p>
            `;

            // Send emails concurrently
            const emailPromises = superUsers.map(async (u) => {
                try {
                    const finalHtml = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #4F46E5;">${emailHeadline}</h2>
                            <p>Hello ${u.name || 'Administrator'},</p>
                            ${emailBody}
                            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
                            <a href="${process.env.NEXTAUTH_URL}/activation" style="background-color: #4F46E5; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Renew License</a>
                        </div>
                    `;

                    await sendEmail(u.email, emailSubject, finalHtml);
                } catch (emailErr) {

                    // Crucial: Throw to prevent DB logging, allowing idempotency retry
                    throw emailErr;
                }
            });

            // Wait for all emails, but don't crash entirely if ONE fails.
            // Wait, BRD: "If SMTP fails: log error, retry next cron run, do not block the cron execution."
            // If we throw, the row isn't saved. It retries tomorrow.
            // Let's use Promise.all to ensure at least they try. If it throws, we exit and DON'T save the log.
            await Promise.all(emailPromises);
        }

        // Create alert log (Idempotent mark)
        await prisma.licenseAlertLog.create({
            data: {
                milestoneType: milestoneString,
                licenseVersion: licenseVersion
            }
        });

        return NextResponse.json({ success: true, message: `Dispatched ${milestoneString} alerts to ${superUsers.length} admins.` });

    } catch (error: any) {
        // License Alert Engine Failed
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
