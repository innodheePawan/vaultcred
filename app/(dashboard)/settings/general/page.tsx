import { getSystemSettings } from '@/lib/actions/settings';
import GeneralSettingsForm from '@/components/admin/settings/GeneralSettingsForm';

import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';

export const dynamic = 'force-dynamic';

export default async function GeneralSettingsPage() {
    const session = await auth();
    const settings = await getSystemSettings();
    const ctx = await getSafeUserContext(session?.user?.id || '');
    const canEdit = canAccess(ctx, 'FEATURE:SETTINGS', 'EDIT');

    return <GeneralSettingsForm initialSettings={settings} canEdit={canEdit} />;
}
