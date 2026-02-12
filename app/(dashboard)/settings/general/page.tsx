import { getSystemSettings } from '@/lib/actions/settings';
import GeneralSettingsForm from '@/components/admin/settings/GeneralSettingsForm';

export const dynamic = 'force-dynamic';

export default async function GeneralSettingsPage() {
    const settings = await getSystemSettings();
    return <GeneralSettingsForm initialSettings={settings} />;
}
