import { getSystemSettings, getDatabaseInfo } from '@/lib/actions/settings';
import SystemSettingsForm from '@/components/admin/SystemSettingsForm';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    // Only Admins can access system settings
    if (session.user.role !== 'ADMIN') {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-4">
                    <ShieldAlert className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                    <div>
                        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Access Restricted</h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                            Only Administrators can manage system settings.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const settings = await getSystemSettings();
    const dbInfo = await getDatabaseInfo();

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-3xl space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">System Settings</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Customize the look and feel of your VaultSecure instance.
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="px-4 py-5 sm:p-6">
                        <SystemSettingsForm initialSettings={settings} dbInfo={dbInfo} />
                    </div>
                </div>
            </div>
        </div>
    );
}
