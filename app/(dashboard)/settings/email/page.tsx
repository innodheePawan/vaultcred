import { getSystemSettings } from '@/lib/actions/settings';
import SmtpSettingsForm from '@/components/admin/settings/SmtpSettingsForm';

import { auth } from '@/lib/auth';
import { getSafeUserContext, canAccess } from '@/lib/iam/permissions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmailSettingsPage() {
    const session = await auth();
    if (!session?.user) redirect('/login');

    const ctx = await getSafeUserContext(session.user.id);
    const canView = canAccess(ctx, 'FEATURE:SETTINGS', 'VIEW');
    if (!canView) {
        redirect('/dashboard');
    }

    const settings = await getSystemSettings();
    const canEdit = canAccess(ctx, 'FEATURE:SETTINGS', 'EDIT');

    return <SmtpSettingsForm initialSettings={settings} canEdit={canEdit} />;
}
