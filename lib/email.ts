'use server';

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getInviteEmailTemplate, getPasswordResetEmailTemplate, getTwoFactorReconfigureEmailTemplate, getOneTimeSecretEmailTemplate, getDemoRequestConfirmationEmailTemplate, getDemoRequestAdminNotificationEmailTemplate, getContactUsConfirmationEmailTemplate, getContactUsAdminNotificationEmailTemplate } from '@/lib/email-templates';

/**
 * Sends an invite activation email.
 */
// ... existing sendInviteEmail ...

/**
 * Sends a password reset email.
 */
// ... existing sendPasswordResetEmail ...

/**
 * Sends a 2FA reconfiguration email.
 */
export async function sendTwoFactorReconfigureEmail(email: string, token: string) {
    const baseUrl = await getBaseUrl();
    const reconfigureLink = `${baseUrl}/reconfigure-2fa/${token}`;

    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CredSecure';
    const logoUrl = settings?.logoUrl || null;

    const html = getTwoFactorReconfigureEmailTemplate({
        appName,
        logoUrl,
        reconfigureLink,
        email,
    });

    return sendEmail(email, `${appName} - 2FA Reconfiguration`, html);
}

/**
 * Gets the SMTP transporter from SystemSettings.
 * Falls back to Ethereal (dev-only fake SMTP) if no config is set.
 */
export async function isSmtpConfigured() {
    const settings = await prisma.systemSettings.findFirst();
    return !!(settings?.smtpHost && settings?.smtpUser && settings?.smtpPass);
}

async function getTransporter() {
    const settings = await prisma.systemSettings.findFirst();

    const smtpHost = (settings as any)?.smtpHost;
    const smtpPort = (settings as any)?.smtpPort;
    const smtpUser = (settings as any)?.smtpUser;
    const smtpPassEncrypted = (settings as any)?.smtpPass;
    const smtpSecure = (settings as any)?.smtpSecure ?? true;

    const smtpFromEmail = (settings as any)?.smtpFromEmail;

    // smtpFromEmail value is fetched for use in sendEmail

    if (smtpHost && smtpUser && smtpPassEncrypted) {
        // Production SMTP from SystemSettings
        let smtpPass: string;
        try {
            smtpPass = decrypt(smtpPassEncrypted);
        } catch {
            smtpPass = smtpPassEncrypted;
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort || 587,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass,
            },
            // tls: { ciphers: 'SSLv3' }, // Removed: AWS/Modern SMTP req TLS 1.2+
            family: 4, // Force IPv4 to avoid ENETUNREACH errors
        } as any);

        return { transporter, type: 'SMTP' };
    }

    // Fallback: Ethereal test account (dev only)
    // No SMTP configured in SystemSettings. Using Ethereal test account.
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    return { transporter, type: 'Ethereal (Fake)' };
}

/**
 * Verifies SMTP configuration without saving it.
 * Used for "Test Connection" feature.
 */
export async function verifyConnection(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
}, testEmail?: string, fromEmail?: string) {
    try {
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.pass,
            },
            // tls: { ciphers: 'SSLv3' }, // Removed: AWS/Modern SMTP req TLS 1.2+
            family: 4, // Force IPv4
        } as any);

        await transporter.verify();

        if (testEmail) {
            const senderName = "CredSecure Test";
            const senderEmail = fromEmail || config.user;
            await transporter.sendMail({
                from: `"${senderName}" <${senderEmail}>`, // Format as "Name <email>"
                to: testEmail,
                replyTo: senderEmail,
                subject: 'CredSecure - SMTP Test',
                html: '<h1>SMTP Configuration Status</h1><p>Your SMTP settings are valid. This is a test email.</p>',
            });
        }

        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get the from address from settings or fallback.
 */
async function getFromAddress(): Promise<string> {
    const settings = await prisma.systemSettings.findFirst();
    const fromEmail = (settings as any)?.smtpFromEmail;
    const appName = settings?.applicationName || 'CredSecure';

    if (fromEmail) {
        return `"${appName}" <${fromEmail}>`;
    }
    return `"${appName}" <no-reply@getcredsecure.com>`;
}

import { headers } from 'next/headers';

/**
 * Get the base URL for link generation.
 */
async function getBaseUrl(): Promise<string> {
    const { getBaseUrl: getDynamicBaseUrl } = await import('@/lib/utils/url');
    return getDynamicBaseUrl();
}

/**
 * Sends a generic email. Returns info about sent email.
 */
export async function sendEmail(to: string, subject: string, html: string, options?: { replyTo?: string }) {
    const { transporter, type } = await getTransporter();
    const from = await getFromAddress();

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
        replyTo: options?.replyTo || 'customer-support@getcredsecure.com',
    });

    // Email sent successfully

    return {
        messageId: info.messageId,
        previewUrl: null,
        provider: type
    };
}

/**
 * Sends an invite activation email.
 */
export async function sendInviteEmail(
    email: string,
    token: string,
    inviterName: string
) {
    const baseUrl = await getBaseUrl();
    const activationLink = `${baseUrl}/invite/${token}`;

    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CredSecure';
    const logoUrl = settings?.logoUrl || null;

    const html = getInviteEmailTemplate({
        appName,
        logoUrl,
        inviterName,
        activationLink,
        email,
    });

    return sendEmail(email, `You've been invited to ${appName}`, html);
}

/**
 * Sends a password reset email.
 */
export async function sendPasswordResetEmail(email: string, token: string) {
    const baseUrl = await getBaseUrl();
    const resetLink = `${baseUrl}/reset-password/${token}`;

    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CredSecure';
    const logoUrl = settings?.logoUrl || null;

    const html = getPasswordResetEmailTemplate({
        appName,
        logoUrl,
        resetLink,
        email,
    });

    return sendEmail(email, `Reset your ${appName} password`, html);
}

/**
 * Sends a test email to verify SMTP configuration.
 */
export async function sendTestEmail(toEmail: string) {
    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CredSecure';

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #4F46E5;">✅ SMTP Configuration Test</h2>
            <p>This is a test email from <strong>${appName}</strong>.</p>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #6B7280; font-size: 12px;">
                Sent at ${new Date().toISOString()}
            </p>
        </div>
    `;

    return sendEmail(toEmail, `[${appName}] SMTP Test — Configuration Verified`, html);
}

/**
 * Sends a One-Time Secret email.
 */
export async function sendOneTimeSecretEmail(
    email: string,
    token: string,
    senderName: string,
    message: string | undefined,
    expiresAt: Date,
    viewLimit: number
) {
    const baseUrl = await getBaseUrl();
    const secretLink = `${baseUrl}/share/${token}`;

    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CredSecure';
    const logoUrl = settings?.logoUrl || null;

    // formatting date
    const formattedDate = expiresAt.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    const html = getOneTimeSecretEmailTemplate({
        appName,
        logoUrl,
        secretLink,
        email,
        senderName,
        message,
        expiresAt: formattedDate,
        viewLimit
    });

    return sendEmail(email, `${senderName} shared a secure secret with you`, html);
}

/**
 * Sends a demo request confirmation email to the user and a lead notification to the admin.
 */
export async function sendDemoRequestEmails(data: {
    name: string;
    email: string;
    company: string;
    role: string;
    useCase: string;
}) {
    const { name, email, company, role, useCase } = data;

    if (!name || !email || !company || !role || !useCase) {
        return { success: false, error: 'All fields are required.' };
    }

    try {
        const settings = await prisma.systemSettings.findFirst();
        const appName = settings?.applicationName || 'CredSecure';
        const logoUrl = settings?.logoUrl || null;
        const adminEmail = settings?.smtpFromEmail;

        // 1. Send confirmation email to the user requesting the demo
        const confirmationHtml = getDemoRequestConfirmationEmailTemplate({
            appName,
            logoUrl,
            name,
            useCase,
        });
        await sendEmail(email, `Demo Request Received - ${appName}`, confirmationHtml);

        // 2. Send notification email to the admin/sales address if configured
        if (adminEmail) {
            const adminHtml = getDemoRequestAdminNotificationEmailTemplate({
                appName,
                logoUrl,
                name,
                email,
                company,
                role,
                useCase,
            });
            await sendEmail(adminEmail, `[New Lead] Demo Request - ${name} (${company})`, adminHtml, { replyTo: email });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending demo request emails:', error);
        return { success: false, error: error.message || 'Failed to send demo request.' };
    }
}

/**
 * Sends a contact us confirmation email to the user and notification to admin.
 */
export async function sendContactUsEmails(data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    subject: string;
    message: string;
}) {
    const { name, email, phone, company, subject, message } = data;

    if (!name || !email || !subject || !message) {
        return { success: false, error: 'Name, email, topic, and message are required.' };
    }

    try {
        const settings = await prisma.systemSettings.findFirst();
        const appName = settings?.applicationName || 'CredSecure';
        const logoUrl = settings?.logoUrl || null;
        const adminEmail = settings?.smtpFromEmail || 'customer-support@getcredsecure.com';

        // 1. Send confirmation email to user
        const confirmationHtml = getContactUsConfirmationEmailTemplate({
            appName,
            logoUrl,
            name,
            subject,
        });
        await sendEmail(email, `We received your message - ${appName}`, confirmationHtml);

        // 2. Send notification to admin/support
        if (adminEmail) {
            const adminHtml = getContactUsAdminNotificationEmailTemplate({
                appName,
                logoUrl,
                name,
                email,
                phone,
                company,
                subject,
                message,
            });
            await sendEmail(adminEmail, `[Contact Us] ${subject} - ${name}`, adminHtml, { replyTo: email });
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error sending contact us emails:', error);
        return { success: false, error: error.message || 'Failed to send message.' };
    }
}


