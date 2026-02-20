import { notFound } from 'next/navigation';
import {
  getUserProfileWithServiceRole,
  getUserContentStatistics,
  getUserActivity,
  getUserStorageUsage,
} from '@/lib/user-management';
import { getQuotaUsage } from '@/lib/usage-quota';
import { UserDetailClient } from '@/components/admin/users/user-detail-client';

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [profile, contentStats, quotaUsage, activity, storageUsage] =
    await Promise.all([
      getUserProfileWithServiceRole(id),
      getUserContentStatistics(id),
      getQuotaUsage(id).catch(() => null),
      getUserActivity(id, 10),
      getUserStorageUsage(id),
    ]);

  if (!profile) {
    notFound();
  }

  return (
    <UserDetailClient
      profile={profile}
      contentStats={contentStats}
      quotaUsage={quotaUsage}
      activity={activity}
      storageUsage={storageUsage}
    />
  );
}
