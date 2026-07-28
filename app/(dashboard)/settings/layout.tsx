import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import ClientSettingsLayout from './ClientSettingsLayout';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';

export default async function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) redirect('/login');

    // Guard: only roles with VIEW+ on SETTINGS or SYNC features can access
    const ctx = await getSafeUserContext(session.user.id);
    const canViewSettings = canAccess(ctx, 'FEATURE:SETTINGS', 'VIEW') ||
                           canAccess(ctx, 'FEATURE:SYNC_TARGETS', 'VIEW') ||
                           canAccess(ctx, 'FEATURE:SYNC_HISTORY', 'VIEW');

    if (!canViewSettings) {
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
        <ClientSettingsLayout role={session.user.role}>
            {children}
        </ClientSettingsLayout>
    );
}
