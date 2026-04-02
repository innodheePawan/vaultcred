'use server';

import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { generateLicenseSignature, getMachineId, verifyLicenseServerSignature } from '@/lib/license-utils';
import { LICENCE_PUBLIC_KEY } from '@/lib/public-key';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { invalidateLicenseCache, getLicenseState } from '@/lib/license-enforcement';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

const ACTIVATION_API_URL = 'https://main.d1vhnqcsa3xxv0.amplifyapp.com/api/activate';

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
        const session = await auth();
        const userId = session?.user?.id;

        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = Math.random().toString(36).substring(2, 15);
        const fingerprint = await getMachineId();

        // Resolve domain from the actual request Host header (works on AWS/Vercel/any server)
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || headersList.get('x-real-ip') || '127.0.0.1';
        const host = headersList.get('host') || '';
        let domain = 'localhost';
        if (host && host !== 'localhost' && !host.startsWith('localhost:')) {
            domain = host.split(':')[0]; // Strip port if present
        } else if (process.env.NEXTAUTH_URL) {
            try { domain = new URL(process.env.NEXTAUTH_URL).hostname; } catch { }
        }

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

            // The API signs the entire response object *before* appending the signature field.
            // When external APIs use map-based serialization (e.g., Golang, unordered dicts), 
            // the JSON keys can occasionally shuffle in order, causing inconsistent PGP signature failures.
            // We recursively generate all top-level key permutations of the payload object to guarantee we find the exact string signed.
            const payloadObject = { ...data };
            delete payloadObject.signature;

            // Helper to generate all permutations of an array
            const permute = (arr: string[]): string[][] => {
                if (arr.length <= 1) return [arr];
                const result: string[][] = [];
                for (let i = 0; i < arr.length; i++) {
                    const current = arr[i];
                    const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
                    const remainingPermuted = permute(remaining);
                    for (let j = 0; j < remainingPermuted.length; j++) {
                        result.push([current].concat(remainingPermuted[j]));
                    }
                }
                return result;
            };

            const keys = Object.keys(payloadObject);
            const keyPermutations = permute(keys);

            const candidates: string[] = [];

            // Push all combinations of raw minified JSON
            for (const perm of keyPermutations) {
                const orderedObj: Record<string, any> = {};
                for (const k of perm) orderedObj[k] = payloadObject[k];

                const minified = JSON.stringify(orderedObj);
                const pretty2 = JSON.stringify(orderedObj, null, 2);
                const pretty4 = JSON.stringify(orderedObj, null, 4);

                candidates.push(minified);
                candidates.push(minified + '\n');
                candidates.push(pretty2);
                candidates.push(pretty2 + '\n');
                candidates.push(pretty4);
                candidates.push(pretty4 + '\n');
            }

            // Add fallback legacy permutations (without 'message') in case the server only signed the core fields
            if (payloadObject.message) {
                const legacyObj = { status: payloadObject.status, entitlements: payloadObject.entitlements };
                const min = JSON.stringify(legacyObj);
                const p2 = JSON.stringify(legacyObj, null, 2);
                const p4 = JSON.stringify(legacyObj, null, 4);

                candidates.push(min, min + '\n', p2, p2 + '\n', p4, p4 + '\n');
            }

            // Further fallback: What if the API server strictly ONLY signed the entitlements object recursively?
            if (payloadObject.entitlements) {
                const entKeys = Object.keys(payloadObject.entitlements);
                const entPermutations = permute(entKeys);
                for (const perm of entPermutations) {
                    const orderedEnt: Record<string, any> = {};
                    for (const k of perm) orderedEnt[k] = payloadObject.entitlements[k];
                    const min = JSON.stringify(orderedEnt);
                    const p2 = JSON.stringify(orderedEnt, null, 2);
                    candidates.push(min, min + '\n', p2, p2 + '\n');
                }
            }

            let isSignatureValid = false;
            let payloadToVerify = '';

            console.log("=== Signature Verification Trace ===");
            console.log("Signature Received:\n", signature.substring(0, 50) + "...");
            console.log("Public Key Length:", LICENCE_PUBLIC_KEY ? LICENCE_PUBLIC_KEY.length : 0);
            console.log("Candidates Length:", candidates.length);

            for (const candidate of candidates) {
                const valid = await verifyLicenseServerSignature(signature.trim(), candidate, LICENCE_PUBLIC_KEY);
                if (valid) {
                    isSignatureValid = true;
                    payloadToVerify = candidate;
                    break;
                }
            }

            console.log("Passed Verification:", isSignatureValid);
            if (isSignatureValid) {
                console.log("Matched Payload Format:", payloadToVerify);
            } else {
                console.error("-> SIGNATURE VALIDATION FAILED against all " + candidates.length + " candidate permutations!");

                return { success: false, message: 'License signature verification failed. The provided license file has been tampered with or was generated by an untrusted source.' };
            }



            // Validate entitlements
            if (!entitlements.validityTill || entitlements.gracePeriodDays === undefined || entitlements.activeUsers === undefined) {
                return { success: false, message: 'Invalid entitlements received from server.' };
            }

            // Before updating the license, verify the current active user count.
            // currentActiveUsers <= newActiveUsersLimit
            const currentActiveUsersInDb = await prisma.user.count({
                where: { status: 'ACTIVE' }
            });

            if (entitlements.activeUsers < currentActiveUsersInDb) {
                return { success: false, message: `New license active user limit (${entitlements.activeUsers}) cannot be less than the current active users count (${currentActiveUsersInDb}).` };
            }

            // Check if the current license already matches the new one to prevent duplicate entries
            // Compare the actual entitlement values to accurately catch functional duplicates despite potentially dynamic API response fields
            const currentState = await getLicenseState(true);
            if (currentState && currentState.state !== 'UNACTIVATED' && currentState.state !== 'COMPROMISED') {
                const isDuplicate =
                    currentState.activeUsers === entitlements.activeUsers &&
                    currentState.gracePeriodDays === entitlements.gracePeriodDays &&
                    currentState.validityTill?.getTime() === new Date(`${entitlements.validityTill}T23:59:59Z`).getTime();

                if (isDuplicate) {
                    return { success: true, message: 'License is already active and up to date with these exact parameters. No changes were made.' };
                }

                // Verify that newValidityTill >= currentValidityTill
                const currentValidityTill = currentState.validityTill?.getTime() || 0;
                const newValidityTill = new Date(`${entitlements.validityTill}T23:59:59Z`).getTime();

                if (newValidityTill < currentValidityTill) {
                    return { success: false, message: "New license validity date cannot be earlier than the current active license validity." };
                }
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

                // Perform Audit Logging for License Update
                const oldValidityTill = currentState && currentState.state !== 'UNACTIVATED' && currentState.state !== 'COMPROMISED' && currentState.validityTill
                    ? currentState.validityTill.toISOString().split('T')[0]
                    : null;

                const oldActiveUsers = currentState && currentState.state !== 'UNACTIVATED' && currentState.state !== 'COMPROMISED'
                    ? currentState.activeUsers
                    : null;

                const auditData: any = {
                    action: oldValidityTill ? 'LICENSE_UPDATE' : 'LICENSE_ACTIVATION',
                    oldValue: JSON.stringify({
                        old_validity_till: oldValidityTill,
                        old_active_users: oldActiveUsers
                    }),
                    newValue: JSON.stringify({
                        new_validity_till: entitlements.validityTill,
                        new_active_users: entitlements.activeUsers
                    }),
                    ipAddress: ipAddress || undefined
                };

                if (userId) {
                    auditData.performedById = userId;
                }

                await tx.auditLog.create({
                    data: auditData
                });
            });

            // Immediately clear the application's global license cache locally
            invalidateLicenseCache();

            // Force a fresh read so subsequent Server Component renders in this worker see VALID
            await getLicenseState(true);

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
