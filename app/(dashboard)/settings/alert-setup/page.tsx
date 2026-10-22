import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { getAlertSettings, getAlertDispatchLogs } from '@/lib/actions/alert-settings';
import AlertSetupForm from '@/components/admin/settings/AlertSetupForm';
import { ShieldAlert } from 'lucide-react';

export default async function AlertSetupPage() {
    const session = await auth();
    if (!session?.user?.id) redirect('/login');

    const ctx = await getSafeUserContext(session.user.id);
    const canView = canAccess(ctx, 'FEATURE:GLOBAL_EXPIRY_ALERT', 'VIEW') || ctx.role === 'ADMIN' || ctx.role === 'SUPER_ADMIN';

    if (!canView) {
        return (
            <div className="max-w-4xl mx-auto py-8 px-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-center gap-4">
                    <ShieldAlert className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                    <div>
                        <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                            Access Restricted
                        </h3>
                        <p className="text-yellow-700 dark:text-yellow-300">
                            You do not have permission to access global alert policies. Contact your administrator if you require access.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const settingsData = await getAlertSettings();
    const logsData = await getAlertDispatchLogs(25);

    if (settingsData.error) {
        return (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {settingsData.error}
            </div>
        );
    }

    return (
        <AlertSetupForm
            initialSettings={{
                tier1Days: settingsData.tier1Days ?? 60,
                tier2Days: settingsData.tier2Days ?? 30,
                tier3Days: settingsData.tier3Days ?? 15,
                lastEvaluationAt: settingsData.lastEvaluationAt ?? null,
                canEdit: settingsData.canEdit ?? false,
                userRole: settingsData.userRole ?? 'USER',
                isScopedAdmin: settingsData.isScopedAdmin ?? false,
            }}
            initialLogs={logsData.data || []}
        />
    );
}
