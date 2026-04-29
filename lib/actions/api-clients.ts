"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { encrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { getUserAccessContext, canAccess } from "@/lib/iam/permissions";

export async function getApiClients(page = 1, limit = 10) {
    const session = await auth();
    if (!session?.user || session.user.isActive === false) return { data: [], total: 0, page: 1, totalPages: 0, error: { code: 'UNAUTHORIZED' } };
    const ctx = await getUserAccessContext(session.user.id, session.user);
    if (!canAccess(ctx, 'ADMIN_API_CLIENTS', 'VIEW')) return { data: [], total: 0, page: 1, totalPages: 0, error: { code: 'FORBIDDEN' } };

    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
        prisma.apiClient.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: { createdBy: { select: { name: true, email: true } } }
        }),
        prisma.apiClient.count()
    ]);

    return {
        data: clients,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
}

export async function getDistinctScopes() {
    const session = await auth();
    if (!session?.user || session.user.isActive === false) throw new Error("Unauthorized");
    const ctx = await getUserAccessContext(session.user.id, session.user);
    if (!canAccess(ctx, 'ADMIN_API_CLIENTS', 'VIEW')) throw new Error("Unauthorized");
    
    const [categories, environments] = await Promise.all([
        prisma.credentialMaster.findMany({
            where: { category: { not: null } },
            distinct: ['category'],
            select: { category: true }
        }),
        prisma.credentialMaster.findMany({
            where: { environment: { not: null } },
            distinct: ['environment'],
            select: { environment: true }
        })
    ]);

    const defaultCategories = ['Application', 'Infra', 'Integration'];
    const defaultEnvironments = ['Dev', 'QA', 'Prod'];

    return {
        categories: Array.from(new Set([...defaultCategories, ...categories.map(c => c.category).filter(Boolean) as string[]])),
        environments: Array.from(new Set([...defaultEnvironments, ...environments.map(e => e.environment).filter(Boolean) as string[]]))
    };
}

export async function createApiClient(data: { name: string; scopes: any; tokenValiditySeconds: number; certificateThumbprint?: string | null; securityMode: 'BASIC' | 'SECURE' | 'ENTERPRISE'; allowFileDownload?: boolean; }) {
    const session = await auth();
    if (!session?.user || session.user.isActive === false) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid' } };
    const ctx = await getUserAccessContext(session.user.id, session.user);
    if (!canAccess(ctx, 'ADMIN_API_CLIENTS', 'EDIT')) return { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } };

    const clientId = crypto.randomUUID();
    
    // OAuth 2.0 universally demands a Client Id / Secret mechanism under Client Credentials flow
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const encSecret = encrypt(rawSecret);

    const client = await prisma.apiClient.create({
        data: {
            name: data.name,
            clientId,
            clientSecretHash: encSecret,
            certificateThumbprint: data.certificateThumbprint || null,
            securityMode: data.securityMode,
            allowFileDownload: data.allowFileDownload || false,
            scopes: JSON.stringify(data.scopes),
            tokenValiditySeconds: data.tokenValiditySeconds,
            createdById: session.user.id
        }
    });

    await prisma.auditLog.create({
        data: {
            action: "CREATE_API_CLIENT",
            newValue: JSON.stringify({ name: client.name, clientId: client.clientId }),
            performedById: session.user.id,
            ipAddress: "System"
        }
    });

    revalidatePath("/admin/api-clients");

    return { client, rawSecret }; // rawSecret is only returned once
}

export async function toggleApiClientStatus(id: string, isActive: boolean) {
    const session = await auth();
    if (!session?.user || session.user.isActive === false) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid' } };
    const ctx = await getUserAccessContext(session.user.id, session.user);
    if (!canAccess(ctx, 'ADMIN_API_CLIENTS', 'EDIT')) return { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } };
    
    await prisma.apiClient.update({
        where: { id },
        data: { isActive }
    });
    revalidatePath("/admin/api-clients");
}

export async function deleteApiClient(id: string) {
    const session = await auth();
    if (!session?.user || session.user.isActive === false) return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session invalid' } };
    const ctx = await getUserAccessContext(session.user.id, session.user);
    if (!canAccess(ctx, 'ADMIN_API_CLIENTS', 'EDIT')) return { success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } };

    const client = await prisma.apiClient.findUnique({ where: { id } });
    
    await prisma.apiClient.delete({ where: { id } });

    if (client) {
        await prisma.auditLog.create({
            data: {
                action: "DELETE_API_CLIENT",
                oldValue: JSON.stringify({ name: client.name, clientId: client.clientId }),
                performedById: session.user.id,
                ipAddress: "System"
            }
        });
    }

    revalidatePath("/admin/api-clients");
}
