/**
 * Branded HTML email templates for CRED Secure.
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
