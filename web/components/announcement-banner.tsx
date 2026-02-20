'use client';

import { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type AnnouncementType = 'info' | 'warning' | 'success';

interface Announcement {
  enabled: boolean;
  message: string;
  type: AnnouncementType;
}

const styles: Record<AnnouncementType, { bg: string; icon: typeof Info }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/40 text-blue-800 dark:text-blue-200',
    icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200',
    icon: CheckCircle,
  },
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.announcement?.enabled && data.announcement.message) {
          setAnnouncement(data.announcement as Announcement);
        }
      })
      .catch(() => {});
  }, []);

  if (!announcement || !announcement.enabled || dismissed) {
    return null;
  }

  const style = styles[announcement.type] || styles.info;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'px-4 py-2.5 border-b text-sm flex items-center gap-3',
        style.bg
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <p className="flex-1">{announcement.message}</p>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
