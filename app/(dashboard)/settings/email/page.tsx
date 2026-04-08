import { getSystemSettings } from '@/lib/actions/settings';
import SmtpSettingsForm from '@/components/admin/settings/SmtpSettingsForm';

import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';

export const dynamic = 'force-dynamic';

export default async function EmailSettingsPage() {
    const session = await auth();
    const settings = await getSystemSettings();
    const ctx = await getSafeUserContext(session?.user?.id || '');
    const canEdit = canAccess(ctx, 'FEATURE:SETTINGS', 'EDIT');

    return <SmtpSettingsForm initialSettings={settings} canEdit={canEdit} />;
}
