import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'needs_review' | 'wrong' | 'mastered';
  className?: string;
  children?: React.ReactNode;
}

const statusClasses = {
  needs_review: 'status-needs-review',
  wrong: 'status-wrong',
  mastered: 'status-mastered',
};

const statusLabels = {
  needs_review: 'Needs Review',
  wrong: 'Wrong',
  mastered: 'Mastered',
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusClasses[status], className)}
        {...props}
      >
        {children || statusLabels[status]}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusClasses, statusLabels };
