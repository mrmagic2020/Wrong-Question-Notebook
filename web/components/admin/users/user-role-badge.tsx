import { Badge } from '@/components/ui/badge';
import { UserRoleType } from '@/lib/schemas';
import { Shield, User } from 'lucide-react';

const roleStyles: Record<string, { bg: string; text: string; border: string }> =
  {
    user: {
      bg: 'bg-gray-100/80 dark:bg-gray-800/50',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200/50 dark:border-gray-700/50',
    },
    moderator: {
      bg: 'bg-blue-100/80 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200/50 dark:border-blue-800/40',
    },
    admin: {
      bg: 'bg-purple-100/80 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200/50 dark:border-purple-800/40',
    },
    super_admin: {
      bg: 'bg-rose-100/80 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200/50 dark:border-rose-800/40',
    },
  };

export function UserRoleBadge({ role }: { role: UserRoleType }) {
  const style = roleStyles[role] || roleStyles.user;
  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} ${style.border} gap-1`}
    >
      {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
      <span className="capitalize">{role.replace('_', ' ')}</span>
    </Badge>
  );
}
