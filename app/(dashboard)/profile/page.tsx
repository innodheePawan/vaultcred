import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import UserProfileForm from '@/components/profile/UserProfileForm';
import { prisma } from '@/lib/prisma'; // Import prisma

export default async function ProfilePage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Profile</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Manage your personal account settings.
                </p>
            </div>

            <UserProfileForm
                user={{
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: (user as any).profileImage,
                }}
            />
        </div>
    );
}
