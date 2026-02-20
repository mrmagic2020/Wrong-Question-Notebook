import { getAllUsersWithCount } from '@/lib/user-management';
import { UsersPageClient } from '@/components/admin/users/users-page-client';

export default async function AdminUsersPage() {
  const { users, total_count } = await getAllUsersWithCount(20, 0);

  return (
    <UsersPageClient initialUsers={users} initialTotalCount={total_count} />
  );
}
