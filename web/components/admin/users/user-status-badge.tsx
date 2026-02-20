import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

export function UserStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge
      variant="outline"
      className="bg-emerald-100/80 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/40 gap-1"
    >
      <CheckCircle className="h-3 w-3" />
      Active
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-800/40 gap-1"
    >
      <XCircle className="h-3 w-3" />
      Inactive
    </Badge>
  );
}
