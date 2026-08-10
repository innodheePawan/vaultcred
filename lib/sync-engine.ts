import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { IntegrationSuiteClient, HttpMethod } from '@/lib/integration-suite-client';
import { logAudit } from '@/lib/actions/audit';
import crypto from 'crypto';

// ─────────────────────────────────────────────
// PROVIDER CONTRACT
// ─────────────────────────────────────────────

export interface DecryptedCredentialValues {
  note?: string;
  username?: string;
  password?: string;
  // OAuth fields
  clientId?: string;
  clientSecret?: string;
  tokenEndpoint?: string;
  scope?: string;
  clientAuthentication?: string;
  contentType?: string;
  resource?: string;
  audience?: string;
  customParameters?: any[];
}

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
  exists(targetConfig: any, credential: any, authData: any): Promise<boolean>;

  /**
   * Executes a Create operation on the destination platform.
   */
  create(
    targetConfig: any,
    credential: any,
    decryptedValues: DecryptedCredentialValues,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers; endpoint?: string; httpMethod?: string }>;

  /**
   * Executes an Update operation on the destination platform.
   */
  update(
    targetConfig: any,
    credential: any,
    decryptedValues: DecryptedCredentialValues,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers; endpoint?: string; httpMethod?: string }>;

  /**
   * Executes a Delete operation on the destination platform.
   */
  delete(targetConfig: any, credentialName: string, authData: any): Promise<any>;
}

// ─────────────────────────────────────────────
// SAP INTEGRATION SUITE PROVIDER IMPLEMENTATION
// ─────────────────────────────────────────────

function mapScopeContentType(contentType?: string): string {
  const ct = (contentType || '').toLowerCase();
  if (ct === 'application_json') {
    return 'json';
  }
  return 'urlencoded';
}

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

  async exists(targetConfig: any, credential: any, authData: any): Promise<boolean> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    const isPlain = credential.type === 'PASSWORD';
    const isOAuth = credential.type === 'API_OAUTH';
    let checkUrl = '';
    if (isPlain) {
      checkUrl = `/api/v1/UserCredentials('${encodeURIComponent(credential.name)}')`;
    } else if (isOAuth) {
      checkUrl = `/api/v1/OAuth2ClientCredentials('${encodeURIComponent(credential.name)}')`;
    } else {
      checkUrl = `/api/v1/SecureParameters('${encodeURIComponent(credential.name)}')`;
    }

    const checkHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'Accept': 'application/json',
    };

    try {
      const res = await client.execute('GET', checkUrl, checkHeaders);
      return res.status === 200;
    } catch (err: any) {
      if (err.httpStatus === 404) {
        return false;
      }
      throw err;
    }
  }

  async create(
    targetConfig: any,
    credential: any,
    decryptedValues: DecryptedCredentialValues,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers; endpoint?: string; httpMethod?: string }> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    let payload: any;
    let path = '';

    if (credential.type === 'PASSWORD') {
      payload = {
        Name: credential.name,
        Kind: 'default',
        Description: credential.description || '',
        User: decryptedValues.username || '',
        Password: decryptedValues.password || '',
        CompanyId: null,
      };
      path = '/api/v1/UserCredentials';
    } else if (credential.type === 'API_OAUTH') {
      const sapCustomParams = (decryptedValues.customParameters || []).map((param: any) => ({
        Key: param.name || param.Key || param.key || '',
        Value: param.value || param.Value || '',
        SendAsPartOf: (param.location || param.SendAsPartOf || 'body').toLowerCase(),
      }));

      payload = {
        Name: credential.name,
        Description: credential.description || '',
        TokenServiceUrl: decryptedValues.tokenEndpoint || '',
        ClientId: decryptedValues.clientId || '',
        ClientSecret: decryptedValues.clientSecret || '',
        ClientAuthentication: decryptedValues.clientAuthentication || 'header',
        Scope: decryptedValues.scope || '',
        ScopeContentType: mapScopeContentType(decryptedValues.contentType),
        Resource: decryptedValues.resource || '',
        Audience: decryptedValues.audience || '',
        CustomParameters: sapCustomParams,
      };
      path = '/api/v1/OAuth2ClientCredentials';
    } else {
      payload = {
        Name: credential.name,
        Description: credential.description || '',
        SecureParam: decryptedValues.note || '',
      };
      path = '/api/v1/SecureParameters';
    }

    const syncHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'X-CSRF-Token': authData.csrfToken,
      ...(authData.cookies && authData.cookies.length > 0 && { 'Cookie': authData.cookies.join('; ') }),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const res = await client.execute(
      'POST',
      path,
      syncHeaders,
      JSON.stringify(payload)
    );

    return {
      ...res,
      endpoint: path,
      httpMethod: 'POST',
    };
  }

  async update(
    targetConfig: any,
    credential: any,
    decryptedValues: DecryptedCredentialValues,
    authData: any
  ): Promise<{ status: number; text: string; headers: Headers; endpoint?: string; httpMethod?: string }> {
    const client = new IntegrationSuiteClient({
      hostUrl: targetConfig.hostUrl,
      tokenUrl: targetConfig.tokenUrl,
      clientId: targetConfig.clientId,
      clientSecret: decrypt(targetConfig.clientSecret),
      certificate: targetConfig.certificate ? decrypt(targetConfig.certificate) : null,
    });

    let payload: any;
    let path = '';

    if (credential.type === 'PASSWORD') {
      payload = {
        Name: credential.name,
        Kind: 'default',
        Description: credential.description || '',
        User: decryptedValues.username || '',
        Password: decryptedValues.password || '',
        CompanyId: null,
      };
      path = `/api/v1/UserCredentials('${encodeURIComponent(credential.name)}')`;
    } else if (credential.type === 'API_OAUTH') {
      payload = {
        Name: credential.name,
        Description: credential.description || '',
        TokenServiceUrl: decryptedValues.tokenEndpoint || '',
        ClientId: decryptedValues.clientId || '',
        ClientSecret: decryptedValues.clientSecret || '',
        ClientAuthentication: decryptedValues.clientAuthentication || 'header',
        Scope: decryptedValues.scope || '',
        ScopeContentType: mapScopeContentType(decryptedValues.contentType),
        Resource: decryptedValues.resource || '',
        Audience: decryptedValues.audience || '',
      };
      path = `/api/v1/OAuth2ClientCredentials('${encodeURIComponent(credential.name)}')`;
    } else {
      payload = {
        Description: credential.description || '',
        SecureParam: decryptedValues.note || '',
      };
      path = `/api/v1/SecureParameters('${encodeURIComponent(credential.name)}')`;
    }

    const syncHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'X-CSRF-Token': authData.csrfToken,
      ...(authData.cookies && authData.cookies.length > 0 && { 'Cookie': authData.cookies.join('; ') }),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const res = await client.execute(
      'PUT',
      path,
      syncHeaders,
      JSON.stringify(payload)
    );

    return {
      ...res,
      endpoint: path,
      httpMethod: 'PUT',
    };
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

function sanitizeRequestBody(body: string | null | undefined): string | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    const keysToMask = ['secureparam', 'password', 'clientsecret', 'certificate'];

    const maskObject = (obj: any): any => {
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          return obj.map(maskObject);
        }
        const masked = { ...obj };
        for (const key of Object.keys(masked)) {
          if (keysToMask.includes(key.toLowerCase())) {
            masked[key] = '******';
          } else if (typeof masked[key] === 'object') {
            masked[key] = maskObject(masked[key]);
          }
        }
        return masked;
      }
      return obj;
    };

    return JSON.stringify(maskObject(parsed));
  } catch {
    let masked = body;
    const regexes = [
      /(password=)[^&]*/gi,
      /(secureparam=)[^&]*/gi,
      /(client_secret=)[^&]*/gi,
      /(clientsecret=)[^&]*/gi
    ];
    for (const regex of regexes) {
      masked = masked.replace(regex, '$1******');
    }
    return masked;
  }
}

// ─────────────────────────────────────────────
// SYNCHRONIZATION ENGINE
// ─────────────────────────────────────────────

interface SyncOptions {
  executionType: 'AUTO' | 'MANUAL' | 'BULK' | 'API';
  parentHistoryId?: string;
  targetId?: string;
}

/**
 * Triggers background synchronization of a credential to all eligible targets.
 * Runs asynchronously and isolates target executions.
 */
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

  try {
    // 1. Fetch latest credential details
    const credential = await prisma.credentialMaster.findUnique({
      where: { id: credentialId },
      include: {
        detailsNote: true,
        detailsPassword: true,
        detailsApi: true,
      },
    });

    if (!credential || credential.isPersonal) {
      return;
    }

    // Check if credential type supports sync (Phase 1: SECURE_NOTE, PASSWORD, API_OAUTH)
    if (
      (credential.type !== 'SECURE_NOTE' || !credential.detailsNote) &&
      (credential.type !== 'PASSWORD' || !credential.detailsPassword) &&
      (credential.type !== 'API_OAUTH' || !credential.detailsApi)
    ) {
      return;
    }

    // 2. Fetch all enabled targets
    const enabledTargets = await prisma.synchronizationTarget.findMany({
      where: { status: 'ENABLED' },
    });

    // Filter eligible targets dynamically at trigger-time based on categories, environments, types
    let eligibleTargets = enabledTargets.filter((target) => {
      const categories = (target.categories as string[]) || [];
      const environments = (target.environments as string[]) || [];
      const types = (target.types as string[]) || [];

      const categoryMatches = credential.category && categories.includes(credential.category);
      const environmentMatches = credential.environment && environments.includes(credential.environment);
      const typeMatches = types.includes(credential.type);

      return categoryMatches && environmentMatches && typeMatches;
    });

    if (options.targetId) {
      eligibleTargets = eligibleTargets.filter((target) => target.id === options.targetId);
    }

    if (eligibleTargets.length === 0) {
      return;
    }

    // 3. Resolve actor details
    const actor = await prisma.user.findUnique({
      where: { id: initiatedByUserId },
      select: { email: true, name: true },
    });
    const initiatedByName = actor?.email || actor?.name || 'SYSTEM';

    let decryptedValues: DecryptedCredentialValues = {};
    if (credential.type === 'SECURE_NOTE' && credential.detailsNote) {
      const decryptedNote = decrypt(credential.detailsNote.noteEncrypted);
      decryptedValues = { note: decryptedNote };
    } else if (credential.type === 'PASSWORD' && credential.detailsPassword) {
      const decryptedPassword = decrypt(credential.detailsPassword.passwordEncrypted);
      decryptedValues = {
        username: credential.detailsPassword.username,
        password: decryptedPassword,
      };
    } else if (credential.type === 'API_OAUTH' && credential.detailsApi) {
      const d = credential.detailsApi;
      let decryptedParams: any[] = [];
      if (d.customParameters) {
        try {
          const jsonStr = decrypt(d.customParameters);
          decryptedParams = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Failed to decrypt customParameters in sync engine:', e);
        }
      }
      decryptedValues = {
        clientId: d.clientId || '',
        clientSecret: d.clientSecretEnc ? decrypt(d.clientSecretEnc) : '',
        tokenEndpoint: d.tokenEndpoint || '',
        scope: d.scope || '',
        clientAuthentication: d.clientAuthentication || 'header',
        contentType: d.contentType || 'application_x_www_form_urlencoded',
        resource: d.resource || '',
        audience: d.audience || '',
        customParameters: decryptedParams,
      };
    }

    // 4. Execute target syncs independently
    await Promise.all(
      eligibleTargets.map((target) =>
        executeSingleTargetSync(
          sessionId,
          target,
          credential,
          decryptedValues,
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
}

/**
 * Synchronizes a single target platform.
 */
async function executeSingleTargetSync(
  sessionId: string,
  target: any,
  credential: any,
  decryptedValues: DecryptedCredentialValues,
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
  let requestBodyString: string | null = null;
  let responseHeadersString = '';
  let responseBodyString: string | null = null;
  let providerCorrelationId: string | null = null;
  let errorMessage: string | null = null;

  try {
    // A. Authenticate
    const authData = await provider.authenticate(target);

    // B. Check Existence
    const checkHeaders = {
      'Authorization': `Bearer ${authData.accessToken}`,
      'Accept': 'application/json',
    };
    requestHeadersString = sanitizeRequestHeaders(checkHeaders);

    const exists = await provider.exists(target, credential, authData);
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

    // Reconstruct request payload for history logging
    const isPlain = credential.type === 'PASSWORD';
    const isOAuth = credential.type === 'API_OAUTH';
    let payload: any;
    if (exists) {
      if (isPlain) {
        payload = {
          Name: credential.name,
          Kind: 'default',
          Description: credential.description || '',
          User: decryptedValues.username || '',
          Password: decryptedValues.password || '',
          CompanyId: null,
        };
      } else if (isOAuth) {
        payload = {
          Name: credential.name,
          Description: credential.description || '',
          TokenServiceUrl: decryptedValues.tokenEndpoint || '',
          ClientId: decryptedValues.clientId || '',
          ClientSecret: decryptedValues.clientSecret || '',
          ClientAuthentication: decryptedValues.clientAuthentication || 'header',
          Scope: decryptedValues.scope || '',
          ScopeContentType: mapScopeContentType(decryptedValues.contentType),
          Resource: decryptedValues.resource || '',
          Audience: decryptedValues.audience || '',
        };
      } else {
        payload = {
          Description: credential.description || '',
          SecureParam: decryptedValues.note || '',
        };
      }
    } else {
      if (isPlain) {
        payload = {
          Name: credential.name,
          Kind: 'default',
          Description: credential.description || '',
          User: decryptedValues.username || '',
          Password: decryptedValues.password || '',
          CompanyId: null,
        };
      } else if (isOAuth) {
        const sapCustomParams = (decryptedValues.customParameters || []).map((param: any) => ({
          Key: param.name || param.Key || param.key || '',
          Value: param.value || param.Value || '',
          SendAsPartOf: (param.location || param.SendAsPartOf || 'body').toLowerCase(),
        }));
        payload = {
          Name: credential.name,
          Description: credential.description || '',
          TokenServiceUrl: decryptedValues.tokenEndpoint || '',
          ClientId: decryptedValues.clientId || '',
          ClientSecret: decryptedValues.clientSecret || '',
          ClientAuthentication: decryptedValues.clientAuthentication || 'header',
          Scope: decryptedValues.scope || '',
          ScopeContentType: mapScopeContentType(decryptedValues.contentType),
          Resource: decryptedValues.resource || '',
          Audience: decryptedValues.audience || '',
          CustomParameters: sapCustomParams,
        };
      } else {
        payload = {
          Name: credential.name,
          Description: credential.description || '',
          SecureParam: decryptedValues.note || '',
        };
      }
    }
    requestBodyString = sanitizeRequestBody(JSON.stringify(payload));

    const syncRes = exists
      ? await provider.update(target, credential, decryptedValues, authData)
      : await provider.create(target, credential, decryptedValues, authData);

    httpStatus = syncRes.status;
    endpoint = syncRes.endpoint || '';
    httpMethod = syncRes.httpMethod || (exists ? 'PUT' : 'POST');
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
    let detailedError = err.message || String(err);
    if (err.code) {
      detailedError += ` (Code: ${err.code})`;
    }
    if (err.endpoint) {
      detailedError += ` (Endpoint: ${err.endpoint})`;
    }
    if (err.responseBody) {
      const displayBody = err.responseBody.length > 150
        ? err.responseBody.substring(0, 150) + '...'
        : err.responseBody;
      detailedError += ` (Response: ${displayBody})`;
    }
    if (err.cause) {
      detailedError += ` (Cause: ${err.cause.message || String(err.cause)})`;
    }
    errorMessage = detailedError;
    if (err.httpStatus) {
      httpStatus = err.httpStatus;
    }
    if (err.headers) {
      responseHeadersString = serializeResponseHeaders(err.headers);
      providerCorrelationId = getCorrelationId(err.headers);
    }
    if (err.responseBody) {
      responseBodyString = sanitizeRequestBody(err.responseBody);
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
        endpoint: endpoint || (operation === 'CREATE'
          ? (credential.type === 'PASSWORD' ? '/api/v1/UserCredentials' : (credential.type === 'API_OAUTH' ? '/api/v1/OAuth2ClientCredentials' : '/api/v1/SecureParameters'))
          : (credential.type === 'PASSWORD' ? `/api/v1/UserCredentials('${encodeURIComponent(credential.name)}')` : (credential.type === 'API_OAUTH' ? `/api/v1/OAuth2ClientCredentials('${encodeURIComponent(credential.name)}')` : `/api/v1/SecureParameters('${encodeURIComponent(credential.name)}')`))),
        httpMethod: httpMethod || (operation === 'CREATE' ? 'POST' : 'PUT'),
        requestHeaders: status === 'FAILED' ? requestHeadersString : null,
        requestBody: status === 'FAILED' ? requestBodyString : null,
        responseHeaders: status === 'FAILED' ? responseHeadersString : null,
        responseBody: status === 'FAILED' ? responseBodyString : null,
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
