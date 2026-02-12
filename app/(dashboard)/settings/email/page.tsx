import { getSystemSettings } from '@/lib/actions/settings';
import SmtpSettingsForm from '@/components/admin/settings/SmtpSettingsForm';

export const dynamic = 'force-dynamic';

export default async function EmailSettingsPage() {
    const settings = await getSystemSettings();
    return <SmtpSettingsForm initialSettings={settings} />;
}
