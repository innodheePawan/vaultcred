import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Deduplicating Credentials ---');

    // 1. Find all duplicate names
    const duplicates = await prisma.$queryRaw`
        SELECT credential_name, COUNT(*) as count
        FROM credential_master
        GROUP BY credential_name
        HAVING COUNT(*) > 1
    `;

    console.log(`Found ${(duplicates as any[]).length} duplicate credential names.`);

    for (const dup of (duplicates as any[])) {
        console.log(`Processing duplicates for: ${dup.credential_name}`);

        // 2. Get all entries for this name, ordered by updatedAt (keep latest)
        const entries = await prisma.credentialMaster.findMany({
            where: { name: dup.credential_name },
            orderBy: { lastModifiedOn: 'desc' },
            select: { id: true, name: true, lastModifiedOn: true }
        });

        // 3. Keep the first item, delete the rest
        const toDelete = entries.slice(1);
        console.log(`  Keeping latest entry: ${entries[0].id} (${entries[0].lastModifiedOn})`);
        console.log(`  Deleting ${toDelete.length} older entries...`);

        for (const entry of toDelete) {
            await prisma.credentialMaster.delete({
                where: { id: entry.id }
            });
            console.log(`    Deleted: ${entry.id}`);
        }
    }

    console.log('--- Deduplication Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
