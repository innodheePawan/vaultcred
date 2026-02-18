import SetupTwoFactorForm from './setup-form';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function SetupTwoFactorPage() {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    // If 2FA is already enabled, redirect appropriately
    if ((session.user as any).twoFactorEnabled) {
        if ((session.user as any).isExternal) {
            redirect('/vendor/access');
        }
        redirect('/dashboard');
    }

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-2xl font-bold leading-9 text-gray-900 dark:text-white">
                    Setup Two-Factor Authentication
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                    Scan the QR code with your authenticator app to secure your account.
                </p>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white dark:bg-gray-800 px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-200 dark:border-gray-700">
                    <SetupTwoFactorForm user={session.user} />
                </div>
            </div>
        </div>
    );
}
