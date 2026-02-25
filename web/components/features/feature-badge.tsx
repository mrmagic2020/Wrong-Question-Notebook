import type { LucideIcon } from 'lucide-react';
import type { HTMLAttributes } from 'react';

const colorStyles: Record<string, string> = {
  amber:
    'bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/40',
  rose: 'bg-rose-100/80 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300 border-rose-200/50 dark:border-rose-800/40',
  blue: 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/40',
  green:
    'bg-green-100/80 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200/50 dark:border-green-800/40',
  orange:
    'bg-orange-100/80 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/40',
};

interface FeatureBadgeProps extends HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  label: string;
  color?: string;
}

export function FeatureBadge({
  icon: Icon,
  label,
  color = 'amber',
  className = '',
  ...props
}: FeatureBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border ${colorStyles[color] || colorStyles.amber} ${className}`}
      {...props}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
  );
}
