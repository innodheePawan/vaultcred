'use server';

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import { getInviteEmailTemplate, getPasswordResetEmailTemplate } from '@/lib/email-templates';

/**
 * Gets the SMTP transporter from SystemSettings.
 * Falls back to Ethereal (dev-only fake SMTP) if no config is set.
 */
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
    console.warn('[Email] No SMTP configured in SystemSettings. Using Ethereal test account.');
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
            const senderName = "CRED Secure Test";
            const senderEmail = fromEmail || config.user;
            await transporter.sendMail({
                from: `"${senderName}" <${senderEmail}>`, // Format as "Name <email>"
                to: testEmail,
                replyTo: senderEmail,
                subject: 'CRED Secure - SMTP Test',
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
    const appName = settings?.applicationName || 'CRED Secure';

    if (fromEmail) {
        return `"${appName}" <${fromEmail}>`;
    }
    return `"${appName}" <noreply@credsecure.local>`;
}

/**
 * Get the base URL for link generation.
 */
function getBaseUrl(): string {
    // Use NEXTAUTH_URL or APP_URL env vars, fallback to localhost
    return process.env.NEXTAUTH_URL || process.env.APP_URL || 'http://localhost:3000';
}

/**
 * Sends a generic email. Returns info about sent email.
 */
export async function sendEmail(to: string, subject: string, html: string) {
    const { transporter, type } = await getTransporter();
    const from = await getFromAddress();

    const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
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
    const baseUrl = getBaseUrl();
    const activationLink = `${baseUrl}/invite/${token}`;

    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CRED Secure';
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
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password/${token}`;

    const settings = await prisma.systemSettings.findFirst();
    const appName = settings?.applicationName || 'CRED Secure';
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
    const appName = settings?.applicationName || 'CRED Secure';

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
