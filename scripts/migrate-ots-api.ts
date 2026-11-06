import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigration() {
    console.log('[Migration] Starting reviewed, non-destructive migration for OTS External API...');

    try {
        // Query database name
        const dbNameResult: any = await prisma.$queryRawUnsafe('SELECT DATABASE() AS current_db');
        const dbName = dbNameResult[0]?.current_db;
        console.log(`[Migration] Connected to database: ${dbName}`);

        // Helper to check if a column exists
        const checkColumnExists = async (table: string, column: string): Promise<boolean> => {
            const rows: any = await prisma.$queryRawUnsafe(
                `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
                dbName,
                table,
                column
            );
            return rows.length > 0;
        };

        // Helper to check if an index exists
        const checkIndexExists = async (table: string, indexName: string): Promise<boolean> => {
            const rows: any = await prisma.$queryRawUnsafe(
                `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
                dbName,
                table,
                indexName
            );
            return rows.length > 0;
        };

        // 1. Add recipient_name if missing
        if (!(await checkColumnExists('one_time_secrets', 'recipient_name'))) {
            console.log('[Migration] Adding column `recipient_name` to `one_time_secrets`...');
            await prisma.$executeRawUnsafe(
                `ALTER TABLE \`one_time_secrets\` ADD COLUMN \`recipient_name\` VARCHAR(191) NULL;`
            );
        } else {
            console.log('[Migration] Column `recipient_name` already exists.');
        }

        // 2. Add reference_id if missing
        if (!(await checkColumnExists('one_time_secrets', 'reference_id'))) {
            console.log('[Migration] Adding column `reference_id` to `one_time_secrets`...');
            await prisma.$executeRawUnsafe(
                `ALTER TABLE \`one_time_secrets\` ADD COLUMN \`reference_id\` VARCHAR(100) NULL;`
            );
        } else {
            console.log('[Migration] Column `reference_id` already exists.');
        }

        // 3. Add api_client_id if missing
        if (!(await checkColumnExists('one_time_secrets', 'api_client_id'))) {
            console.log('[Migration] Adding column `api_client_id` to `one_time_secrets`...');
            await prisma.$executeRawUnsafe(
                `ALTER TABLE \`one_time_secrets\` ADD COLUMN \`api_client_id\` VARCHAR(191) NULL;`
            );
        } else {
            console.log('[Migration] Column `api_client_id` already exists.');
        }

        // 4. Add foreign key if missing
        const fkRows: any = await prisma.$queryRawUnsafe(
            `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'one_time_secrets' AND CONSTRAINT_NAME = 'fk_one_time_secrets_api_client'`,
            dbName
        );
        if (fkRows.length === 0) {
            console.log('[Migration] Adding foreign key `fk_one_time_secrets_api_client`...');
            try {
                await prisma.$executeRawUnsafe(
                    `ALTER TABLE \`one_time_secrets\` ADD CONSTRAINT \`fk_one_time_secrets_api_client\` FOREIGN KEY (\`api_client_id\`) REFERENCES \`api_clients\`(\`api_client_id\`) ON DELETE SET NULL ON UPDATE CASCADE;`
                );
            } catch (e: any) {
                console.warn('[Migration] Note on foreign key creation:', e.message);
            }
        } else {
            console.log('[Migration] Foreign key `fk_one_time_secrets_api_client` already exists.');
        }

        // 5. Add unique index if missing
        if (!(await checkIndexExists('one_time_secrets', 'uq_ots_client_reference'))) {
            console.log('[Migration] Adding unique index `uq_ots_client_reference` on (`api_client_id`, `reference_id`)...');
            await prisma.$executeRawUnsafe(
                `ALTER TABLE \`one_time_secrets\` ADD UNIQUE INDEX \`uq_ots_client_reference\` (\`api_client_id\`, \`reference_id\`);`
            );
        } else {
            console.log('[Migration] Unique index `uq_ots_client_reference` already exists.');
        }

        console.log('[Migration] Non-destructive database migration completed successfully.');
    } catch (error: any) {
        console.error('[Migration Error]:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runMigration();

