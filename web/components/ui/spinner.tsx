import { Loader2Icon } from 'lucide-react';

import { cn } from '@/lib/utils';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn(
        'size-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin',
        className
      )}
      {...props}
    />
  );
}

export { Spinner };
