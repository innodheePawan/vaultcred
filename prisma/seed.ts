import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/utils/password'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com'
    const password = process.env.ADMIN_PASSWORD || 'password123'

    if (process.env.NODE_ENV === 'production' && password === 'password123') {
        console.warn('WARNING: Using default password in production!')
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Admin User',
            passwordHash: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
        },
    })

    console.log({ user })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
