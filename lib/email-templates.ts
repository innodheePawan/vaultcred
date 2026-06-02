/**
 * Branded HTML email templates for CredSecure.
 * Uses inline styles for maximum email client compatibility.
 */

interface InviteTemplateProps {
    appName: string;
    logoUrl: string | null;
    inviterName: string;
    activationLink: string;
    email: string;
}

interface PasswordResetTemplateProps {
    appName: string;
    logoUrl: string | null;
    resetLink: string;
    email: string;
}

function getLogoHtml(logoUrl: string | null, appName: string): string {
    if (logoUrl && !logoUrl.startsWith('data:')) {
        return `<img src="${logoUrl}" alt="${appName}" style="max-height: 48px; max-width: 200px;" />`;
    }
    return `<h1 style="color: #4F46E5; margin: 0; font-size: 24px;">${appName}</h1>`;
}

function getBaseStyles(): string {
    return `
        body { margin: 0; padding: 0; background-color: #F3F4F6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background-color: #FFFFFF; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; }
        .btn { display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: #FFFFFF; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .btn:hover { background-color: #4338CA; }
        .footer { text-align: center; padding-top: 24px; border-top: 1px solid #E5E7EB; margin-top: 24px; color: #9CA3AF; font-size: 12px; }
        .muted { color: #6B7280; font-size: 14px; }
    `;
}

export function getInviteEmailTemplate(props: InviteTemplateProps): string {
    const { appName, logoUrl, inviterName, activationLink, email } = props;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                ${getLogoHtml(logoUrl, appName)}
            </div>
            
            <h2 style="color: #111827; margin-top: 0;">You've been invited!</h2>
            
            <p style="color: #374151; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${appName}</strong>.
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
                Click the button below to set up your account and get started.
                Your email <strong>${email}</strong> has been pre-verified.
            </p>
            
            <div style="text-align: center; padding: 24px 0;">
                <a href="${activationLink}" class="btn" style="color: #0d5df5; background-color: #0edd08b5;">Accept Invitation</a>
            </div>
            
            <p class="muted">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 13px;">
                ${activationLink}
            </p>
            
            <div class="footer">
                <p>This invitation expires in 72 hours.</p>
                <p>If you didn't expect this invitation, you can safely ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

export function getPasswordResetEmailTemplate(props: PasswordResetTemplateProps): string {
    const { appName, logoUrl, resetLink, email } = props;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                ${getLogoHtml(logoUrl, appName)}
            </div>
            
            <h2 style="color: #111827; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #374151; line-height: 1.6;">
                We received a request to reset the password for the account associated with
                <strong>${email}</strong>.
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
                Click the button below to set a new password.
                If you have Two-Factor Authentication enabled, you will need your authenticator app.
            </p>
            
            <div style="text-align: center; padding: 24px 0;">
                <a href="${resetLink}" class="btn">Reset Password</a>
            </div>
            
            <p class="muted">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 13px;">
                ${resetLink}
            </p>
            
            <div style="text-align: left; background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                    ⚠️ <strong>Security Notice:</strong> This link expires in 1 hour and can only be used once.
                    If you did not request a password reset, please ignore this email or contact your administrator.
                </p>
            </div>
            
            <div class="footer">
                <p>This link expires in 1 hour.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

interface TwoFactorReconfigureTemplateProps {
    appName: string;
    logoUrl: string | null;
    reconfigureLink: string;
    email: string;
}

export function getTwoFactorReconfigureEmailTemplate(props: TwoFactorReconfigureTemplateProps): string {
    const { appName, logoUrl, reconfigureLink, email } = props;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                ${getLogoHtml(logoUrl, appName)}
            </div>
            
            <h2 style="color: #111827; margin-top: 0;">2FA Reconfiguration Request</h2>
            
            <p style="color: #374151; line-height: 1.6;">
                We received a request to reconfigure Two-Factor Authentication for your account associated with
                <strong>${email}</strong>.
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
                Click the button below to reset your current 2FA settings and set up a new authenticator device.
            </p>
            
            <div style="text-align: center; padding: 24px 0;">
                <a href="${reconfigureLink}" class="btn">Reconfigure 2FA</a>
            </div>
            
            <p class="muted">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 13px;">
                ${reconfigureLink}
            </p>
            
            <div style="text-align: left; background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                    ⚠️ <strong>Security Notice:</strong> Using this link will immediately disable your current 2FA setup once verified. 
                    This link expires in 30 minutes and can only be used once.
                </p>
            </div>
            
            <div class="footer">
                <p>This link expires in 30 minutes.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

interface OneTimeSecretTemplateProps {
    appName: string;
    logoUrl: string | null;
    secretLink: string;
    email: string; // Recipient
    senderName?: string;
    message?: string;
    expiresAt: string;
    viewLimit: number;
}

export function getOneTimeSecretEmailTemplate(props: OneTimeSecretTemplateProps): string {
    const { appName, logoUrl, secretLink, email, senderName, message, expiresAt, viewLimit } = props;

    const senderDisplay = senderName ? `<strong>${senderName}</strong>` : 'A user';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                ${getLogoHtml(logoUrl, appName)}
            </div>
            
            <h2 style="color: #111827; margin-top: 0;">Secure Secret Shared</h2>
            
            <p style="color: #374151; line-height: 1.6;">
                ${senderDisplay} has shared a secure One-Time Secret with you.
            </p>

            ${message ? `
            <div style="background-color: #F3F4F6; padding: 16px; border-radius: 8px; margin: 16px 0; font-style: italic; color: #4B5563;">
                "${message}"
            </div>
            ` : ''}
            
            <p style="color: #374151; line-height: 1.6;">
                Click the button below to view the secret. 
            </p>
            
            <div style="text-align: center; padding: 24px 0;">
                <a href="${secretLink}" class="btn">View Secret</a>
            </div>
            
            <p class="muted">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #4F46E5; font-size: 13px;">
                ${secretLink}
            </p>
            
            <div style="text-align: left; background-color: #FEF3C7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="color: #92400E; margin: 0; font-size: 14px;">
                    ⚠️ <strong>Security Notice:</strong> 
                    This link will expire on <strong>${expiresAt}</strong> or after <strong>${viewLimit} view(s)</strong>, whichever comes first.
                </p>
            </div>
            
            <div class="footer">
                <p>This is an automated message. Please do not reply.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

interface DemoRequestConfirmationTemplateProps {
    appName: string;
    logoUrl: string | null;
    name: string;
    useCase: string;
}

export function getDemoRequestConfirmationEmailTemplate(props: DemoRequestConfirmationTemplateProps): string {
    const { appName, logoUrl, name, useCase } = props;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                ${getLogoHtml(logoUrl, appName)}
            </div>
            
            <h2 style="color: #111827; margin-top: 0;">Demo Request Received</h2>
            
            <p style="color: #374151; line-height: 1.6;">
                Hi <strong>${name}</strong>,
            </p>
            
            <p style="color: #374151; line-height: 1.6;">
                Thank you for your interest in <strong>${appName}</strong>. We have received your request for a personalized product demo.
            </p>
            
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="margin: 0 0 8px 0; color: #4B5563; font-size: 14px;"><strong>Selected Use Case:</strong></p>
                <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${useCase}</p>
            </div>
            
            <p style="color: #374151; line-height: 1.6;">
                A member of our product engineering and solutions team will reach out to you within 2 business days to schedule a session tailored to your operational environment.
            </p>
            
            <div class="footer">
                <p>This is an automated confirmation of your request.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

interface DemoRequestAdminNotificationTemplateProps {
    appName: string;
    logoUrl: string | null;
    name: string;
    email: string;
    company: string;
    role: string;
    useCase: string;
}

export function getDemoRequestAdminNotificationEmailTemplate(props: DemoRequestAdminNotificationTemplateProps): string {
    const { appName, logoUrl, name, email, company, role, useCase } = props;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>${getBaseStyles()}</style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                ${getLogoHtml(logoUrl, appName)}
            </div>
            
            <h2 style="color: #4F46E5; margin-top: 0;">New Demo Request</h2>
            
            <p style="color: #374151; line-height: 1.6;">
                A new request for a product demo has been submitted.
            </p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 14px; width: 120px;">Name</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #111827; font-size: 14px; font-weight: 500;">${name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #111827; font-size: 14px; font-weight: 500;">
                        <a href="mailto:${email}" style="color: #4F46E5; text-decoration: none;">${email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">Company</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #111827; font-size: 14px; font-weight: 500;">${company}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">Role</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #111827; font-size: 14px; font-weight: 500;">${role}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 14px;">Use Case</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; color: #111827; font-size: 14px; font-weight: 500;">${useCase}</td>
                </tr>
            </table>
            
            <div style="text-align: center; padding-top: 16px;">
                <a href="mailto:${email}?subject=CredSecure Demo Inquiry" class="btn" style="color: #ffffff;">Reply to Lead</a>
            </div>
            
            <div class="footer">
                <p>This is an automated notification from ${appName}.</p>
                <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim();
}

