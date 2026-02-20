import { getAdminSettings } from '@/lib/user-management';
import { SettingsPageClient } from '@/components/admin/settings/settings-page-client';

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return <SettingsPageClient settings={settings} />;
}
