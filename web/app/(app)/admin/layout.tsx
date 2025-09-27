import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isCurrentUserAdmin } from '@/lib/user-management';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    redirect('/subjects');
  }

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
