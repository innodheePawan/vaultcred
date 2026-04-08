import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
    console.log("Starting test...");
    
    // Grab first user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found");
        return;
    }
    
    console.log("Testing deep query for user:", user.email);
    
    console.time("DeepQuery");
    const userDeep = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            userGroups: {
                include: {
                    group: {
                        include: {
                            access: {
                                include: {
                                    accessGroup: {
                                        include: { policies: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    console.timeEnd("DeepQuery");
    
    console.log("Policies found for user:", userDeep?.userGroups[0]?.group?.access?.map(a => a.accessGroup?.policies?.length));
}

runTest()
    .then(() => prisma.$disconnect())
    .catch(console.error);
