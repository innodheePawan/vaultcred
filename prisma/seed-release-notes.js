const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    try {
        const releaseNotes = [
            { version: 'v2.4.0', title: 'License Activation: Fixed timeout errors during license activation and renewal.', tag: 'Fix', sortOrder: 1 },
            { version: 'v2.4.0', title: 'License Performance: Optimized DB transactions with batch operations for faster activation.', tag: 'Performance', sortOrder: 2 },
            { version: 'v2.4.0', title: 'License Renewal: Activation keys are now securely persisted for seamless offline renewals.', tag: 'Enhancement', sortOrder: 3 },
            { version: 'v2.4.0', title: '2FA Setup: Added toggle to choose between Google and Microsoft Authenticator.', tag: 'Feature', sortOrder: 4 },
            { version: 'v2.4.0', title: '2FA Input: Verification code input is now locked after submission to prevent edits.', tag: 'Fix', sortOrder: 5 },
            { version: 'v2.4.0', title: 'License Banner: "Renew Now" button now correctly navigates to the License Settings page.', tag: 'Fix', sortOrder: 6 },
            { version: 'v2.4.0', title: 'Dashboard Charts: Resolved negative width/height rendering warning in Recharts.', tag: 'Fix', sortOrder: 7 },
        ];

        // Clear existing notes for this version to avoid duplicates on re-run
        await prisma.releaseNote.deleteMany({
            where: { version: 'v2.4.0' }
        });

        await prisma.releaseNote.createMany({
            data: releaseNotes
        });

        console.log('Successfully seeded ' + releaseNotes.length + ' release notes for v2.4.0');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
