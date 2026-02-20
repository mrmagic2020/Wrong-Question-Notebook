import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserSuperAdmin } from '@/lib/user-management';
import { AdminLayoutShell } from '@/components/admin/admin-layout-shell';
import { ROUTES } from '@/lib/constants';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin – Wrong Question Notebook',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  const isSuperAdmin = await isCurrentUserSuperAdmin();
  if (!isSuperAdmin) {
    redirect(ROUTES.SUBJECTS);
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
