'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { logAudit } from '@/lib/actions/audit';
import { getUserAccessContext } from '@/lib/iam/permissions';
import { join } from 'path';
import { mkdir } from 'fs/promises';

type BulkRow = Record<string, string>;

type BulkResult = {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    errors: { row: number; name: string; error: string }[];
};

const VALID_TYPES = ['PASSWORD', 'API_OAUTH', 'KEY_CERT', 'TOKEN', 'SECURE_NOTE', 'FILE'];
const VALID_CATEGORIES = ['Application', 'Infra', 'Integration'];
const VALID_ENVIRONMENTS = ['Dev', 'QA', 'Prod'];

function validateRow(row: BulkRow, rowNum: number): string | null {
    if (!row.name?.trim()) return `Row ${rowNum}: Name is required`;
    if (!row.type?.trim()) return `Row ${rowNum}: Type is required`;
    if (!VALID_TYPES.includes(row.type.trim())) return `Row ${rowNum}: Invalid type '${row.type}'. Must be one of: ${VALID_TYPES.join(', ')}`;

    const type = row.type.trim();
    if (type === 'PASSWORD') {
        if (!row.username?.trim()) return `Row ${rowNum}: Username is required for PASSWORD type`;
        if (!row.password?.trim()) return `Row ${rowNum}: Password is required for PASSWORD type`;
    }
    if (type === 'TOKEN') {
        if (!row.token?.trim()) return `Row ${rowNum}: Token value is required for TOKEN type`;
    }
    if (type === 'SECURE_NOTE') {
        if (!row.note?.trim()) return `Row ${rowNum}: Note content is required for SECURE_NOTE type`;
    }
    if (type === 'FILE') {
        if (!row.fileName?.trim()) return `Row ${rowNum}: File name is required for FILE type`;
        if (!row.fileContent?.trim()) return `Row ${rowNum}: File content is required for FILE type`;
    }
    if (type === 'KEY_CERT') {
        if (!row.keyType?.trim()) return `Row ${rowNum}: Key type is required for KEY_CERT type`;
    }

    if (row.category?.trim() && !VALID_CATEGORIES.includes(row.category.trim())) {
        return `Row ${rowNum}: Invalid category '${row.category}'. Must be one of: ${VALID_CATEGORIES.join(', ')}`;
    }
    if (row.environment?.trim() && !VALID_ENVIRONMENTS.includes(row.environment.trim())) {
        return `Row ${rowNum}: Invalid environment '${row.environment}'. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`;
    }

    return null;
}

export async function bulkImportCredentials(csvData: BulkRow[]): Promise<BulkResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { total: 0, success: 0, failed: 0, skipped: 0, errors: [{ row: 0, name: '', error: 'Unauthorized' }] };
    }

    // Only Super Admin or Admin with full scope access
    const ctx = await getUserAccessContext(session.user.id);
    if (!ctx.isAdmin) {
        return { total: 0, success: 0, failed: 0, skipped: 0, errors: [{ row: 0, name: '', error: 'Only Super Admin users can perform bulk imports.' }] };
    }

    const result: BulkResult = {
        total: csvData.length,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
    };

    // 1. Batch Validation: Query all existing names at once
    const allNames = csvData.map(r => r.name?.trim()).filter(Boolean);
    const existingMasterRecords = await prisma.credentialMaster.findMany({
        where: { name: { in: allNames as string[] } },
        select: { name: true }
    });
    const existingNamesSet = new Set(existingMasterRecords.map(r => r.name));

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNum = i + 2; // +2 for 1-indexed + header row

        // Validate
        const validationError = validateRow(row, rowNum);
        if (validationError) {
            result.failed++;
            result.errors.push({ row: rowNum, name: row.name || '(empty)', error: validationError });
            continue;
        }

        // 2. Optimized Deduplication: Check memory set instead of individual DB queries
        const name = row.name.trim();
        if (existingNamesSet.has(name)) {
            result.skipped++;
            // Optional: Log skip in audit or just keep count
            continue;
        }

        try {
            const type = row.type.trim();
            const name = row.name.trim();

            await prisma.$transaction(async (tx) => {
                // Create master record
                const master = await tx.credentialMaster.create({
                    data: {
                        name,
                        type,
                        category: row.category?.trim() || null,
                        environment: row.environment?.trim() || null,
                        description: row.description?.trim() || null,
                        isPersonal: false,
                        expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
                        createdById: session.user.id!,
                        lastModifiedById: session.user.id!,
                    }
                });

                // Create type-specific record
                if (type === 'PASSWORD') {
                    await tx.credPassword.create({
                        data: {
                            credentialId: master.id,
                            username: row.username.trim(),
                            passwordEncrypted: encrypt(row.password.trim()),
                            host: row.host?.trim() || null,
                            port: row.port ? parseInt(row.port) : null,
                        }
                    });
                } else if (type === 'API_OAUTH') {
                    await tx.credApiOAuth.create({
                        data: {
                            credentialId: master.id,
                            clientId: row.clientId?.trim() || null,
                            clientSecretEnc: row.clientSecret ? encrypt(row.clientSecret.trim()) : null,
                            apiKeyEncrypted: row.apiKey ? encrypt(row.apiKey.trim()) : null,
                            tokenEndpoint: row.tokenEndpoint?.trim() || null,
                            authEndpoint: row.authEndpoint?.trim() || null,
                            scopes: row.scopes?.trim() || null,
                        }
                    });
                } else if (type === 'KEY_CERT') {
                    await tx.credKeyCert.create({
                        data: {
                            credentialId: master.id,
                            keyType: row.keyType.trim(),
                            keyFormat: row.keyFormat?.trim() || null,
                            publicKey: row.publicKey?.trim() || null,
                            publicKeyFileName: null,
                            privateKeyEnc: row.privateKey ? encrypt(row.privateKey.trim()) : null,
                            privateKeyFileName: null,
                            passphraseEnc: row.passphrase ? encrypt(row.passphrase.trim()) : null,
                            validTo: row.expiryDate ? new Date(row.expiryDate) : null,
                        }
                    });
                } else if (type === 'TOKEN') {
                    await tx.credToken.create({
                        data: {
                            credentialId: master.id,
                            tokenEncrypted: encrypt(row.token.trim()),
                            tokenType: row.tokenType?.trim() || null,
                            issuer: row.issuer?.trim() || null,
                            expiresAt: row.expiryDate ? new Date(row.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        }
                    });
                } else if (type === 'SECURE_NOTE') {
                    await tx.credSecureNote.create({
                        data: {
                            credentialId: master.id,
                            noteEncrypted: encrypt(row.note.trim()),
                        }
                    });
                } else if (type === 'FILE') {
                    const uploadDir = join(process.cwd(), 'secure_uploads');
                    await mkdir(uploadDir, { recursive: true });
                    const filePath = join(uploadDir, `${master.id}_${row.fileName.trim()}`);

                    await tx.credFile.create({
                        data: {
                            credentialId: master.id,
                            fileName: row.fileName.trim(),
                            filePath,
                            fileType: row.fileType?.trim() || 'unknown',
                            fileContent: row.fileContent ? encrypt(row.fileContent.trim()) : null,
                        }
                    });
                }
            });

            await logAudit({
                action: 'CREATE_CREDENTIAL',
                details: `Bulk import: Created credential '${name}' of type ${type}`,
                userId: session.user.id,
            });

            result.success++;
        } catch (error: any) {
            result.failed++;
            result.errors.push({ row: rowNum, name: row.name || '(empty)', error: error.message });
        }
    }

    await logAudit({
        action: 'BULK_IMPORT',
        details: `Bulk import completed: ${result.success} success, ${result.skipped} skipped, ${result.failed} failed out of ${result.total} total`,
        userId: session.user.id,
    });

    return result;
}
