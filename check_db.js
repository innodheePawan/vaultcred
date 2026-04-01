const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    // Check what fields actually exist on the runtime Prisma ApiClient model
    const client = await p.apiClient.findFirst();
    if (client) {
        console.log('ApiClient fields:', Object.keys(client));
        console.log('allowFileDownload:', client.allowFileDownload, typeof client.allowFileDownload);
        console.log('securityMode:', client.securityMode);
    } else {
        console.log('No clients found');
    }
}

main().catch(console.error).finally(() => p.$disconnect());
