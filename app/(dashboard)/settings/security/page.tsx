import { getSystemSettings } from '@/lib/actions/settings';
import SecuritySettingsForm from '@/components/admin/settings/SecuritySettingsForm';

import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';

export const dynamic = 'force-dynamic';

export default async function SecuritySettingsPage() {
    const session = await auth();
    const settings = await getSystemSettings();
    const ctx = await getSafeUserContext(session?.user?.id || '');
    const canEdit = canAccess(ctx, 'FEATURE:SETTINGS', 'EDIT');

    return <SecuritySettingsForm initialSettings={settings} canEdit={canEdit} />;
}
