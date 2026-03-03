
import { getSystemSettings } from '@/lib/actions/settings';
import LoginForm from '@/components/auth/LoginForm';
import { getLicenseState } from '@/lib/license-enforcement';
import Link from 'next/link';

export default async function LoginPage() {
    const settings = await getSystemSettings();
    const logoUrl = settings?.logoUrl;
    const applicationName = settings?.applicationName || 'CredSecure';

    // License enforcement — render inline block instead of redirect to avoid serverless loop
    let licenseBlocked = false;
    let licenseMessage = '';
    try {
        const licenseInfo = await getLicenseState(true);
        if (licenseInfo.state === 'UNACTIVATED') {
            licenseBlocked = true;
            licenseMessage = 'This system has not been activated yet. Please activate your license to continue.';
        } else if (licenseInfo.state === 'COMPROMISED') {
            licenseBlocked = true;
            licenseMessage = 'License integrity check failed. Please re-activate your license.';
        } else if (licenseInfo.state === 'LOCKED') {
            licenseBlocked = true;
            licenseMessage = 'Your license has expired. Please contact your administrator to renew.';
        }
    } catch {
        // If license check fails (e.g., DB unreachable), allow login attempt
    }

    return (
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50 dark:bg-gray-900">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">

                {/* Logo Section */}
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
                {licenseBlocked ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-6 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 mb-4">
                            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
                            System Not Available
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-6">
                            {licenseMessage}
                        </p>
                        <Link
                            href="/activation"
                            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
                        >
                            Go to Activation
                        </Link>
                    </div>
                ) : (
                    <>
                        <LoginForm />
                        <p className="mt-10 text-center text-sm text-gray-500">
                            Received an invite code?{' '}
                            <a href="/invite" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
                                Redeem it here
                            </a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
