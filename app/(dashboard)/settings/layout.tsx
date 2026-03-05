import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import SettingsNav from '@/components/admin/settings/SettingsNav';

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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

    return (
        <div className="flex flex-col min-h-[calc(100vh-10rem)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-5xl mx-auto space-y-8">
                <div className="text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">System Settings</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Manage global configuration, email services, and security policies.
                    </p>
                </div>

                <SettingsNav role={session.user.role} />

                <div className="mt-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
