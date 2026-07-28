import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { IntegrationSuiteClient, HttpMethod } from '@/lib/integration-suite-client';
import { logAudit } from '@/lib/actions/audit';
import crypto from 'crypto';

// ─────────────────────────────────────────────
// PROVIDER CONTRACT
// ─────────────────────────────────────────────

export interface SynchronizationProvider {
  /**
   * Performs authentication against the target.
   * Returns authentication metadata (e.g. Access Token, CSRF Token, Cookies).
   */
  authenticate(targetConfig: any): Promise<any>;

  /**
   * Validates target configuration without altering state (Test Connection).
   */
  validateConfiguration(targetConfig: any): Promise<boolean>;

  /**
   * Determines if the credential currently exists on the destination platform.
   */
  exists(targetConfig: any, credentialName: string, authData: any): Promise<boolean>;

  /**
   * Executes a Create operation on the destination platform.
   */
  create(
    targetConfig: any,
    credentialName: string,
    description: string,
    secret: string,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers }>;

  /**
   * Executes an Update operation on the destination platform.
   */
  update(
    targetConfig: any,
    credentialName: string,
    description: string,
    secret: string,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers }>;

  /**
   * Executes a Delete operation on the destination platform.
   */
  delete(targetConfig: any, credentialName: string, authData: any): Promise<any>;
}

// ─────────────────────────────────────────────
// SAP INTEGRATION SUITE PROVIDER IMPLEMENTATION
// ─────────────────────────────────────────────

export class SapIntegrationSuiteProvider implements SynchronizationProvider {
  async authenticate(targetConfig: any): Promise<any> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    const oauthRes = await client.authenticate();
    const csrfRes = await client.fetchCsrfToken(oauthRes.accessToken);

    return {
      accessToken: oauthRes.accessToken,
      csrfToken: csrfRes.csrfToken,
      cookies: csrfRes.cookies,
    };
  }

  async validateConfiguration(targetConfig: any): Promise<boolean> {
    try {
      const authData = await this.authenticate(targetConfig);
      return !!authData.csrfToken;
    } catch {
      return false;
    }
  }

  async exists(targetConfig: any, credentialName: string, authData: any): Promise<boolean> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    const checkUrl = `/api/v1/SecureParameters('${encodeURIComponent(credentialName)}')`;
    const checkHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'Accept': 'application/json',
    };

    const res = await client.execute('GET', checkUrl, checkHeaders);
    if (res.status === 200) {
      return true;
    } else if (res.status === 404) {
      return false;
    } else {
      throw new Error(`Existence check failed with HTTP Status ${res.status}: ${res.text}`);
    }
  }

  async create(
    targetConfig: any,
    credentialName: string,
    description: string,
    secret: string,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers }> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    const payload = {
      Name: credentialName,
      Description: description || '',
      SecureParam: secret,
    };

    const syncHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'X-CSRF-Token': authData.csrfToken,
      ...(authData.cookies && authData.cookies.length > 0 && { 'Cookie': authData.cookies.join('; ') }),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    return await client.execute(
      'POST',
      `/api/v1/SecureParameters`,
      syncHeaders,
      JSON.stringify(payload)
    );
  }

  async update(
    targetConfig: any,
    credentialName: string,
    description: string,
    secret: string,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers }> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    const payload = {
      Description: description || '',
      SecureParam: secret,
    };

    const syncHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'X-CSRF-Token': authData.csrfToken,
      ...(authData.cookies && authData.cookies.length > 0 && { 'Cookie': authData.cookies.join('; ') }),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const syncPath = `/api/v1/SecureParameters('${encodeURIComponent(credentialName)}')`;
    return await client.execute(
      'PUT',
      syncPath,
      syncHeaders,
      JSON.stringify(payload)
    );
  }

  async delete(targetConfig: any, credentialName: string, authData: any): Promise<any> {
    throw new Error('Delete operation not supported in Phase 1.');
  }
}

// ─────────────────────────────────────────────
// REGISTRY AND MAPPING
// ─────────────────────────────────────────────

export function getProviderForTargetType(type: string): { platform: string; providerName: string; provider: SynchronizationProvider } {
  if (type === 'SAP_BTP_INTEGRATION_SUITE') {
    return {
      platform: 'SAP Integration Suite',
      providerName: 'SapIntegrationSuiteProvider',
      provider: new SapIntegrationSuiteProvider(),
    };
  }
  throw new Error(`Unsupported target type: ${type}`);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function getCorrelationId(headers: Headers): string | null {
  const possibleHeaders = ['x-correlation-id', 'apibtp-correlationid', 'x-request-id', 'correlation-id', 'request-id'];
  for (const h of possibleHeaders) {
    const val = headers.get(h);
    if (val) return val;
  }
  return null;
}

function sanitizeRequestHeaders(headers: Record<string, string>): string {
  const sanitized = { ...headers };
  const keysToMask = ['authorization', 'cookie', 'client-secret', 'client_secret', 'x-csrf-token'];
  for (const key of Object.keys(sanitized)) {
    if (keysToMask.includes(key.toLowerCase())) {
      sanitized[key] = '******';
    }
  }
  return JSON.stringify(sanitized);
}

function serializeResponseHeaders(headers: Headers): string {
  const obj: Record<string, string> = {};
  headers.forEach((val, key) => {
    obj[key] = val;
  });
  return JSON.stringify(obj);
}

// ─────────────────────────────────────────────
// SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────

interface SyncOptions {
  executionType: 'AUTO' | 'MANUAL' | 'BULK' | 'API';
  parentHistoryId?: string;
}

/**
 * Triggers background synchronization of a credential to all eligible targets.
 * Runs asynchronously and isolates target executions.
 */
export async function triggerCredentialSync(
  credentialId: string,
  initiatedByUserId: string,
  options: SyncOptions = { executionType: 'AUTO' }
) {
  // Generate session ID for grouping
  const sessionId = crypto.randomUUID();

  // Defer execution using setTimeout to ensure database transaction commits
  setTimeout(async () => {
    try {
      // 1. Fetch latest credential details
      const credential = await prisma.credentialMaster.findUnique({
        where: { id: credentialId },
        include: {
          detailsNote: true,
        },
      });

      if (!credential || credential.isPersonal) {
        return;
      }

      // Check if credential type supports sync (Phase 1: SECURE_NOTE only)
      if (credential.type !== 'SECURE_NOTE' || !credential.detailsNote) {
        return;
      }

      // 2. Fetch all enabled targets
      const enabledTargets = await prisma.synchronizationTarget.findMany({
        where: { status: 'ENABLED' },
      });

      // Filter eligible targets dynamically at trigger-time based on categories, environments, types
      const eligibleTargets = enabledTargets.filter((target) => {
        const categories = (target.categories as string[]) || [];
        const environments = (target.environments as string[]) || [];
        const types = (target.types as string[]) || [];

        const categoryMatches = credential.category && categories.includes(credential.category);
        const environmentMatches = credential.environment && environments.includes(credential.environment);
        const typeMatches = types.includes('SECURE_NOTE');

        return categoryMatches && environmentMatches && typeMatches;
      });

      if (eligibleTargets.length === 0) {
        return;
      }

      // 3. Resolve actor details
      const actor = await prisma.user.findUnique({
        where: { id: initiatedByUserId },
        select: { email: true, name: true },
      });
      const initiatedByName = actor?.email || actor?.name || 'SYSTEM';

      const decryptedNote = decrypt(credential.detailsNote.noteEncrypted);

      // 4. Execute target syncs independently
      await Promise.all(
        eligibleTargets.map((target) =>
          executeSingleTargetSync(
            sessionId,
            target,
            credential,
            decryptedNote,
            initiatedByUserId,
            initiatedByName,
            options
          ).catch((err) => {
            console.error(`Unhandled error syncing target ${target.name}:`, err);
          })
        )
      );
    } catch (err) {
      console.error('Failed to execute triggerCredentialSync:', err);
    }
  }, 0);
}

/**
 * Synchronizes a single target platform.
 */
async function executeSingleTargetSync(
  sessionId: string,
  target: any,
  credential: any,
  decryptedNote: string,
  initiatedByUserId: string,
  initiatedByName: string,
  options: SyncOptions
) {
  const startedAt = new Date();
  const { platform, providerName, provider } = getProviderForTargetType(target.type);

  // Precreate History Record with PENDING/IN_PROGRESS status
  const historyRecord = await prisma.syncHistory.create({
    data: {
      sessionId,
      targetId: target.id,
      targetName: target.name,
      targetType: target.type,
      platform,
      provider: providerName,
      hostUrl: target.hostUrl,
      credentialId: credential.id,
      credentialName: credential.name,
      credentialType: credential.type,
      version: credential.version,
      category: credential.category,
      environment: credential.environment,
      operation: 'CREATE', // fallback default
      executionType: options.executionType,
      startedAt,
      completedAt: startedAt,
      durationMs: 0,
      initiatedById: initiatedByUserId,
      initiatedByName,
      status: 'IN_PROGRESS',
      parentHistoryId: options.parentHistoryId || null,
      endpoint: '',
      httpMethod: '',
    },
  });

  let status: 'SUCCESS' | 'FAILED' = 'FAILED';
  let operation: 'CREATE' | 'UPDATE' = 'CREATE';
  let httpStatus: number | null = null;
  let endpoint = '';
  let httpMethod = '';
  let requestHeadersString = '';
  let responseHeadersString = '';
  let providerCorrelationId: string | null = null;
  let errorMessage: string | null = null;

  try {
    // A. Authenticate
    const authData = await provider.authenticate(target);

    // B. Check Existence
    const exists = await provider.exists(target, credential.name, authData);
    operation = exists ? 'UPDATE' : 'CREATE';

    // C. Execute Sync Operation
    const syncHeadersMock = {
      'Authorization': 'Bearer ' + authData.accessToken,
      'X-CSRF-Token': authData.csrfToken,
      ...(authData.cookies && authData.cookies.length > 0 && { 'Cookie': authData.cookies.join('; ') }),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    requestHeadersString = sanitizeRequestHeaders(syncHeadersMock);

    endpoint = operation === 'CREATE'
      ? `/api/v1/SecureParameters`
      : `/api/v1/SecureParameters('${encodeURIComponent(credential.name)}')`;
    httpMethod = operation === 'CREATE' ? 'POST' : 'PUT';

    const syncRes = exists
      ? await provider.update(target, credential.name, credential.description || '', decryptedNote, authData)
      : await provider.create(target, credential.name, credential.description || '', decryptedNote, authData);

    httpStatus = syncRes.status;
    responseHeadersString = serializeResponseHeaders(syncRes.headers);
    providerCorrelationId = getCorrelationId(syncRes.headers);

    if (syncRes.status >= 200 && syncRes.status < 300) {
      status = 'SUCCESS';
    } else {
      status = 'FAILED';
      errorMessage = `HTTP error ${syncRes.status}: ${syncRes.text}`;
    }
  } catch (err: any) {
    status = 'FAILED';
    errorMessage = err.message || String(err);
    if (err.httpStatus) {
      httpStatus = err.httpStatus;
    }
  } finally {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    // Update History Record
    await prisma.syncHistory.update({
      where: { id: historyRecord.id },
      data: {
        status,
        operation,
        completedAt,
        durationMs,
        endpoint: endpoint || (operation === 'CREATE' ? '/api/v1/SecureParameters' : '/api/v1/SecureParameters(...)'),
        httpMethod: httpMethod || (operation === 'CREATE' ? 'POST' : 'PUT'),
        requestHeaders: status === 'FAILED' ? requestHeadersString : null,
        responseHeaders: status === 'FAILED' ? responseHeadersString : null,
        httpStatus,
        providerCorrelationId,
        errorMessage,
      },
    });

    // Create Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'SYNC_CREDENTIAL_ATTEMPT',
          credentialId: credential.id,
          performedById: initiatedByUserId,
          newValue: `Target: ${target.name}, Provider: ${providerName}, Operation: ${operation}, Result: ${status}`,
        },
      });
    } catch (auditErr) {
      console.error('Failed to create audit log for sync:', auditErr);
    }
  }
}
