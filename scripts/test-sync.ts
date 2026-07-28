import { prisma } from '../lib/prisma';
import { encrypt } from '../lib/crypto';
import { triggerCredentialSync } from '../lib/sync-engine';

async function main() {
  console.log('--- START SYNC ENGINE TEST ---');

  // 1. Create or Find a test user
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test-sync@credsecure.local',
        name: 'Sync Tester',
        passwordHash: 'dummy',
        role: 'ADMIN',
      },
    });
  }
  console.log(`Using User: ${user.email} (${user.id})`);

  // 2. Create or Find a Synchronization Target
  let target = await prisma.synchronizationTarget.findFirst({
    where: { name: 'Test SAP Target' },
  });

  if (!target) {
    target = await prisma.synchronizationTarget.create({
      data: {
        name: 'Test SAP Target',
        type: 'SAP_BTP_INTEGRATION_SUITE',
        status: 'ENABLED',
        hostUrl: 'http://localhost:9999',
        tokenUrl: 'http://localhost:9999/oauth/token',
        clientId: 'dummy-client-id',
        clientSecret: encrypt('dummy-client-secret'),
        tenantLabel: 'mock-tenant',
        categories: ['General'],
        types: ['SECURE_NOTE'],
        environments: ['Production'],
      },
    });
  } else {
    // Ensure it is enabled
    await prisma.synchronizationTarget.update({
      where: { id: target.id },
      data: { status: 'ENABLED' },
    });
  }
  console.log(`Using Sync Target: ${target.name} (${target.id})`);

  // 3. Create or Find a Credential
  let credential = await prisma.credentialMaster.findFirst({
    where: { name: 'TestSecureNoteForSync' },
  });

  if (!credential) {
    credential = await prisma.credentialMaster.create({
      data: {
        name: 'TestSecureNoteForSync',
        type: 'SECURE_NOTE',
        category: 'General',
        environment: 'Production',
        isPersonal: false,
        version: 1,
        createdBy: { connect: { id: user.id } },
        lastModifiedBy: { connect: { id: user.id } },
        detailsNote: {
          create: {
            noteEncrypted: encrypt('This is a highly secure note for synchronization!'),
          },
        },
      },
      include: {
        detailsNote: true,
      },
    });
  }
  console.log(`Using Credential: ${credential.name} (${credential.id})`);

  // 4. Trigger Sync
  console.log('Triggering sync engine...');
  await triggerCredentialSync(credential.id, user.id);

  // 5. Wait for execution to complete
  console.log('Waiting for sync execution to finish...');
  let finished = false;
  for (let i = 0; i < 30; i++) {
    const records = await prisma.syncHistory.findMany({
      where: { credentialId: credential.id },
    });
    if (records.length > 0 && records.every(r => r.status !== 'IN_PROGRESS')) {
      finished = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 6. Query Sync History
  const histories = await prisma.syncHistory.findMany({
    where: { credentialId: credential.id },
    orderBy: { startedAt: 'desc' },
  });

  console.log(`Found ${histories.length} Sync History records:`);
  for (const h of histories) {
    console.log(`- ID: ${h.id}`);
    console.log(`  Session ID: ${h.sessionId}`);
    console.log(`  Target: ${h.targetName} (${h.hostUrl})`);
    console.log(`  Platform: ${h.platform}`);
    console.log(`  Operation: ${h.operation}`);
    console.log(`  Execution Type: ${h.executionType}`);
    console.log(`  Status: ${h.status}`);
    console.log(`  HTTP Status: ${h.httpStatus}`);
    console.log(`  Request Headers (Sanitized): ${h.requestHeaders}`);
    console.log(`  ErrorMessage: ${h.errorMessage}`);
    console.log('----------------------------------------');
  }

  // 7. Clean up Mock Target and Credential
  console.log('Cleaning up mock database records...');
  await prisma.syncHistory.deleteMany({
    where: { credentialId: credential.id },
  });
  await prisma.credSecureNote.deleteMany({
    where: { credentialId: credential.id },
  });
  await prisma.credentialMaster.delete({
    where: { id: credential.id },
  });
  await prisma.synchronizationTarget.delete({
    where: { id: target.id },
  });

  console.log('--- TEST COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Test script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
