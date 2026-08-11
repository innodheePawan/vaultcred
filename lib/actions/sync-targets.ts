'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/crypto';
import { IntegrationSuiteClient, ClientConfig, HttpMethod } from '@/lib/integration-suite-client';
import { getSafeUserContext, canAccess, getScopeFilter } from '@/lib/iam/permissions';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { triggerCredentialSync } from '@/lib/sync-engine';
import { headers } from 'next/headers';

// Zod schema for SAP BTP connection validation
const ConnectionConfigSchema = z.object({
  hostUrl: z.string().url('Host URL must be a valid URL'),
  tokenUrl: z.string().url('OAuth Token URL must be a valid URL'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  certificate: z.string().nullable().optional(),
});

// Zod schema for saving a Synchronization Target
const SaveTargetSchema = z.object({
  name: z.string().min(1, 'Target name is required'),
  description: z.string().nullable().optional(),
  type: z.string().min(1, 'Target type is required'),
  status: z.enum(['ENABLED', 'DISABLED']),
  hostUrl: z.string().url('Host URL must be a valid URL'),
  tokenUrl: z.string().url('OAuth Token URL must be a valid URL'),
  clientId: z.string().min(1, 'Client ID is required'),
  clientSecret: z.string().min(1, 'Client Secret is required'),
  certificate: z.string().nullable().optional(),
  tenantLabel: z.string().min(1, 'Tenant Label is required'),
  categories: z.array(z.string()).min(1, 'At least one category must be selected'),
  types: z.array(z.string()).min(1, 'At least one credential type must be selected'),
  environments: z.array(z.string()).min(1, 'At least one environment must be selected'),
});

// Utility to check if a value is a masked placeholder
function isMaskedPlaceholder(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.includes('**');
}

// Utility to mask secrets for safe UI transit
function maskSecret(value: string | null | undefined): string {
  if (!value) return '';
  if (value.length <= 6) return '******';
  return value.slice(0, 2) + '*'.repeat(value.length - 6) + value.slice(-4);
}

// Utility to get current user IP address securely
async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  } catch {
    return 'unknown';
  }
}

/**
   * Action to parse SAP BTP service key uploaded secure JSON format.
   * Runs validation server-side to prevent secrets from leaking into client console/logs.
   */
export async function parseServiceKeyAction(jsonText: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'CREATE')) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  try {
    const keyData = JSON.parse(jsonText);

    // Validate structure of SAP BTP service key
    const url = keyData.url || keyData.oauth?.url;

    // Resolve tokenUrl
    let oauthUrl = keyData.oauth?.tokenurl || keyData.uaa?.url || keyData.tokenurl;
    if (!oauthUrl && keyData.url && keyData.oauth?.url) {
      oauthUrl = keyData.oauth.url;
    }

    const clientId = keyData.oauth?.clientid || keyData.uaa?.clientid || keyData.clientid;
    const clientSecret = keyData.oauth?.clientsecret || keyData.uaa?.clientsecret || keyData.clientsecret;

    const missingFields: string[] = [];
    if (!url) missingFields.push('url');
    if (!oauthUrl) missingFields.push('oauth.url');
    if (!clientId) missingFields.push('clientid');
    if (!clientSecret) missingFields.push('clientsecret');

    if (missingFields.length > 0) {
      return {
        error: `Malformed Service Key JSON. Missing mandatory properties: ${missingFields.join(', ')}`,
      };
    }

    return {
      success: true,
      data: {
        hostUrl: url,
        tokenUrl: oauthUrl,
        clientId,
        clientSecret,
        certificate: keyData.certificate || keyData.oauth?.certificate || keyData.uaa?.certificate || null,
        tenantLabel: IntegrationSuiteClient.extractTenant(url),
      },
    };
  } catch (err) {
    return { error: 'Invalid JSON file. Please ensure it is a valid SAP Service Key JSON format.' };
  }
}

/**
 * Validates connection settings without performing any DB writes.
 * Performs OAuth check & UserCredentials API call.
 * Returns steps log, health state and validation config hash.
 */
export async function testConnectionAction(configPayload: any) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  const action = configPayload.id ? 'EDIT' : 'CREATE';
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', action)) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
  if (isScoped) {
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];

    if (configPayload.id) {
      const existing = await prisma.synchronizationTarget.findUnique({
        where: { id: configPayload.id },
      });
      if (existing) {
        const dbCats = Array.isArray(existing.categories) ? (existing.categories as string[]) : [];
        const dbEnvs = Array.isArray(existing.environments) ? (existing.environments as string[]) : [];
        const catOverlap = allowedCats.includes('*') || dbCats.some((c) => allowedCats.includes(c));
        const envOverlap = allowedEnvs.includes('*') || dbEnvs.some((e) => allowedEnvs.includes(e));
        if (!catOverlap || !envOverlap) {
          return { error: 'Unauthorized: Cannot test targets outside of your assigned scope' };
        }
      }
    }

    if (configPayload.categories || configPayload.environments) {
      const targetCats = configPayload.categories || [];
      const targetEnvs = configPayload.environments || [];
      const catValid = allowedCats.includes('*') || targetCats.every((c: string) => allowedCats.includes(c));
      const envValid = allowedEnvs.includes('*') || targetEnvs.every((e: string) => allowedEnvs.includes(e));
      if (!catValid || !envValid) {
        return { error: 'Unauthorized: Cannot test targets containing categories or environments outside of your assigned scope' };
      }
    }
  }

  // Handle masked placeholders (if testing an existing config without editing the password fields)
  let testConfig = { ...configPayload };
  if (testConfig.id) {
    const existing = await prisma.synchronizationTarget.findUnique({
      where: { id: testConfig.id },
    });
    if (existing) {
      if (isMaskedPlaceholder(testConfig.clientSecret)) {
        testConfig.clientSecret = decrypt(existing.clientSecret);
      }
      if (isMaskedPlaceholder(testConfig.certificate)) {
        testConfig.certificate = existing.certificate ? decrypt(existing.certificate) : null;
      }
    }
  }

  // Validate fields schema
  const validation = ConnectionConfigSchema.safeParse(testConfig);
  if (!validation.success) {
    return {
      error: `Validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`,
    };
  }

  const client = new IntegrationSuiteClient({
    hostUrl: testConfig.hostUrl,
    tokenUrl: testConfig.tokenUrl,
    clientId: testConfig.clientId,
    clientSecret: testConfig.clientSecret,
    certificate: testConfig.certificate,
  });

  const steps = [];
  let health: 'HEALTHY' | 'FAILED' = 'HEALTHY';
  let accessToken = '';
  let responseTime = 0;
  let lastTestHttpStatus = 200;
  let lastTestError: string | null = null;

  // Step 1: OAuth Authentication
  const oauthStart = Date.now();
  try {
    const oauthRes = await client.authenticate();
    accessToken = oauthRes.accessToken;
    steps.push({
      step: 'OAuth Authentication',
      status: 'SUCCESS' as const,
      duration: oauthRes.duration,
      endpoint: testConfig.tokenUrl,
      httpStatus: 200,
      error: null,
      rawResponse: null,
    });
  } catch (err: any) {
    health = 'FAILED';
    lastTestHttpStatus = err.httpStatus || 400;
    lastTestError = err.message || 'OAuth authentication failed';
    steps.push({
      step: 'OAuth Authentication',
      status: 'FAILED' as const,
      duration: Date.now() - oauthStart,
      endpoint: testConfig.tokenUrl,
      httpStatus: lastTestHttpStatus,
      error: lastTestError,
      rawResponse: lastTestError,
    });
  }

  // Step 2: GET UserCredentials to extract CSRF token
  if (health === 'HEALTHY' && accessToken) {
    const apiStart = Date.now();
    const apiUrl = `${testConfig.hostUrl}/api/v1/`;
    try {
      const apiRes = await client.fetchCsrfToken(accessToken);
      lastTestHttpStatus = apiRes.httpStatus;
      responseTime = apiRes.duration;
      steps.push({
        step: 'Security Material API Reachability & CSRF Fetch',
        status: 'SUCCESS' as const,
        duration: apiRes.duration,
        endpoint: apiUrl,
        httpStatus: apiRes.httpStatus,
        error: null,
        rawResponse: null,
      });
    } catch (err: any) {
      health = 'FAILED';
      lastTestHttpStatus = err.httpStatus || 500;
      lastTestError = err.message || 'Failed to reach Security Material API or fetch X-CSRF token';
      steps.push({
        step: 'Security Material API Reachability & CSRF Fetch',
        status: 'FAILED' as const,
        duration: Date.now() - apiStart,
        endpoint: apiUrl,
        httpStatus: lastTestHttpStatus,
        error: lastTestError,
        rawResponse: lastTestError,
      });
    }
  }

  // Compute validation hash
  const configHash = IntegrationSuiteClient.computeConfigHash({
    hostUrl: testConfig.hostUrl,
    tokenUrl: testConfig.tokenUrl,
    clientId: testConfig.clientId,
    clientSecret: testConfig.clientSecret,
    certificate: testConfig.certificate,
  });

  // Log Audit Event for Connection Test
  const ipAddress = await getClientIp();
  await prisma.auditLog.create({
    data: {
      action: 'SYNC_TARGET_CONNECTION_TEST',
      performedById: session.user.id,
      ipAddress,
      newValue: `Test execution for target: ${testConfig.name || 'new'}. Result: ${health}`,
    },
  });

  return {
    success: true,
    steps,
    health,
    configHash,
    responseTime,
    httpStatus: lastTestHttpStatus,
    errorMessage: lastTestError,
  };
}

/**
 * Saves or updates a Synchronization Target record in the database.
 * Verifies payload parameter matches validated config hash, encrypts secrets, and writes audit log in a single transaction.
 */
export async function saveSyncTargetAction(
  id: string | null,
  payload: any,
  validatedConfigHash: string,
  testMetadata: {
    connectionHealth: 'HEALTHY' | 'FAILED';
    lastTestResponseTime: number;
    lastTestHttpStatus: number;
    lastTestError: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  const action = id ? 'EDIT' : 'CREATE';
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', action)) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
  if (isScoped) {
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];

    if (id) {
      const dbTargetRecord = await prisma.synchronizationTarget.findUnique({
        where: { id },
      });
      if (dbTargetRecord) {
        const dbCats = Array.isArray(dbTargetRecord.categories) ? (dbTargetRecord.categories as string[]) : [];
        const dbEnvs = Array.isArray(dbTargetRecord.environments) ? (dbTargetRecord.environments as string[]) : [];
        const isDbCatSubset = allowedCats.includes('*') || dbCats.every((c) => allowedCats.includes(c));
        const isDbEnvSubset = allowedEnvs.includes('*') || dbEnvs.every((e) => allowedEnvs.includes(e));
        if (!isDbCatSubset || !isDbEnvSubset) {
          return { error: 'Unauthorized: Cannot edit a target that has a broader scope than your assigned scope' };
        }
      }
    }

    const targetCats = payload.categories || [];
    const targetEnvs = payload.environments || [];

    const catValid = allowedCats.includes('*') || targetCats.every((c: string) => allowedCats.includes(c));
    const envValid = allowedEnvs.includes('*') || targetEnvs.every((e: string) => allowedEnvs.includes(e));

    if (!catValid || !envValid) {
      return { error: 'Unauthorized: Cannot configure targets containing categories or environments outside of your assigned scope' };
    }
  }

  let dbTarget: any = null;
  if (id) {
    dbTarget = await prisma.synchronizationTarget.findUnique({
      where: { id },
    });
    if (!dbTarget) {
      return { error: 'Target to edit not found in database' };
    }
  }

  // Resolve masked values if they have not been edited
  let resolvedPayload = { ...payload };
  if (id && dbTarget) {
    if (isMaskedPlaceholder(resolvedPayload.clientSecret)) {
      resolvedPayload.clientSecret = decrypt(dbTarget.clientSecret);
    }
    if (isMaskedPlaceholder(resolvedPayload.certificate)) {
      resolvedPayload.certificate = dbTarget.certificate ? decrypt(dbTarget.certificate) : null;
    }
  }

  // Parse Schema Zod validation
  const parsed = SaveTargetSchema.safeParse(resolvedPayload);
  if (!parsed.success) {
    return { error: `Validation error: ${parsed.error.errors.map((e) => e.message).join(', ')}` };
  }

  const data = parsed.data;

  // Confirm hash validation match
  const computedHash = IntegrationSuiteClient.computeConfigHash({
    hostUrl: data.hostUrl,
    tokenUrl: data.tokenUrl,
    clientId: data.clientId,
    clientSecret: data.clientSecret,
    certificate: data.certificate || null,
  });

  if (computedHash !== validatedConfigHash) {
    return {
      error: 'Connection configuration has changed since it was validated. Please re-run the connection test before saving.',
    };
  }

  // Encrypt secrets
  const encryptedSecret = encrypt(data.clientSecret);
  const encryptedCert = data.certificate ? encrypt(data.certificate) : null;

  const ipAddress = await getClientIp();

  try {
    // Save Target and log audit event in a SINGLE transaction
    await prisma.$transaction(async (tx) => {
      const syncTargetData = {
        name: data.name,
        description: data.description || null,
        type: data.type,
        status: data.status === 'ENABLED' ? 'ENABLED' as const : 'DISABLED' as const,
        hostUrl: data.hostUrl,
        tokenUrl: data.tokenUrl,
        clientId: data.clientId,
        clientSecret: encryptedSecret,
        certificate: encryptedCert,
        tenantLabel: data.tenantLabel,
        categories: data.categories,
        types: data.types,
        environments: data.environments,
        connectionHealth: testMetadata.connectionHealth === 'HEALTHY' ? 'HEALTHY' as const : 'FAILED' as const,
        lastTestTimestamp: new Date(),
        lastTestResponseTime: testMetadata.lastTestResponseTime,
        lastTestHttpStatus: testMetadata.lastTestHttpStatus,
        lastTestError: testMetadata.lastTestError,
        testedById: session.user.id,
      };

      let targetRecord;
      let auditAction = 'SYNC_TARGET_CREATE';
      let oldValue = null;
      let newValue = `Created target: ${data.name} for tenant ${data.tenantLabel}`;

      if (id) {
        auditAction = 'SYNC_TARGET_UPDATE';
        targetRecord = await tx.synchronizationTarget.update({
          where: { id },
          data: syncTargetData,
        });
        oldValue = JSON.stringify({
          name: dbTarget.name,
          hostUrl: dbTarget.hostUrl,
          tenantLabel: dbTarget.tenantLabel,
          status: dbTarget.status,
          environments: dbTarget.environments,
        });
        newValue = JSON.stringify({
          name: data.name,
          hostUrl: data.hostUrl,
          tenantLabel: data.tenantLabel,
          status: data.status,
          environments: data.environments,
        });
      } else {
        targetRecord = await tx.synchronizationTarget.create({
          data: syncTargetData,
        });
      }

      await tx.auditLog.create({
        data: {
          action: auditAction,
          performedById: session.user.id,
          ipAddress,
          oldValue,
          newValue,
        },
      });
    });

    revalidatePath('/settings/sync-targets');
    return { success: true };
  } catch (err: any) {
    if (err.code === 'P2002') {
      return { error: 'A synchronization target with this name already exists.' };
    }
    return { error: `Failed to save synchronization target: ${err.message || 'Internal database error'}` };
  }
}

/**
 * Toggles a Synchronization Target's operational status (ENABLED or DISABLED).
 * Executes toggle change and audit logging within a single transaction.
 */
export async function toggleSyncTargetStatusAction(id: string, enable: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'EDIT')) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  const existing = await prisma.synchronizationTarget.findUnique({
    where: { id },
  });
  if (!existing) {
    return { error: 'Target not found' };
  }

  const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
  if (isScoped) {
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];
    const targetCats = Array.isArray(existing.categories) ? (existing.categories as string[]) : [];
    const targetEnvs = Array.isArray(existing.environments) ? (existing.environments as string[]) : [];

    const isCatSubset = allowedCats.includes('*') || targetCats.every((c) => allowedCats.includes(c));
    const isEnvSubset = allowedEnvs.includes('*') || targetEnvs.every((e) => allowedEnvs.includes(e));
    if (!isCatSubset || !isEnvSubset) {
      return { error: 'Unauthorized: Cannot toggle targets that have a broader scope than your assigned scope' };
    }
  }

  const ipAddress = await getClientIp();
  const nextStatus = enable ? 'ENABLED' : 'DISABLED';
  const auditAction = enable ? 'SYNC_TARGET_ENABLED' : 'SYNC_TARGET_DISABLED';

  try {
    await prisma.$transaction(async (tx) => {
      await tx.synchronizationTarget.update({
        where: { id },
        data: { status: nextStatus },
      });

      await tx.auditLog.create({
        data: {
          action: auditAction,
          performedById: session.user.id,
          ipAddress,
          newValue: `Toggled target: ${existing.name} to ${nextStatus}`,
        },
      });
    });

    revalidatePath('/settings/sync-targets');
    return { success: true };
  } catch (err: any) {
    return { error: `Failed to toggle target status: ${err.message}` };
  }
}

/**
 * Deletes a Synchronization Target record.
 * Executes deletion and audit logging within a single transaction.
 */
export async function deleteSyncTargetAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'DELETE')) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  const existing = await prisma.synchronizationTarget.findUnique({
    where: { id },
  });
  if (!existing) {
    return { error: 'Target not found' };
  }

  const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
  if (isScoped) {
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];
    const targetCats = Array.isArray(existing.categories) ? (existing.categories as string[]) : [];
    const targetEnvs = Array.isArray(existing.environments) ? (existing.environments as string[]) : [];

    const isCatSubset = allowedCats.includes('*') || targetCats.every((c) => allowedCats.includes(c));
    const isEnvSubset = allowedEnvs.includes('*') || targetEnvs.every((e) => allowedEnvs.includes(e));
    if (!isCatSubset || !isEnvSubset) {
      return { error: 'Unauthorized: Cannot delete targets that have a broader scope than your assigned scope' };
    }
  }

  const ipAddress = await getClientIp();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.synchronizationTarget.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          action: 'SYNC_TARGET_DELETE',
          performedById: session.user.id,
          ipAddress,
          oldValue: `Deleted target: ${existing.name} (Tenant: ${existing.tenantLabel})`,
        },
      });
    });

    revalidatePath('/settings/sync-targets');
    return { success: true };
  } catch (err: any) {
    return { error: `Failed to delete synchronization target: ${err.message}` };
  }
}

/**
 * Fetches all Synchronization Targets.
 * Returns targets with masked sensitive fields.
 */
export async function getSyncTargets() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'VIEW')) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  try {
    const targets = await prisma.synchronizationTarget.findMany({
      include: {
        testedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
    const allowedCats = ctx.allowedCategories || [];
    const allowedEnvs = ctx.allowedEnvironments || [];

    const filteredTargets = targets.filter((t) => {
      if (!isScoped) return true;
      const targetCats = Array.isArray(t.categories) ? (t.categories as string[]) : [];
      const targetEnvs = Array.isArray(t.environments) ? (t.environments as string[]) : [];

      const catOverlap = allowedCats.includes('*') || targetCats.some((c) => allowedCats.includes(c));
      const envOverlap = allowedEnvs.includes('*') || targetEnvs.some((e) => allowedEnvs.includes(e));
      return catOverlap && envOverlap;
    });

    // Mask sensitive fields in results
    const maskedTargets = filteredTargets.map((t) => {
      try {
        const rawSecret = decrypt(t.clientSecret);
        const rawCert = t.certificate ? decrypt(t.certificate) : null;
        return {
          ...t,
          clientSecret: maskSecret(rawSecret),
          certificate: rawCert ? maskSecret(rawCert) : null,
        };
      } catch (err) {
        console.error(`Failed to decrypt credentials for target ${t.name}:`, err);
        return {
          ...t,
          clientSecret: '••••••••',
          certificate: t.certificate ? '••••••••' : null,
        };
      }
    });

    return { success: true, data: maskedTargets };
  } catch (err: any) {
    return { error: `Failed to fetch synchronization targets: ${err.message}` };
  }
}

/**
 * Fetches a single Synchronization Target by ID.
 * Returns the target with masked sensitive fields.
 */
export async function getSyncTargetById(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'VIEW')) {
    return { error: 'Unauthorized: Insufficient permissions' };
  }

  try {
    const target = await prisma.synchronizationTarget.findUnique({
      where: { id },
      include: {
        testedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!target) {
      return { error: 'Target not found' };
    }

    const isScoped = ctx.featurePermissions['SYNC_TARGETS'] === 'ALL_SCOPED';
    if (isScoped) {
      const allowedCats = ctx.allowedCategories || [];
      const allowedEnvs = ctx.allowedEnvironments || [];
      const targetCats = Array.isArray(target.categories) ? (target.categories as string[]) : [];
      const targetEnvs = Array.isArray(target.environments) ? (target.environments as string[]) : [];

      const catOverlap = allowedCats.includes('*') || targetCats.some((c) => allowedCats.includes(c));
      const envOverlap = allowedEnvs.includes('*') || targetEnvs.some((e) => allowedEnvs.includes(e));
      if (!catOverlap || !envOverlap) {
        return { error: 'Target not found' };
      }
    }

    const rawSecret = decrypt(target.clientSecret);
    const rawCert = target.certificate ? decrypt(target.certificate) : null;

    const configHash = IntegrationSuiteClient.computeConfigHash({
      hostUrl: target.hostUrl,
      tokenUrl: target.tokenUrl,
      clientId: target.clientId,
      clientSecret: rawSecret,
      certificate: rawCert,
    });

    const maskedTarget = {
      ...target,
      clientSecret: maskSecret(rawSecret),
      certificate: rawCert ? maskSecret(rawCert) : null,
      configHash,
    };

    return { success: true, data: maskedTarget };
  } catch (err: any) {
    return { error: `Failed to fetch synchronization target: ${err.message}` };
  }
}

/**
 * Retrieves paginated sync history records with search, status filters, and date range filters.
 */
export async function getSyncHistory({
  page = 1,
  limit = 20,
  search = '',
  status,
  targetId,
  startDate,
  endDate,
  sortBy = 'startedAt',
  sortOrder = 'desc',
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_HISTORY', 'VIEW')) {
    return { error: 'Unauthorized: Insufficient permissions to view synchronization logs' };
  }

  const where: any = {};
  const scopeFilter = getScopeFilter(ctx, 'FEATURE:SYNC_HISTORY');
  Object.assign(where, scopeFilter);

  if (search) {
    where.OR = [
      { credentialName: { contains: search } },
      { targetName: { contains: search } },
      { platform: { contains: search } },
      { initiatedByName: { contains: search } },
      { endpoint: { contains: search } },
      { errorMessage: { contains: search } },
      { sessionId: { contains: search } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (targetId && targetId !== 'ALL') {
    where.targetId = targetId;
  }

  if (startDate || endDate) {
    where.startedAt = {};
    if (startDate) where.startedAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.startedAt.lte = end;
    }
  }

  try {
    const [raw, total] = await Promise.all([
      prisma.syncHistory.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.syncHistory.count({ where }),
    ]);

    return {
      success: true,
      data: raw,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error: any) {
    console.error('Failed to fetch synchronization history:', error);
    return { error: 'Failed to fetch synchronization history' };
  }
}

/**
 * Retrieves details for a specific sync attempt.
 */
export async function getSyncHistoryDetail(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_HISTORY', 'VIEW')) {
    return { error: 'Unauthorized: Insufficient permissions to view synchronization detail' };
  }

  try {
    const record = await prisma.syncHistory.findUnique({
      where: { id },
      include: {
        target: {
          select: {
            name: true,
            tenantLabel: true,
          },
        },
      },
    });

    if (!record) {
      return { error: 'Sync history record not found' };
    }

    const isScoped = ctx.featurePermissions['SYNC_HISTORY'] === 'ALL_SCOPED';
    if (isScoped) {
      const allowedCats = ctx.allowedCategories || [];
      const allowedEnvs = ctx.allowedEnvironments || [];
      const catOverlap = allowedCats.includes('*') || (record.category && allowedCats.includes(record.category));
      const envOverlap = allowedEnvs.includes('*') || (record.environment && allowedEnvs.includes(record.environment));
      if (!catOverlap || !envOverlap) {
        return { error: 'Sync history record not found' };
      }
    }

    return { success: true, data: record };
  } catch (error: any) {
    return { error: `Failed to fetch sync detail: ${error.message}` };
  }
}

/**
 * Manually retries a failed synchronization (reusing the same synchronization engine logic,
 * creating a new history record and a new audit log entry under a new session).
 */
export async function retrySynchronizationAction(historyId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized' };
  }

  const ctx = await getSafeUserContext(session.user.id);
  if (!canAccess(ctx, 'FEATURE:SYNC_HISTORY_RETRY', 'CREATE')) {
    return { error: 'Unauthorized: Insufficient permissions to retry synchronization' };
  }

  try {
    const originalRecord = await prisma.syncHistory.findUnique({
      where: { id: historyId },
    });

    if (!originalRecord) {
      return { error: 'Sync history record not found' };
    }

    const isScoped = ctx.featurePermissions['SYNC_HISTORY_RETRY'] === 'ALL_SCOPED';
    if (isScoped) {
      const allowedCats = ctx.allowedCategories || [];
      const allowedEnvs = ctx.allowedEnvironments || [];
      const catOverlap = allowedCats.includes('*') || (originalRecord.category && allowedCats.includes(originalRecord.category));
      const envOverlap = allowedEnvs.includes('*') || (originalRecord.environment && allowedEnvs.includes(originalRecord.environment));
      if (!catOverlap || !envOverlap) {
        return { error: 'Unauthorized: Cannot retry synchronization outside of your assigned scope' };
      }
    }

    if (!originalRecord.credentialId) {
      return { error: 'Associated credential no longer exists in CredSecure' };
    }

    try {
      await triggerCredentialSync(originalRecord.credentialId!, session.user.id, {
        executionType: 'MANUAL',
        parentHistoryId: originalRecord.id,
        targetId: originalRecord.targetId,
      });
    } catch (err) {
      console.error('Failed to trigger manual retry:', err);
    }

    return { success: true, message: 'Retry triggered successfully' };
  } catch (error: any) {
    return { error: `Failed to trigger retry: ${error.message}` };
  }
}
