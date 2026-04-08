"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { encrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { getUserAccessContext, canAccess } from "@/lib/iam/permissions";

export async function getApiClients() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ctx = await getUserAccessContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ADMIN_API_CLIENTS', 'VIEW')) throw new Error("Unauthorized");
    return prisma.apiClient.findMany({
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { name: true, email: true } } }
    });
}

export async function getDistinctScopes() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ctx = await getUserAccessContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ADMIN_API_CLIENTS', 'VIEW')) throw new Error("Unauthorized");
    
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
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ctx = await getUserAccessContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ADMIN_API_CLIENTS', 'EDIT')) throw new Error("Unauthorized");

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
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ctx = await getUserAccessContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ADMIN_API_CLIENTS', 'EDIT')) throw new Error("Unauthorized");
    
    await prisma.apiClient.update({
        where: { id },
        data: { isActive }
    });
    revalidatePath("/admin/api-clients");
}

export async function deleteApiClient(id: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    const ctx = await getUserAccessContext(session.user.id);
    if (!canAccess(ctx, 'FEATURE:ADMIN_API_CLIENTS', 'EDIT')) throw new Error("Unauthorized");

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
