import { getSystemSettings } from '@/lib/actions/settings';
import GeneralSettingsForm from '@/components/admin/settings/GeneralSettingsForm';

import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GeneralSettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const ctx = await getSafeUserContext(session.user.id);
    const canView = canAccess(ctx, 'FEATURE:SETTINGS', 'VIEW');
    if (!canView) {
        redirect('/dashboard');
    }

    const settings = await getSystemSettings();
    const canEdit = canAccess(ctx, 'FEATURE:SETTINGS', 'EDIT');

    return <GeneralSettingsForm initialSettings={settings} canEdit={canEdit} />;
}
