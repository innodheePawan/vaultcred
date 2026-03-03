import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../lib/crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables for the standalone script
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting License Registry Key Encryption Migration ---');
    console.log('Checking for unencrypted reg_key entries...');

    try {
        const allEntries = await prisma.licenseRegistry.findMany();
        let updatedCount = 0;

        for (const entry of allEntries) {
            let isUnencrypted = false;

            // Heuristic to check if a key is unencrypted.
            // Our encryption format is iv:authtag:hex, so it contains colons.
            // Unencrypted keys like 'ACTIVATION_STATUS' do not.
            // Also, we can attempt to decrypt it. If it fails, it's likely unencrypted plain text.
            try {
                // Try decrypting. If it succeeds, it's already encrypted.
                decrypt(entry.regKey);
                // console.log(`Key ${entry.regKey.substring(0, 15)}... is already encrypted.`);
            } catch (e) {
                // Decryption failed. This means it's plain text.
                isUnencrypted = true;
            }

            if (isUnencrypted) {
                console.log(`Found unencrypted key: ${entry.regKey}`);
                const encryptedKey = encrypt(entry.regKey);

                // We need to create a new row with the encrypted key,
                // and delete the old unencrypted row, because regKey is the primary key.

                await prisma.$transaction([
                    prisma.licenseRegistry.create({
                        data: {
                            regKey: encryptedKey,
                            regValue: entry.regValue,
                            createdAt: entry.createdAt,
                            updatedAt: new Date()
                        }
                    }),
                    prisma.licenseRegistry.delete({
                        where: { regKey: entry.regKey }
                    })
                ]);

                console.log(`Successfully migrated key: ${entry.regKey} -> ${encryptedKey.substring(0, 15)}...`);
                updatedCount++;
            }
        }

        console.log(`\nMigration completed. Migrated ${updatedCount} entries.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
