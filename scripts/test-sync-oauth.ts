import { PrismaClient } from '@prisma/client';
import http from 'http';
import { encrypt } from '../lib/crypto';
import { triggerCredentialSync } from '../lib/sync-engine';
import assert from 'assert';

const prisma = new PrismaClient();
const PORT = 9999;

async function main() {
  console.log('--- START OAUTH SYNC INTEGRATION TEST ---');

  // Request storage to assert mock server calls
  const requestsReceived: { method: string; url: string; headers: http.IncomingHttpHeaders; body?: string }[] = [];
  let credentialExists = false;

  // Start HTTP Mock Server
  const mockServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      const log = {
        method: req.method || '',
        url: req.url || '',
        headers: req.headers,
        body: body || undefined,
      };
      requestsReceived.push(log);
      console.log(`[Mock Server] Received: ${log.method} ${log.url}`);

      // Handle OAuth authentication
      if (log.method === 'POST' && log.url === '/oauth/token') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ access_token: 'mock-access-token' }));
        return;
      }

      // Handle CSRF Token Fetch
      if (log.method === 'GET' && log.url === '/api/v1/') {
        res.writeHead(200, {
          'x-csrf-token': 'mock-csrf-token-123',
          'set-cookie': '__Host-csrf-client-id=mock-session-cookie; Path=/; Secure; HttpOnly',
        });
        res.end();
        return;
      }

      // Handle exists check
      if (log.method === 'GET' && log.url === `/api/v1/OAuth2ClientCredentials('${encodeURIComponent('TestOAuthCredForSync')}')`) {
        if (credentialExists) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ d: { Name: 'TestOAuthCredForSync' } }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Not found' } }));
        }
        return;
      }

      // Handle POST (Create)
      if (log.method === 'POST' && log.url === '/api/v1/OAuth2ClientCredentials') {
        credentialExists = true;
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ d: { Name: 'TestOAuthCredForSync' } }));
        return;
      }

      // Handle PUT (Update)
      if (log.method === 'PUT' && log.url === `/api/v1/OAuth2ClientCredentials('${encodeURIComponent('TestOAuthCredForSync')}')`) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ d: { Name: 'TestOAuthCredForSync' } }));
        return;
      }

      res.writeHead(404);
      res.end();
    });
  });

  await new Promise<void>((resolve) => mockServer.listen(PORT, resolve));
  console.log(`Mock Server listening on http://localhost:${PORT}`);

  try {
    // 1. Create or Find a test user
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test-sync-oauth@credsecure.local',
          name: 'OAuth Sync Tester',
          passwordHash: 'dummy',
          role: 'ADMIN',
        },
      });
    }
    console.log(`Using User: ${user.email} (${user.id})`);

    // 2. Create or Find an API_OAUTH Target
    let target = await prisma.synchronizationTarget.findFirst({
      where: { name: 'Test OAuth Target' },
    });

    if (!target) {
      target = await prisma.synchronizationTarget.create({
        data: {
          name: 'Test OAuth Target',
          type: 'SAP_BTP_INTEGRATION_SUITE',
          status: 'ENABLED',
          hostUrl: `http://localhost:${PORT}`,
          tokenUrl: `http://localhost:${PORT}/oauth/token`,
          clientId: 'dummy-target-client-id',
          clientSecret: encrypt('dummy-target-client-secret'),
          tenantLabel: 'mock-tenant-oauth',
          categories: ['Integration'],
          types: ['API_OAUTH'],
          environments: ['Dev'],
        },
      });
    } else {
      await prisma.synchronizationTarget.update({
        where: { id: target.id },
        data: { status: 'ENABLED', types: ['API_OAUTH'] },
      });
    }
    console.log(`Using Target: ${target.name} (${target.id})`);

    // 3. Create or Find API_OAUTH Credential
    let credential = await prisma.credentialMaster.findFirst({
      where: { name: 'TestOAuthCredForSync' },
    });

    const encryptedCustomParams = encrypt(JSON.stringify([
      { name: 'tenant', value: 'my-tenant-id', location: 'BODY' },
      { name: 'apiKey', value: '12345-abcde', location: 'URL' },
    ]));

    if (!credential) {
      credential = await prisma.credentialMaster.create({
        data: {
          name: 'TestOAuthCredForSync',
          type: 'API_OAUTH',
          category: 'Integration',
          environment: 'Dev',
          isPersonal: false,
          version: 1,
          createdBy: { connect: { id: user.id } },
          lastModifiedBy: { connect: { id: user.id } },
          detailsApi: {
            create: {
              clientId: 'my-client-id',
              clientSecretEnc: encrypt('my-secret-value'),
              tokenEndpoint: 'https://oauth.provider.com/token',
              scope: 'read write',
              clientAuthentication: 'header',
              contentType: 'application_json',
              resource: 'https://api.resource.com',
              audience: 'https://audience.com',
              customParameters: encryptedCustomParams,
            },
          },
        },
        include: {
          detailsApi: true,
        },
      });
    }
    console.log(`Using API_OAUTH Credential: ${credential.name} (${credential.id})`);

    // ==========================================
    // TEST FLOW A: CREATE OPERATION (POST)
    // ==========================================
    console.log('\n--- TESTING CREATE OPERATION (POST) ---');
    requestsReceived.length = 0; // Clear requests logs

    await triggerCredentialSync(credential.id, user.id);

    // Wait for async execution
    console.log('Waiting for CREATE sync execution...');
    let finishedCreate = false;
    for (let i = 0; i < 10; i++) {
      const records = await prisma.syncHistory.findMany({
        where: { credentialId: credential.id },
      });
      if (records.length > 0 && records.every(r => r.status !== 'IN_PROGRESS')) {
        finishedCreate = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(finishedCreate, 'Create synchronization did not finish in time.');

    // Verify requests sent to Mock Server
    const postRequest = requestsReceived.find(r => r.method === 'POST' && r.url === '/api/v1/OAuth2ClientCredentials');
    assert.ok(postRequest, 'Mock server did not receive POST /api/v1/OAuth2ClientCredentials request!');
    console.log('✅ POST request was successfully executed.');

    // Verify request payload values
    const postBody = JSON.parse(postRequest.body || '{}');
    assert.strictEqual(postBody.Name, 'TestOAuthCredForSync');
    assert.strictEqual(postBody.ClientId, 'my-client-id');
    assert.strictEqual(postBody.ClientSecret, 'my-secret-value'); // Should be decrypted
    assert.strictEqual(postBody.ClientAuthentication, 'header');
    assert.strictEqual(postBody.Scope, 'read write');
    assert.strictEqual(postBody.ScopeContentType, 'json');
    assert.strictEqual(postBody.Resource, 'https://api.resource.com');
    assert.strictEqual(postBody.Audience, 'https://audience.com');
    
    // Verify custom parameters mapping
    assert.ok(Array.isArray(postBody.CustomParameters));
    assert.strictEqual(postBody.CustomParameters.length, 2);
    assert.strictEqual(postBody.CustomParameters[0].Key, 'tenant');
    assert.strictEqual(postBody.CustomParameters[0].Value, 'my-tenant-id');
    assert.strictEqual(postBody.CustomParameters[0].SendAsPartOf, 'body');
    assert.strictEqual(postBody.CustomParameters[1].Key, 'apiKey');
    assert.strictEqual(postBody.CustomParameters[1].Value, '12345-abcde');
    assert.strictEqual(postBody.CustomParameters[1].SendAsPartOf, 'url');
    console.log('✅ POST payload and custom parameters verified successfully.');

    // Verify Sync History
    const syncHistoryCreate = await prisma.syncHistory.findFirst({
      where: { credentialId: credential.id, operation: 'CREATE' },
      orderBy: { startedAt: 'desc' },
    });
    assert.ok(syncHistoryCreate, 'Sync history record for CREATE not found.');
    assert.strictEqual(syncHistoryCreate.status, 'SUCCESS');
    assert.strictEqual(syncHistoryCreate.httpMethod, 'POST');
    assert.strictEqual(syncHistoryCreate.endpoint, '/api/v1/OAuth2ClientCredentials');
    
    // Assert request and response bodies and headers are logged on success
    assert.ok(syncHistoryCreate.requestHeaders, 'requestHeaders should be logged on success');
    assert.ok(syncHistoryCreate.requestBody, 'requestBody should be logged on success');
    assert.ok(syncHistoryCreate.responseHeaders, 'responseHeaders should be logged on success');
    assert.ok(syncHistoryCreate.responseBody, 'responseBody should be logged on success');
    
    console.log('✅ CREATE Sync History with request/response headers/bodies verified successfully.');

    // ==========================================
    // TEST FLOW B: UPDATE OPERATION (PUT)
    // ==========================================
    console.log('\n--- TESTING UPDATE OPERATION (PUT) ---');
    requestsReceived.length = 0; // Clear requests logs

    // Increment version to trigger sync normally, or just trigger directly
    await prisma.credentialMaster.update({
      where: { id: credential.id },
      data: { version: { increment: 1 } },
    });

    await triggerCredentialSync(credential.id, user.id);

    // Wait for async execution
    console.log('Waiting for UPDATE sync execution...');
    let finishedUpdate = false;
    for (let i = 0; i < 10; i++) {
      const records = await prisma.syncHistory.findMany({
        where: { credentialId: credential.id, version: 2 },
      });
      if (records.length > 0 && records.every(r => r.status !== 'IN_PROGRESS')) {
        finishedUpdate = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(finishedUpdate, 'Update synchronization did not finish in time.');

    // Verify PUT request
    const putRequest = requestsReceived.find(r => r.method === 'PUT' && r.url === `/api/v1/OAuth2ClientCredentials('${encodeURIComponent('TestOAuthCredForSync')}')`);
    assert.ok(putRequest, 'Mock server did not receive PUT /api/v1/OAuth2ClientCredentials request!');
    console.log('✅ PUT request was successfully executed.');

    // Verify PUT request payload does NOT contain CustomParameters
    const putBody = JSON.parse(putRequest.body || '{}');
    assert.strictEqual(putBody.Name, 'TestOAuthCredForSync');
    assert.strictEqual(putBody.ClientId, 'my-client-id');
    assert.strictEqual(putBody.ClientSecret, 'my-secret-value');
    assert.strictEqual(putBody.CustomParameters, undefined, 'PUT payload must NOT contain CustomParameters.');
    console.log('✅ PUT payload verified successfully (excluding CustomParameters).');

    // Verify Sync History
    const syncHistoryUpdate = await prisma.syncHistory.findFirst({
      where: { credentialId: credential.id, operation: 'UPDATE' },
      orderBy: { startedAt: 'desc' },
    });
    assert.ok(syncHistoryUpdate, 'Sync history record for UPDATE not found.');
    assert.strictEqual(syncHistoryUpdate.status, 'SUCCESS');
    assert.strictEqual(syncHistoryUpdate.httpMethod, 'PUT');
    assert.strictEqual(syncHistoryUpdate.endpoint, `/api/v1/OAuth2ClientCredentials('${encodeURIComponent('TestOAuthCredForSync')}')`);
    console.log('✅ UPDATE Sync History verified successfully.');

    // Verify Audit Logs
    const auditLogs = await prisma.auditLog.findMany({
      where: { credentialId: credential.id },
    });
    assert.ok(auditLogs.length > 0, 'No audit logs found for credential.');
    const attemptLog = auditLogs.find(l => l.action === 'SYNC_CREDENTIAL_ATTEMPT');
    assert.ok(attemptLog, 'SYNC_CREDENTIAL_ATTEMPT audit log missing.');
    console.log('✅ Audit Logs verified successfully.');

    // Verify Manual Retry behavior (retry original CREATE history record)
    console.log('\n--- TESTING MANUAL RETRY ---');
    requestsReceived.length = 0; // Clear requests logs
    
    // Simulate retrySynchronizationAction triggering logic
    await triggerCredentialSync(credential.id, user.id, {
      executionType: 'MANUAL',
      parentHistoryId: syncHistoryCreate.id,
      targetId: target.id,
    });

    console.log('Waiting for RETRY sync execution...');
    let finishedRetry = false;
    for (let i = 0; i < 10; i++) {
      const records = await prisma.syncHistory.findMany({
        where: { credentialId: credential.id, executionType: 'MANUAL' },
      });
      if (records.length > 0 && records.every(r => r.status !== 'IN_PROGRESS')) {
        finishedRetry = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.ok(finishedRetry, 'Retry synchronization did not finish in time.');

    // Verify GET/PUT calls executed during retry (since it exists, it should perform PUT)
    const retryPutRequest = requestsReceived.find(r => r.method === 'PUT');
    assert.ok(retryPutRequest, 'Manual retry did not execute PUT request.');
    const retryHistory = await prisma.syncHistory.findFirst({
      where: { credentialId: credential.id, executionType: 'MANUAL' },
    });
    assert.strictEqual(retryHistory?.status, 'SUCCESS');
    assert.strictEqual(retryHistory?.parentHistoryId, syncHistoryCreate.id);
    console.log('✅ Manual Retry verified successfully.');

    // ==========================================
    // CLEANUP
    // ==========================================
    console.log('\nCleaning up database test records...');
    await prisma.syncHistory.deleteMany({
      where: { credentialId: credential.id },
    });
    await prisma.credApiOAuth.deleteMany({
      where: { credentialId: credential.id },
    });
    await prisma.credentialMaster.delete({
      where: { id: credential.id },
    });
    await prisma.synchronizationTarget.delete({
      where: { id: target.id },
    });

    console.log('🎉 INTEGRATION TEST PASSED SUCCESSFULLY!');
  } finally {
    // Stop server
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    console.log('Mock Server stopped.');
  }
}

main()
  .catch((err) => {
    console.error('❌ Integration test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
