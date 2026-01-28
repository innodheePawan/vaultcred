import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- USER LIST ---');
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log('No users found in database.');
    } else {
        console.table(users.map(u => ({ id: u.id, email: u.email, role: u.role, status: u.status })));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
