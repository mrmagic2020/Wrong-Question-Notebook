import Link from 'next/link';
import { Users, Settings, Activity, Megaphone, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

const actions = [
  {
    title: 'Manage Users',
    description: 'View and manage user accounts',
    href: ROUTES.ADMIN.USERS,
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
  },
  {
    title: 'View Activity',
    description: 'Browse activity logs',
    href: ROUTES.ADMIN.ACTIVITY,
    icon: Activity,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
  },
  {
    title: 'Announcements',
    description: 'Manage site banners',
    href: ROUTES.ADMIN.ANNOUNCEMENTS,
    icon: Megaphone,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10 dark:bg-orange-500/20',
  },
  {
    title: 'Settings',
    description: 'System configuration',
    href: ROUTES.ADMIN.SETTINGS,
    icon: Settings,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {actions.map(action => (
        <Link
          key={action.href}
          href={action.href}
          className="flex items-center gap-3 p-3 rounded-xl border border-amber-200/30 dark:border-stone-800/50 hover:bg-amber-50/50 dark:hover:bg-stone-800/30 transition-colors group"
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${action.bg}`}
          >
            <action.icon className={`w-4 h-4 ${action.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {action.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {action.description}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
        </Link>
      ))}
    </div>
  );
}
