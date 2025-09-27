import { createClient } from '@/lib/supabase/server';
import { getAdminSettings } from '@/lib/user-management';
import { AdminSettingsForm } from '@/components/admin/admin-settings-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return null;
  }

  // Fetch settings data
  const settings = await getAdminSettings();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">
            Configure application-wide settings and preferences
          </p>
        </div>
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Modify system configuration and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminSettingsForm settings={settings} />
        </CardContent>
      </Card>
    </div>
  );
}
