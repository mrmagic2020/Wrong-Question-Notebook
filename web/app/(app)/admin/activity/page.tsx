import { getFilteredActivity } from '@/lib/user-management';
import { ActivityPageClient } from '@/components/admin/activity/activity-page-client';

export default async function AdminActivityPage() {
  const { activities, total_count } = await getFilteredActivity({
    limit: 20,
    offset: 0,
  });

  return (
    <ActivityPageClient
      initialActivities={activities}
      initialTotalCount={total_count}
    />
  );
}
