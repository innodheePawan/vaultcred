import { getSystemSettings } from '@/lib/actions/settings';
import SecuritySettingsForm from '@/components/admin/settings/SecuritySettingsForm';

export const dynamic = 'force-dynamic';

export default async function SecuritySettingsPage() {
    const settings = await getSystemSettings();
    return <SecuritySettingsForm initialSettings={settings} />;
}
