'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logAudit } from './audit';

export async function getSystemSettings() {
    try {
        // Safe check for prisma instance
        if (!prisma) return { applicationName: 'VaultSecure', logoUrl: null };

        let settings = await prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { applicationName: 'VaultSecure' }
            });
        }
        return settings;
    } catch (error) {
        // Log the specific error to help with debugging (e.g. 500 error cause)
        console.error("Failed to fetch system settings (DB Error):", error);
        return { applicationName: 'VaultSecure', logoUrl: null };
    }
}

export async function getDatabaseInfo() {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return { configured: false };
    }

    try {
        // Parse: mysql://user:pass@host:port/db
        const url = new URL(dbUrl);
        return {
            configured: true,
            type: url.protocol.replace(':', ''),
            host: url.hostname,
            port: url.port,
            user: url.username,
            database: url.pathname.replace('/', ''),
        };
    } catch (e) {
        return { configured: false, error: 'Invalid Connection String' };
    }
}

export async function updateSystemSettings(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
        return { error: 'Unauthorized: Only Admins can modify system settings.' };
    }

    const applicationName = formData.get('applicationName') as string;
    const companyName = formData.get('companyName') as string;
    const logoFile = formData.get('logo') as File | null;
    let logoUrl = formData.get('existingLogoUrl') as string | null;
    const removeLogo = formData.get('removeLogo') === 'true';

    // Parse dimensions
    const logoWidthRaw = formData.get('logoWidth');
    const logoHeightRaw = formData.get('logoHeight');
    const logoWidth = logoWidthRaw ? parseInt(logoWidthRaw.toString()) : null;
    const logoHeight = logoHeightRaw ? parseInt(logoHeightRaw.toString()) : null;

    // Checkbox: "true" if checked (controlled), or check presence.
    // We will ensure Frontend sends "true" or "false".
    const auditPersonalCredentials = formData.get('auditPersonalCredentials') === 'true';

    if (!applicationName) {
        return { error: 'Application Name is required.' };
    }
    if (!companyName) {
        return { error: 'Company Name is required.' };
    }

    try {
        if (removeLogo) {
            logoUrl = null;
        } else if (logoFile && logoFile.size > 0) {
            // Handle Logo Upload
            // For simplicity in this demo environment, we'll convert to Base64.
            // In production, upload to S3/Blob and store URL.
            // Limit size to avoid DB bloat (e.g. 500KB)
            if (logoFile.size > 500 * 1024) {
                return { error: 'Logo file too large. Max 500KB.' };
            }

            const buffer = await logoFile.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = logoFile.type;
            logoUrl = `data:${mimeType};base64,${base64}`;
        }

        // Fetch current settings BEFORE update to compare changes
        const currentSettings = await prisma.systemSettings.findFirst();

        // Upsert settings (ID 1)
        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                applicationName: applicationName,
                companyName: companyName,
                logoUrl: logoUrl,
                auditPersonalCredentials: auditPersonalCredentials,
                updatedBy: session.user.id,
            },
            create: {
                id: 1,
                applicationName: applicationName,
                companyName: companyName,
                logoUrl: logoUrl,
                auditPersonalCredentials: auditPersonalCredentials,
                updatedBy: session.user.id,
            }
        });

        // Detect Changes for Audit Log
        const changes: string[] = [];

        if (currentSettings) {
            if (currentSettings.applicationName !== applicationName) {
                changes.push(`App Name changed from '${currentSettings.applicationName}' to '${applicationName}'`);
            }
            if (currentSettings.companyName !== companyName) {
                changes.push(`Company changed from '${currentSettings.companyName}' to '${companyName}'`);
            }
            // Check usage of boolean vs update
            if (currentSettings.auditPersonalCredentials !== auditPersonalCredentials) {
                changes.push(`Audit Policy changed from ${currentSettings.auditPersonalCredentials} to ${auditPersonalCredentials}`);
            }

            // Logo Logic
            // If new logoUrl is different from old
            if (currentSettings.logoUrl !== logoUrl) {
                if (!logoUrl && currentSettings.logoUrl) changes.push('Logo was removed');
                else if (logoUrl && !currentSettings.logoUrl) changes.push('Logo was added');
                else if (logoUrl && currentSettings.logoUrl && logoUrl !== currentSettings.logoUrl) changes.push('Logo was updated');
            }
        } else {
            changes.push('Initial Settings Configured');
        }

        const auditDetails = changes.length > 0 ? changes.join('; ') : 'No changes detected';

        if (changes.length > 0) {
            await logAudit({
                action: 'UPDATE_SETTINGS',
                details: auditDetails,
                userId: session.user.id
            });
        }

        // Revalidate layout to update Header
        revalidatePath('/', 'layout');
        revalidatePath('/settings');

        return { success: true, message: 'Settings updated successfully!' };

    } catch (error: any) {
        console.error("Failed to update settings:", error);
        return { error: error.message || 'Failed to update settings.' };
    }
}
