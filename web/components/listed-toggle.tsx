'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, Info, UserCog } from 'lucide-react';
import { DISCOVERY_SUBJECTS } from '@/lib/constants';

interface ListedToggleProps {
  isListed: boolean;
  onToggle: (listed: boolean) => void;
  discoverySubject: string | null;
  onSubjectChange: (subject: string) => void;
  disabled?: boolean;
  hasUsername?: boolean;
  problemCount?: number;
}

export function ListedToggle({
  isListed,
  onToggle,
  discoverySubject,
  onSubjectChange,
  disabled,
  hasUsername = true,
  problemCount,
}: ListedToggleProps) {
  const isEmpty = problemCount !== undefined && problemCount === 0;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <Label htmlFor="listed-toggle" className="text-sm font-medium">
            Show in Discovery
          </Label>
        </div>
        <Switch
          id="listed-toggle"
          checked={isListed}
          onCheckedChange={onToggle}
          disabled={disabled || !hasUsername}
        />
      </div>

      {isListed && hasUsername && (
        <div className="space-y-1.5">
          <Label htmlFor="discovery-subject" className="text-sm">
            Subject category
          </Label>
          <Select
            value={discoverySubject || ''}
            onValueChange={onSubjectChange}
          >
            <SelectTrigger id="discovery-subject">
              <SelectValue placeholder="Select a subject..." />
            </SelectTrigger>
            <SelectContent>
              {DISCOVERY_SUBJECTS.map(s => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {!hasUsername ? (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
          <UserCog className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Set a username first — click your avatar in the top-right to open
            your profile.
          </p>
        </div>
      ) : isListed && isEmpty ? (
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <p className="text-xs text-blue-800 dark:text-blue-300">
            This set has no problems yet. It won&apos;t appear in Discovery
            until you add some.
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {isListed
            ? 'This set is discoverable by other students.'
            : 'This set is only accessible via direct link.'}
        </p>
      )}
    </div>
  );
}
