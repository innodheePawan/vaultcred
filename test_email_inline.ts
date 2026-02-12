
import dotenv from 'dotenv';
dotenv.config();

import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { createDecipheriv } from 'crypto';

const prisma = new PrismaClient();

// --- Crypto Inline ---
const ALGORITHM = 'aes-256-gcm';

function getMasterKey(): Buffer {
    const keyHex = process.env.MASTER_KEY;
    if (!keyHex) throw new Error('MASTER_KEY environment variable is not set.');
    // Check length
    return Buffer.from(keyHex, 'hex');
}

function decrypt(text: string): string {
    const val = getMasterKey();
    const [ivHex, authTagHex, encryptedHex] = text.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) throw new Error('Invalid encrypted text format.');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, val, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// --- Email Logic Inline ---
async function main() {
    console.log('Starting Email Test...');
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (!settings) throw new Error('No system settings found');

        const smtpHost = (settings as any)?.smtpHost;
        const smtpPort = (settings as any)?.smtpPort;
        const smtpUser = (settings as any)?.smtpUser;
        const smtpPassEncrypted = (settings as any)?.smtpPass;
        const smtpSecure = (settings as any)?.smtpSecure ?? true;
        const smtpFromEmail = (settings as any)?.smtpFromEmail;

        console.log('[Email] Configuration:', {
            smtpHost, smtpPort, smtpUser, smtpFromEmail, smtpSecure
        });

        if (smtpHost && smtpUser && smtpPassEncrypted) {
            let smtpPass: string;
            try {
                smtpPass = decrypt(smtpPassEncrypted);
            } catch (e) {
                console.warn('Decryption failed, using raw password');
                smtpPass = smtpPassEncrypted;
            }

            // Cast to any to avoid strict type issues in this debug script
            const transportConfig: any = {
                host: smtpHost,
                port: smtpPort || 587,
                secure: smtpSecure,
                auth: { user: smtpUser, pass: smtpPass },
                debug: true, // Enable debug
                logger: true // Enable logger
            };

            const transporter = nodemailer.createTransport(transportConfig);

            const fromIdx = smtpFromEmail || `noreply@vaultsecure.local`;
            console.log(`Sending from: ${fromIdx}`);

            const info = await transporter.sendMail({
                from: fromIdx,
                to: 'rakesh@innodhee.com',
                subject: 'VaultSecure Test Email (Inline Script)',
                html: '<h1>Debug Test</h1><p>If you see this, email is working.</p>'
            });

            console.log('Email Sent!', info);
        } else {
            throw new Error('SMTP not configured in DB');
        }

    } catch (e: any) {
        console.error('Email Send Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
