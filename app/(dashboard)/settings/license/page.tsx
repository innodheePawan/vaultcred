import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getLicenseState } from '@/lib/license-enforcement';
import LicenseSettings from '@/components/admin/settings/LicenseSettings';

export const dynamic = 'force-dynamic'; // Ensure we get fresh DB state

export default async function SettingsLicensePage() {
    const session = await auth();

    // Strict block for non-ADMIN
    if (!session?.user || session.user.role !== 'ADMIN') {
        redirect('/settings');
    }

    // Always fetch latest DB state directly for the settings panel
    const licenseInfo = await getLicenseState(true);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">License Management</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    View your current license details and activate renewals to extend access.
                </p>
            </div>

            <LicenseSettings initialLicense={licenseInfo} />
        </div>
    );
}
