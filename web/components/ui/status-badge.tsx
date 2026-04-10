import * as React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'needs_review' | 'wrong' | 'mastered';
  className?: string;
  children?: React.ReactNode;
  t?: (key: string) => string;
}

const statusClasses = {
  needs_review: 'status-needs-review',
  wrong: 'status-wrong',
  mastered: 'status-mastered',
};

const statusKeys = {
  needs_review: 'needsReviewStatus',
  wrong: 'wrongStatus',
  mastered: 'masteredStatus',
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className, status, children, t, ...props }, ref) => {
    const label = children ?? (t ? t(statusKeys[status]) : statusKeys[status]);
    return (
      <span
        ref={ref}
        className={cn(statusClasses[status], className)}
        {...props}
      >
        {label}
      </span>
    );
  }
);
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, statusClasses, statusKeys };
