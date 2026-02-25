import { cn } from '@/lib/utils';

export function EditorSkeleton({
  height,
  className,
}: {
  height: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border border-input rounded-md bg-background w-full',
        className
      )}
      style={{ height }}
    >
      <div className="flex items-center gap-1 p-2 border-b border-input bg-muted/50">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
      <div className="p-3">
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        </div>
      </div>
    </div>
  );
}
