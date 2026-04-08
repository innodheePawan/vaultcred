import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLicenseState } from '@/lib/license-enforcement';
import LicenseSettings from '@/components/admin/settings/LicenseSettings';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';

export const dynamic = 'force-dynamic'; // Ensure we get fresh DB state

export default async function SettingsLicensePage() {
    const session = await auth();

    // Strict block for non-ADMIN or roles without SETTINGS access
    if (!session?.user?.id) {
        redirect('/settings');
    }
    const ctx = await getSafeUserContext(session.user.id);
    const canViewLicense = canAccess(ctx, 'FEATURE:SETTINGS', 'VIEW');
    
    if (!canViewLicense) {
        redirect('/settings');
    }

    // Always fetch latest DB state directly for the settings panel
    const licenseInfo = await getLicenseState(true);
    const canEditLicense = canAccess(ctx, 'FEATURE:SETTINGS', 'EDIT');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">License Management</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View your current license details and activate renewals to extend access.
                </p>
            </div>

            <LicenseSettings initialLicense={licenseInfo} canEdit={canEditLicense} />
        </div>
    );
}
