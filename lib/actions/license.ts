'use server';

import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { generateLicenseSignature, getMachineId, verifyLicenseServerSignature } from '@/lib/license-utils';
import { LICENCE_PUBLIC_KEY } from '@/lib/public-key';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { invalidateLicenseCache } from '@/lib/license-enforcement';
import { headers } from 'next/headers';

const ACTIVATION_API_URL = 'https://main.d2qgnt0ki6h7ki.amplifyapp.com/api/activate';

export async function activateProduct(formData: FormData) {
    const activationKey = formData.get('activationKey') as string | null;
    const apiKey = formData.get('apiKey') as string | null;
    const apiSecret = formData.get('apiSecret') as string | null;
    const licenseContent = formData.get('licenseContent') as string | null;

    let finalActivationKey = activationKey?.trim() || '';
    let finalApiKey = apiKey?.trim() || '';
    let finalApiSecret = apiSecret?.trim() || '';



    // Handle file content if provided
    if (licenseContent && licenseContent.trim() !== '') {
        try {
            const lines = licenseContent.replace(/\r/g, '').split('\n');
            lines.forEach((line) => {
                // Support both '=' and ':' as separators
                const separatorIndex = line.indexOf(':') !== -1 ? line.indexOf(':') : line.indexOf('=');

                if (separatorIndex !== -1) {
                    const key = line.substring(0, separatorIndex).trim().toUpperCase();
                    const value = line.substring(separatorIndex + 1).trim();

                    if (key === 'ACTIVATION_KEY' || key === 'ACTIVATION KEY') finalActivationKey = value;
                    if (key === 'API_KEY' || key === 'API KEY') finalApiKey = value;
                    if (key === 'API_SECRET' || key === 'API SECRET') finalApiSecret = value;
                }
            });
        } catch (e) {

            return { success: false, message: 'Invalid license file format.' };
        }
    }

    if (!finalActivationKey || !finalApiKey || !finalApiSecret) {

        return { success: false, message: 'Missing required license information.' };
    }

    try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        const fingerprint = await getMachineId();
        const domain = process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).hostname : 'localhost';

        const body = JSON.stringify({
            activationKey: finalActivationKey,
            installationDomain: domain,
            instanceFingerprint: fingerprint,
        });

        const payload = `${timestamp}\n${nonce}\n${body}`;
        const signature = generateLicenseSignature(finalApiSecret, payload);



        const response = await fetch(ACTIVATION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': finalApiKey,
                'x-timestamp': timestamp,
                'x-nonce': nonce,
                'x-signature': signature,
            },
            body: body,
        });

        const data = await response.json();



        if (response.ok && data.status === 'VALID') {
            const signature = data.signature;

            if (!signature) {

                return { success: false, message: 'Security validation failed: Missing digital signature from license server.' };
            }

            const entitlements = data.entitlements;

            // The API signs the entire response object *before* appending the signature field
            const payloadObject = { ...data };
            delete payloadObject.signature;
            const payloadToVerify = JSON.stringify(payloadObject);


            const isSignatureValid = await verifyLicenseServerSignature(signature, payloadToVerify, LICENCE_PUBLIC_KEY);

            if (!isSignatureValid) {

                return { success: false, message: 'Security validation failed: The server response signature is invalid or tampered with.' };
            }



            // Validate entitlements
            if (!entitlements.validityTill || entitlements.gracePeriodDays === undefined || entitlements.activeUsers === undefined) {
                return { success: false, message: 'Invalid entitlements received from server.' };
            }

            // Encrypt and persist
            const masterKey = process.env.MASTER_KEY;
            if (!masterKey) throw new Error('MASTER_KEY not configured.');

            // Store individually as per BRD, plus the raw payload for boot-time re-verification
            const storageTasks = [
                { key: 'VALIDITY_TILL', value: entitlements.validityTill.toString() },
                { key: 'GRACE_DAYS', value: entitlements.gracePeriodDays.toString() },
                { key: 'ACTIVE_USERS', value: entitlements.activeUsers.toString() },
                { key: 'ACTIVATION_STATUS', value: 'ACTIVE' },
                { key: 'SIGNATURE', value: signature.trim() },
                { key: 'RAW_PAYLOAD', value: payloadToVerify }
            ];

            // Run this in an atomic transaction to preserve history
            await prisma.$transaction(async (tx) => {
                // Soft-delete all existing active license records
                await tx.licenseRegistry.updateMany({
                    where: { isActive: true },
                    data: { isActive: false }
                });

                // Insert the new records
                for (const item of storageTasks) {
                    const encryptedKey = encrypt(item.key);
                    const encryptedValue = encrypt(item.value);

                    await tx.licenseRegistry.create({
                        data: {
                            regKey: encryptedKey,
                            regValue: Buffer.from(encryptedValue),
                            isActive: true
                        }
                    });
                }
            });

            // Immediately clear the application's global license cache locally
            invalidateLicenseCache();

            // Ping the internal API to clear its cache in case it runs in an isolated worker (common in dev mode)
            try {
                const headersList = await headers();
                const host = headersList.get('host') || 'localhost:3000';
                const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
                await fetch(`${protocol}://${host}/api/internal/license-state?refresh=true`, { cache: 'no-store' });
            } catch (e) {

            }

            revalidatePath('/');
            return { success: true, message: 'Product activated successfully!' };
        } else {
            return {
                success: false,
                message: data.message || `Activation failed with status: ${data.errorCode || response.status}`,
                details: data
            };
        }
    } catch (error: any) {

        return { success: false, message: 'An internal error occurred during activation.' };
    }
}

import { decrypt } from '@/lib/crypto';

/**
 * Checks if the application is activated.
 */
export async function checkActivationStatus() {
    try {
        const allEntries = await prisma.licenseRegistry.findMany();

        for (const entry of allEntries) {
            try {
                const decryptedKey = decrypt(entry.regKey);
                if (decryptedKey === 'ACTIVATION_STATUS') {
                    return entry.regValue.toString() !== '';
                }
            } catch (decryptionError) {
                // Ignore errors from malformed keys, keep searching
                continue;
            }
        }

        return false;
    } catch (e) {
        return false;
    }
}
