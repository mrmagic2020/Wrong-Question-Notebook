import { getAnnouncement } from '@/lib/user-management';
import { AnnouncementEditor } from '@/components/admin/announcements/announcement-editor';

export default async function AdminAnnouncementsPage() {
  const announcement = await getAnnouncement();

  return <AnnouncementEditor initial={announcement} />;
}
