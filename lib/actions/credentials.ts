'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { logAudit } from '@/lib/actions/audit';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

// ----------------------------------------------------------------------
// Zod Schemas
// ----------------------------------------------------------------------

const BaseSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.enum(['Application', 'Infra', 'Integration']).optional(),
    environment: z.enum(['Dev', 'QA', 'Prod']).optional(),
    description: z.string().optional(),
    folder: z.string().optional(),
    tags: z.string().optional(),
    isPersonal: z.coerce.boolean().optional(),
    expiryDate: z.string().optional(), // ISO format date string
});

const PasswordSchema = BaseSchema.extend({
    type: z.literal('PASSWORD'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
    host: z.string().optional(),
    port: z.coerce.number().optional(),
});

const ApiKeySchema = BaseSchema.extend({
    type: z.literal('API_OAUTH'),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    apiKey: z.string().optional(),
    tokenEndpoint: z.string().url().optional().or(z.literal('')),
    authEndpoint: z.string().url().optional().or(z.literal('')),
    scopes: z.string().optional(),
});

const KeyCertSchema = BaseSchema.extend({
    type: z.literal('KEY_CERT'),
    keyType: z.enum(['SSL', 'SSH', 'PGP', 'TLS', 'SIGNING']),
    keyFormat: z.enum(['PEM', 'DER', 'PFX']).optional(),
    publicKey: z.string().optional(),
    publicKeyFileName: z.string().optional(),
    privateKey: z.string().optional(),
    privateKeyFileName: z.string().optional(),
    passphrase: z.string().optional(),
    expiryDate: z.string().optional(),
});

const TokenSchema = BaseSchema.extend({
    type: z.literal('TOKEN'),
    token: z.string().min(1, "Token is required"),
    tokenType: z.enum(['Bearer', 'JWT']).optional(),
    issuer: z.string().optional(),
    expiryDate: z.string().optional(),
});

const NoteSchema = BaseSchema.extend({
    type: z.literal('SECURE_NOTE'),
    note: z.string().min(1, "Note content is required"),
});

const FileSchema = BaseSchema.extend({
    type: z.literal('FILE'),
    fileName: z.string().min(1, "File name is required"),
    fileContent: z.string().min(1, "File content is required"), // For now, passing content string. Later multipart.
    fileType: z.string().optional(),
});

// Union Schema for Validating Form Data
const CredentialSchema = z.discriminatedUnion('type', [
    PasswordSchema,
    ApiKeySchema,
    KeyCertSchema,
    TokenSchema,
    NoteSchema,
    FileSchema,
]).superRefine((data, ctx) => {
    if (data.type === 'API_OAUTH') {
        if (!data.apiKey && (!data.clientId || !data.clientSecret)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Either API Key or Client ID/Secret must be provided",
                path: ["apiKey"]
            });
        }
    }
});

// ----------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------

export async function createCredential(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = CredentialSchema.safeParse(rawData);

    if (!validation.success) {
        console.error("Validation Error:", validation.error.format());
        return { error: 'Validation Failed', details: validation.error.flatten().fieldErrors };
    }

    const data = validation.data;

    try {
        const master = await prisma.$transaction(async (tx) => {
            const master = await tx.credentialMaster.create({
                data: {
                    name: data.name,
                    type: data.type,
                    category: data.category || null,
                    environment: data.environment || null,
                    description: data.description || null,
                    isPersonal: data.isPersonal || false,
                    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
                    createdById: session.user.id!,
                    lastModifiedById: session.user.id!,
                }
            });

            if (data.type === 'PASSWORD') {
                await tx.credPassword.create({
                    data: {
                        credentialId: master.id,
                        username: data.username,
                        passwordEncrypted: encrypt(data.password),
                        host: data.host || null,
                        port: data.port || null,
                    }
                });
            } else if (data.type === 'API_OAUTH') {
                await tx.credApiOAuth.create({
                    data: {
                        credentialId: master.id,
                        clientId: data.clientId || null,
                        clientSecretEnc: data.clientSecret ? encrypt(data.clientSecret) : null,
                        apiKeyEncrypted: data.apiKey ? encrypt(data.apiKey) : null,
                        tokenEndpoint: data.tokenEndpoint || null,
                        authEndpoint: data.authEndpoint || null,
                        scopes: data.scopes || null,
                    }
                });
            } else if (data.type === 'KEY_CERT') {
                await tx.credKeyCert.create({
                    data: {
                        credentialId: master.id,
                        keyType: data.keyType,
                        keyFormat: data.keyFormat || null,
                        publicKey: data.publicKey || null,
                        publicKeyFileName: data.publicKeyFileName || null,
                        privateKeyEnc: data.privateKey ? encrypt(data.privateKey) : null,
                        privateKeyFileName: data.privateKeyFileName || null,
                        passphraseEnc: data.passphrase ? encrypt(data.passphrase) : null,
                        validTo: data.expiryDate ? new Date(data.expiryDate) : null,
                    }
                });
            } else if (data.type === 'TOKEN') {
                await tx.credToken.create({
                    data: {
                        credentialId: master.id,
                        tokenEncrypted: encrypt(data.token),
                        tokenType: data.tokenType || null,
                        issuer: data.issuer || null,
                        expiresAt: data.expiryDate ? new Date(data.expiryDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    }
                });
            } else if (data.type === 'SECURE_NOTE') {
                await tx.credSecureNote.create({
                    data: {
                        credentialId: master.id,
                        noteEncrypted: encrypt(data.note)
                    }
                });
            } else if (data.type === 'FILE') {
                // Handling File: Write to disk (simulated secure storage)
                const uploadDir = join(process.cwd(), 'secure_uploads');
                await mkdir(uploadDir, { recursive: true });
                const filePath = join(uploadDir, `${master.id}_${data.fileName}`);

                // In a real app we'd encrypt the file content itself before writing
                // For this demo, we write plaintext or base64 to disk, but 'filePath' is what we store
                await writeFile(filePath, data.fileContent);

                await tx.credFile.create({
                    data: {
                        credentialId: master.id,
                        fileName: data.fileName,
                        filePath: filePath,
                        fileType: data.fileType || 'unknown',
                    }
                });
            }
            return master;
        });

        await logAudit({
            action: 'CREATE_CREDENTIAL',
            credentialId: master.id,
            details: `Created credential '${master.name}' of type ${master.type}`,
            userId: session.user.id
        });

        revalidatePath('/credentials');
        return { success: true, message: 'Credential created successfully!' };

    } catch (error) {
        console.error("Failed to create credential:", error);
        return { error: 'Failed to create credential. ' + (error as Error).message };
    }
}

import { getUserAccessContext, canAccess } from '@/lib/iam/permissions';

export async function getCredentials(params?: {
    query?: string;
    type?: string;
    category?: string;
    environment?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}) {
    const session = await auth();
    if (!session?.user) return [];

    const { query, type: typeFilter, category, environment, sort, order } = params || {};

    // 1. Get User IAM Context
    const accessContext = await getUserAccessContext(session.user.id!);

    // 2. Build Permission Filters
    // Rule: Personal credentials are STRICTLY visible only to the creator.
    // Rule: Shared credentials are visible to Admins OR via RBAC.

    const where: any = {
        OR: [
            { createdById: session.user.id } // Always see own items (Personal or Shared)
        ]
    };

    if (accessContext.isAdmin) {
        // Admin sees all SHARED items
        where.OR.push({ isPersonal: false });
    } else {
        // Regular User: Check RBAC for SHARED items
        const orConditions: any[] = [];
        const { permissions } = accessContext;

        if (permissions['*']?.['*']) {
            // Access to all SHARED
            where.OR.push({ isPersonal: false });
        } else {
            Object.keys(permissions).forEach(cat => {
                Object.keys(permissions[cat]).forEach(env => {
                    const perms = permissions[cat][env];
                    if (perms.has('READ') || perms.has('EDIT') || perms.has('CREATE') || perms.has('ADMIN')) {
                        const condition: any = {};
                        if (cat !== '*') condition.category = cat;
                        if (env !== '*') condition.environment = env;
                        orConditions.push(condition);
                    }
                });
            });

            if (orConditions.length > 0) {
                where.OR.push({
                    AND: [
                        { isPersonal: false },
                        { OR: orConditions }
                    ]
                });
            }
        }
    }

    // 3. Apply Filters
    const finalWhere: any = {
        AND: [
            where
        ]
    };

    if (query) {
        finalWhere.AND.push({
            OR: [
                { name: { contains: query } },
                { description: { contains: query } },
                { detailsPassword: { username: { contains: query } } },
                { detailsKeyCert: { publicKeyFileName: { contains: query } } },
                { detailsFile: { fileName: { contains: query } } }
            ]
        });
    }

    if (typeFilter) finalWhere.AND.push({ type: typeFilter });
    if (category) finalWhere.AND.push({ category });
    if (environment) finalWhere.AND.push({ environment });

    const orderBy: any = {};
    if (sort) {
        orderBy[sort] = order || 'asc';
    } else {
        orderBy.lastModifiedOn = 'desc';
    }

    try {
        const credentials = await prisma.credentialMaster.findMany({
            where: finalWhere,
            orderBy,
            include: {
                createdBy: { select: { name: true, email: true } }
            }
        });
        return credentials;
    } catch (error) {
        console.error("Error fetching credentials:", error);
        return [];
    }
}



export async function getCredentialById(id: string) {
    const session = await auth();
    if (!session?.user) return null;

    const credential = await prisma.credentialMaster.findUnique({
        where: { id },
        include: {
            createdBy: { select: { id: true, name: true, email: true } },
            detailsPassword: true,
            detailsApi: true,
            detailsKeyCert: true,
            detailsToken: true,
            detailsFile: true,
            detailsNote: true,
        }
    });

    if (!credential) return null;

    // IAM Access Check
    const accessContext = await getUserAccessContext(session.user.id);
    const hasAccess = canAccess(accessContext, credential.category, credential.environment, 'READ');

    // Allow creator to always access (optional, but typical)
    const isOwner = credential.createdById === session.user.id;

    if (credential.isPersonal) {
        if (!isOwner) return null; // STRICT: Only owner sees personal
    } else {
        // Shared
        if (!accessContext.isAdmin && !isOwner && !hasAccess) return null;
    }

    await logAudit({
        action: 'VIEW_CREDENTIAL',
        credentialId: credential.id,
        details: `Viewed credential '${credential.name}'`,
        userId: session.user.id
    });

    let details: any = {};

    if (credential.type === 'PASSWORD' && credential.detailsPassword) {
        const d = credential.detailsPassword;
        details = {
            username: d.username,
            password: decrypt(d.passwordEncrypted),
            host: d.host,
            port: d.port
        };
    } else if (credential.type === 'API_OAUTH' && credential.detailsApi) {
        const d = credential.detailsApi;
        details = {
            clientId: d.clientId,
            clientSecret: d.clientSecretEnc ? decrypt(d.clientSecretEnc) : undefined,
            apiKey: d.apiKeyEncrypted ? decrypt(d.apiKeyEncrypted) : undefined,
            tokenEndpoint: d.tokenEndpoint,
            authEndpoint: d.authEndpoint,
            scopes: d.scopes
        };
    } else if (credential.type === 'KEY_CERT' && credential.detailsKeyCert) {
        const d = credential.detailsKeyCert;
        details = {
            keyType: d.keyType,
            keyFormat: d.keyFormat,
            publicKey: d.publicKey,
            publicKeyFileName: d.publicKeyFileName,
            privateKey: d.privateKeyEnc ? decrypt(d.privateKeyEnc) : undefined,
            privateKeyFileName: d.privateKeyFileName,
            passphrase: d.passphraseEnc ? decrypt(d.passphraseEnc) : undefined,
            expiryDate: d.validTo
        };
    } else if (credential.type === 'TOKEN' && credential.detailsToken) {
        const d = credential.detailsToken;
        details = {
            token: decrypt(d.tokenEncrypted),
            tokenType: d.tokenType,
            issuer: d.issuer,
            expiryDate: d.expiresAt
        };
    } else if (credential.type === 'SECURE_NOTE' && credential.detailsNote) {
        const d = credential.detailsNote;
        details = {
            note: decrypt(d.noteEncrypted)
        };
    } else if (credential.type === 'FILE' && credential.detailsFile) {
        const d = credential.detailsFile;
        let content = '';
        try {
            content = await readFile(d.filePath, 'utf-8');
        } catch (e) {
            content = 'Error reading file content';
        }
        details = {
            fileName: d.fileName,
            filePath: d.filePath,
            fileType: d.fileType,
            fileContent: content
        };
    }

    return {
        ...credential,
        details
    };
}

export async function deleteCredential(id: string) {
    const session = await auth();
    if (!session?.user) return { error: 'Unauthorized' };

    const credential = await prisma.credentialMaster.findUnique({ where: { id } });
    if (!credential) return { error: 'Not found' };

    if (credential.createdById !== session.user.id && session.user.role !== 'ADMIN') {
        return { error: 'Unauthorized' };
    }

    const master = await prisma.$transaction(async (tx) => {
        // Delete the credential master record
        const deletedCredential = await tx.credentialMaster.delete({ where: { id } });
        // If there are related detail records (e.g., detailsPassword, detailsApi, etc.)
        // and they are not configured with `onDelete: Cascade` in the Prisma schema,
        // you would need to explicitly delete them here.
        // For example:
        // if (deletedCredential.type === 'PASSWORD') {
        //     await tx.credentialDetailsPassword.delete({ where: { credentialMasterId: id } });
        // }
        // Assuming `onDelete: Cascade` is set up for detail tables,
        // deleting the master record is sufficient.
        return deletedCredential;
    });

    await logAudit({
        action: 'DELETE_CREDENTIAL',
        credentialId: id,
        details: `Deleted credential '${credential.name}'`,
        userId: session.user.id
    });

    revalidatePath('/credentials');
    return { success: true };
}

export async function updateCredential(id: string, prevState: any, formData: FormData) {
    return { error: "Update not implemented yet" };
}
