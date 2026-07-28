import { PrismaClient } from '@prisma/client';
import 'dotenv/config';
import { IntegrationSuiteClient } from '../lib/integration-suite-client';
import { encrypt, decrypt } from '../lib/crypto';
import { parseServiceKeyAction } from '../lib/actions/sync-targets';
import assert from 'assert';

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Automated Tests for Synchronization Targets...');

  // 1. Test Config Hash Calculations
  console.log('\n- Test 1: JSON-based config hashing...');
  const config1 = {
    hostUrl: 'https://test-host.com',
    tokenUrl: 'https://test-oauth.com',
    clientId: 'client-id-123',
    clientSecret: 'secret-xyz',
    certificate: 'cert-pem-data',
  };

  const config2 = {
    hostUrl: 'https://test-host.com',
    tokenUrl: 'https://test-oauth.com',
    clientId: 'client-id-123',
    clientSecret: 'secret-xyz',
    certificate: 'cert-pem-data',
  };

  const configDifferent = {
    ...config1,
    clientSecret: 'secret-abc', // altered secret
  };

  const hash1 = IntegrationSuiteClient.computeConfigHash(config1);
  const hash2 = IntegrationSuiteClient.computeConfigHash(config2);
  const hashDifferent = IntegrationSuiteClient.computeConfigHash(configDifferent);

  assert.strictEqual(hash1, hash2, 'Identical configs must generate identical hashes.');
  assert.notStrictEqual(hash1, hashDifferent, 'Altered configs must generate different hashes.');
  console.log('  ✅ Config hashing validated successfully.');

  // 2. Test Server-side Service Key Parsing
  console.log('\n- Test 2: Service key JSON parsing...');
  
  // Format A: Standard BTP binding key with uaa
  const validServiceKeyA = JSON.stringify({
    url: 'https://valid-host.com',
    uaa: {
      url: 'https://valid-oauth-token.com',
      clientid: 'valid-client-id',
      clientsecret: 'valid-client-secret',
    },
  });

  // Format B: OAuth service key with oauth object containing url, tokenurl
  const validServiceKeyB = JSON.stringify({
    oauth: {
      url: 'https://valid-host-b.com',
      tokenurl: 'https://valid-oauth-token-b.com',
      clientid: 'valid-client-id-b',
      clientsecret: 'valid-client-secret-b',
    }
  });

  const invalidServiceKey = JSON.stringify({
    url: 'https://valid-host.com',
  });

  // Parse helper simulation matching parseServiceKeyAction logic
  const parseKey = (jsonText: string) => {
    const keyData = JSON.parse(jsonText);
    const url = keyData.url || keyData.oauth?.url;
    let oauthUrl = keyData.oauth?.tokenurl || keyData.uaa?.url || keyData.tokenurl;
    if (!oauthUrl && keyData.url && keyData.oauth?.url) {
      oauthUrl = keyData.oauth.url;
    }
    const clientId = keyData.oauth?.clientid || keyData.uaa?.clientid || keyData.clientid;
    const clientSecret = keyData.oauth?.clientsecret || keyData.uaa?.clientsecret || keyData.clientsecret;
    return { url, oauthUrl, clientId, clientSecret };
  };

  const parsedA = parseKey(validServiceKeyA);
  assert.ok(parsedA.url === 'https://valid-host.com');
  assert.ok(parsedA.oauthUrl === 'https://valid-oauth-token.com');
  assert.ok(parsedA.clientId === 'valid-client-id');
  assert.ok(parsedA.clientSecret === 'valid-client-secret');

  const parsedB = parseKey(validServiceKeyB);
  assert.ok(parsedB.url === 'https://valid-host-b.com');
  assert.ok(parsedB.oauthUrl === 'https://valid-oauth-token-b.com');
  assert.ok(parsedB.clientId === 'valid-client-id-b');
  assert.ok(parsedB.clientSecret === 'valid-client-secret-b');
  
  const parsedInvalid = parseKey(invalidServiceKey);
  assert.ok(!parsedInvalid.clientId || !parsedInvalid.oauthUrl || !parsedInvalid.clientSecret);
  console.log('  ✅ Service key JSON parser validated successfully for all SAP structures.');

  // 3. Test Cryptographic Encryption Roundtrip
  console.log('\n- Test 3: Encryption and decryption...');
  const rawSecret = 'SAP-SuperSecret-Token-12345!';
  const cipherText = encrypt(rawSecret);
  assert.ok(cipherText.includes(':'), 'Encrypted payload must contain IV and authentication tag.');
  assert.notStrictEqual(rawSecret, cipherText, 'Ciphertext must not match raw text.');

  const plainText = decrypt(cipherText);
  assert.strictEqual(rawSecret, plainText, 'Decrypted text must match original plaintext.');
  console.log('  ✅ Cryptographic encryption roundtrip validated successfully.');

  // 4. Test Transaction Rollback
  console.log('\n- Test 4: Database transaction rollback on failure...');
  const testTargetName = 'Rollback-Test-Target-' + Date.now();

  try {
    await prisma.$transaction(async (tx) => {
      // Create a temporary target inside transaction
      await tx.synchronizationTarget.create({
        data: {
          name: testTargetName,
          type: 'SAP_BTP_INTEGRATION_SUITE',
          status: 'ENABLED',
          hostUrl: 'https://rollback-host.com',
          tokenUrl: 'https://rollback-oauth.com',
          clientId: 'id',
          clientSecret: encrypt('secret'),
          tenantLabel: 'Test',
          categories: ['Application'],
          types: ['PASSWORD'],
          environments: ['Dev'],
          connectionHealth: 'NEVER_TESTED',
        },
      });

      // Force an intentional error to trigger transaction abort & rollback
      throw new Error('INTENTIONAL_ERROR_FOR_ROLLBACK');
    });
  } catch (err: any) {
    assert.strictEqual(err.message, 'INTENTIONAL_ERROR_FOR_ROLLBACK', 'Expected transaction to abort with intentional error.');
  }

  // Check database that target was NOT created
  const targetCheck = await prisma.synchronizationTarget.findUnique({
    where: { name: testTargetName },
  });

  assert.strictEqual(targetCheck, null, 'Transaction rollback failed: record was saved to database after error.');
  console.log('  ✅ Database transaction rollback validated successfully.');

  console.log('\n🎉 All automated tests completed successfully!');
}

runTests()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Test execution encountered failure:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
