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

  // ==========================================
  // SECTION A: SECURE_NOTE SYNCHRONIZATION TEST
  // ==========================================
  console.log('\n--- SECURE_NOTE SYNCHRONIZATION TEST ---');

  // 2. Create or Find a SECURE_NOTE Target
  let targetNote = await prisma.synchronizationTarget.findFirst({
    where: { name: 'Test SAP Target SECURE_NOTE' },
  });

  if (!targetNote) {
    targetNote = await prisma.synchronizationTarget.create({
      data: {
        name: 'Test SAP Target SECURE_NOTE',
        type: 'SAP_BTP_INTEGRATION_SUITE',
        status: 'ENABLED',
        hostUrl: 'http://localhost:9999',
        tokenUrl: 'http://localhost:9999/oauth/token',
        clientId: 'dummy-client-id',
        clientSecret: encrypt('dummy-client-secret'),
        tenantLabel: 'mock-tenant-note',
        categories: ['General'],
        types: ['SECURE_NOTE'],
        environments: ['Production'],
      },
    });
  } else {
    await prisma.synchronizationTarget.update({
      where: { id: targetNote.id },
      data: { status: 'ENABLED' },
    });
  }
  console.log(`Using SECURE_NOTE Target: ${targetNote.name} (${targetNote.id})`);

  // 3. Create or Find a SECURE_NOTE Credential
  let credentialNote = await prisma.credentialMaster.findFirst({
    where: { name: 'TestSecureNoteForSync' },
  });

  if (!credentialNote) {
    credentialNote = await prisma.credentialMaster.create({
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
  console.log(`Using SECURE_NOTE Credential: ${credentialNote.name} (${credentialNote.id})`);

  // 4. Trigger Sync
  console.log('Triggering SECURE_NOTE sync engine...');
  await triggerCredentialSync(credentialNote.id, user.id);

  // 5. Wait for execution to complete
  console.log('Waiting for SECURE_NOTE sync execution to finish...');
  let finishedNote = false;
  for (let i = 0; i < 30; i++) {
    const records = await prisma.syncHistory.findMany({
      where: { credentialId: credentialNote.id },
    });
    if (records.length > 0 && records.every(r => r.status !== 'IN_PROGRESS')) {
      finishedNote = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 6. Query SECURE_NOTE Sync History
  const historiesNote = await prisma.syncHistory.findMany({
    where: { credentialId: credentialNote.id },
    orderBy: { startedAt: 'desc' },
  });

  console.log(`Found ${historiesNote.length} SECURE_NOTE Sync History records:`);
  for (const h of historiesNote) {
    console.log(`- ID: ${h.id}`);
    console.log(`  Target: ${h.targetName} (${h.hostUrl})`);
    console.log(`  Operation: ${h.operation}`);
    console.log(`  Status: ${h.status}`);
    console.log(`  Endpoint (Fallback or Actual): ${h.endpoint}`);
    console.log(`  HTTP Method: ${h.httpMethod}`);
    console.log(`  ErrorMessage: ${h.errorMessage}`);
    console.log('----------------------------------------');
  }

  // ==========================================
  // SECTION B: PASSWORD (PLAIN CREDENTIALS) SYNCHRONIZATION TEST
  // ==========================================
  console.log('\n--- PASSWORD SYNCHRONIZATION TEST ---');

  // 7. Create PASSWORD Sync Target (Eligible)
  let targetPasswordEligible = await prisma.synchronizationTarget.findFirst({
    where: { name: 'Test PASSWORD Target' },
  });

  if (!targetPasswordEligible) {
    targetPasswordEligible = await prisma.synchronizationTarget.create({
      data: {
        name: 'Test PASSWORD Target',
        type: 'SAP_BTP_INTEGRATION_SUITE',
        status: 'ENABLED',
        hostUrl: 'http://localhost:9999',
        tokenUrl: 'http://localhost:9999/oauth/token',
        clientId: 'dummy-client-id',
        clientSecret: encrypt('dummy-client-secret'),
        tenantLabel: 'mock-tenant-pwd-el',
        categories: ['General'],
        types: ['PASSWORD'],
        environments: ['Production'],
      },
    });
  } else {
    await prisma.synchronizationTarget.update({
      where: { id: targetPasswordEligible.id },
      data: { status: 'ENABLED', types: ['PASSWORD'] },
    });
  }
  console.log(`Using Eligible PASSWORD Target: ${targetPasswordEligible.name} (${targetPasswordEligible.id})`);

  // 8. Create PASSWORD Sync Target (Ineligible - Type Disabled)
  let targetPasswordIneligible = await prisma.synchronizationTarget.findFirst({
    where: { name: 'Test PASSWORD Target DisabledType' },
  });

  if (!targetPasswordIneligible) {
    targetPasswordIneligible = await prisma.synchronizationTarget.create({
      data: {
        name: 'Test PASSWORD Target DisabledType',
        type: 'SAP_BTP_INTEGRATION_SUITE',
        status: 'ENABLED',
        hostUrl: 'http://localhost:9999',
        tokenUrl: 'http://localhost:9999/oauth/token',
        clientId: 'dummy-client-id',
        clientSecret: encrypt('dummy-client-secret'),
        tenantLabel: 'mock-tenant-pwd-in',
        categories: ['General'],
        types: ['SECURE_NOTE'], // PASSWORD type disabled
        environments: ['Production'],
      },
    });
  } else {
    await prisma.synchronizationTarget.update({
      where: { id: targetPasswordIneligible.id },
      data: { status: 'ENABLED', types: ['SECURE_NOTE'] },
    });
  }
  console.log(`Using Ineligible PASSWORD Target: ${targetPasswordIneligible.name} (${targetPasswordIneligible.id})`);

  // 9. Create PASSWORD Credential
  let credentialPassword = await prisma.credentialMaster.findFirst({
    where: { name: 'TestPasswordForSync' },
  });

  if (!credentialPassword) {
    credentialPassword = await prisma.credentialMaster.create({
      data: {
        name: 'TestPasswordForSync',
        type: 'PASSWORD',
        category: 'General',
        environment: 'Production',
        isPersonal: false,
        version: 1,
        createdBy: { connect: { id: user.id } },
        lastModifiedBy: { connect: { id: user.id } },
        detailsPassword: {
          create: {
            username: 'sap_sync_user',
            passwordEncrypted: encrypt('SuperSecretPassword123!'),
          },
        },
      },
      include: {
        detailsPassword: true,
      },
    });
  }
  console.log(`Using PASSWORD Credential: ${credentialPassword.name} (${credentialPassword.id})`);

  // 10. Trigger PASSWORD Sync
  console.log('Triggering PASSWORD sync...');
  await triggerCredentialSync(credentialPassword.id, user.id);

  // 11. Wait for execution to complete
  console.log('Waiting for PASSWORD sync execution to finish...');
  let finishedPassword = false;
  for (let i = 0; i < 30; i++) {
    const records = await prisma.syncHistory.findMany({
      where: { credentialId: credentialPassword.id },
    });
    // Check if the history record for the eligible target is finished
    if (records.length > 0 && records.every(r => r.status !== 'IN_PROGRESS')) {
      finishedPassword = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 12. Query and Validate PASSWORD Sync Results
  const historiesPassword = await prisma.syncHistory.findMany({
    where: { credentialId: credentialPassword.id },
    orderBy: { startedAt: 'desc' },
  });

  console.log(`Found ${historiesPassword.length} PASSWORD Sync History records:`);
  for (const h of historiesPassword) {
    console.log(`- ID: ${h.id}`);
    console.log(`  Target: ${h.targetName} (${h.hostUrl})`);
    console.log(`  Operation: ${h.operation}`);
    console.log(`  Status: ${h.status}`);
    console.log(`  Endpoint (Fallback or Actual): ${h.endpoint}`);
    console.log(`  HTTP Method: ${h.httpMethod}`);
    console.log(`  ErrorMessage: ${h.errorMessage}`);
    console.log('----------------------------------------');
  }

  // Validate that ONLY the eligible target received the sync history record
  const eligibleRecord = historiesPassword.find(h => h.targetId === targetPasswordEligible!.id);
  const ineligibleRecord = historiesPassword.find(h => h.targetId === targetPasswordIneligible!.id);

  if (eligibleRecord) {
    console.log('✅ Eligible target sync history record exists.');
  } else {
    console.error('❌ Missing sync history record for eligible target!');
  }

  if (!ineligibleRecord) {
    console.log('✅ Ineligible target skipped successfully (no sync history record created).');
  } else {
    console.error('❌ Found sync history record for ineligible target that should have been skipped!');
  }

  // ==========================================
  // SECTION C: CLEANUP
  // ==========================================
  console.log('\nCleaning up mock database records...');
  
  // Clean SECURE_NOTE records
  await prisma.syncHistory.deleteMany({
    where: { credentialId: credentialNote.id },
  });
  await prisma.credSecureNote.deleteMany({
    where: { credentialId: credentialNote.id },
  });
  await prisma.credentialMaster.delete({
    where: { id: credentialNote.id },
  });
  await prisma.synchronizationTarget.delete({
    where: { id: targetNote.id },
  });

  // Clean PASSWORD records
  await prisma.syncHistory.deleteMany({
    where: { credentialId: credentialPassword.id },
  });
  await prisma.credPassword.deleteMany({
    where: { credentialId: credentialPassword.id },
  });
  await prisma.credentialMaster.delete({
    where: { id: credentialPassword.id },
  });
  await prisma.synchronizationTarget.delete({
    where: { id: targetPasswordEligible.id },
  });
  await prisma.synchronizationTarget.delete({
    where: { id: targetPasswordIneligible.id },
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
