
import { getSystemSettings } from '@/lib/actions/settings';
import LoginForm from '@/components/auth/LoginForm';

export default async function LoginPage() {
    const settings = await getSystemSettings();
    const logoUrl = settings?.logoUrl;
    const applicationName = settings?.applicationName || 'VaultSecure';

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">

                {/* Logo Section - Full Width */}
                <div className="flex justify-center mb-6 w-full">
                    {logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={applicationName}
                            className="w-full h-auto object-contain"
                        />
                    ) : (
                        <div className="h-24 w-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg">
                            {applicationName.substring(0, 1)}
                        </div>
                    )}
                </div>

                <h2 className="mt-2 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-white">
                    Sign in to your account
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <LoginForm />

                <p className="mt-10 text-center text-sm text-gray-500">
                    Received an invite code?{' '}
                    <a href="/invite" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                        Redeem it here
                    </a>
                </p>
            </div>
        </div>
    );
}
