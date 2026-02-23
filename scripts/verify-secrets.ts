
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../lib/crypto';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('🔒 Starting One-Time Secret Verification...');

    const secretValue = 'ThisIsASuperSecretValue123!';
    const token = randomBytes(32).toString('hex');

    // 1. Create a Secret directly in DB (simulating createOneTimeSecret without auth requirement)
    // We need a user ID. Let's try to find one or create a dummy one.
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('No user found, creating a test user...');
        user = await prisma.user.create({
            data: {
                email: 'test-admin@example.com',
                role: 'ADMIN',
                name: 'Test Admin'
            }
        });
    }

    console.log(`👤 Using user: ${user.email} (${user.id})`);

    const encryptedData = encrypt(secretValue);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    console.log('📝 Creating test secret in DB...');
    const secret = await prisma.oneTimeSecret.create({
        data: {
            name: 'Verification Secret',
            secretData: encryptedData,
            token,
            expiresAt,
            maxViews: 2,
            sharedVia: 'LINK',
            createdById: user.id
        }
    });
    console.log(`✅ Secret created with ID: ${secret.id}`);

    // 2. Validate Token (Simulate getOneTimeSecret)
    console.log('🔍 Validating token...');
    const fetchedSecret = await prisma.oneTimeSecret.findUnique({ where: { token } });

    if (!fetchedSecret) {
        console.error('❌ Secret not found by token!');
        process.exit(1);
    }

    if (fetchedSecret.status !== 'ACTIVE') {
        console.error(`❌ Secret status is ${fetchedSecret.status}, expected ACTIVE`);
        process.exit(1);
    }
    console.log('✅ Token validation passed (Secret exists and is active)');

    // 3. Reveal Secret (Simulate revealSecret)
    console.log('🔓 Revealing secret (Attempt 1)...');

    // Increment view
    const updated = await prisma.oneTimeSecret.update({
        where: { id: secret.id },
        data: { currentViews: { increment: 1 } }
    });

    const decrypted = decrypt(updated.secretData);

    if (decrypted !== secretValue) {
        console.error(`❌ Decrypted value mismatch! Expected: ${secretValue}, Got: ${decrypted}`);
        process.exit(1);
    }
    console.log('✅ Secret revealed and decrypted correctly.');
    console.log(`👀 Current Views: ${updated.currentViews}`);

    // 4. Check View Limits
    console.log('🔓 Revealing secret (Attempt 2 - Max Views)...');

    const updated2 = await prisma.oneTimeSecret.update({
        where: { id: secret.id },
        data: { currentViews: { increment: 1 } }
    });
    console.log(`👀 Current Views: ${updated2.currentViews}`);

    // Now it should be expired or at limit
    if (updated2.currentViews >= updated2.maxViews) {
        console.log('⚠️ Max views reached. Next attempt should fail/expire.');
        // Simulate expiry check that happens in getOneTimeSecret
        await prisma.oneTimeSecret.update({
            where: { id: secret.id },
            data: { status: 'EXPIRED' }
        });
        console.log('✅ Secret marked as EXPIRED.');
    }

    console.log('🎉 Verification Completed Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
