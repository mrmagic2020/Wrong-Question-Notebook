'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Copy, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Subject } from '@/lib/types';

interface CopyProblemSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemSetId: string;
  problemSetName: string;
  problemCount: number;
  isSmart: boolean;
}

export default function CopyProblemSetDialog({
  open,
  onOpenChange,
  problemSetId,
  problemSetName,
  problemCount,
  isSmart,
}: CopyProblemSetDialogProps) {
  const t = useTranslations('CommonUtils');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [createNewSubject, setCreateNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [copyTags, setCopyTags] = useState(true);

  // Fetch user's subjects when dialog opens
  useEffect(() => {
    if (!open) return;

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const res = await fetch('/api/subjects');
        if (res.ok) {
          const data = await res.json();
          setSubjects(data.data || []);
        }
      } catch (error) {
        console.error(t('failedToFetchSubjects'), error);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let subjectId = targetSubjectId;

    // Create new subject if needed
    if (createNewSubject) {
      if (!newSubjectName.trim()) {
        toast.error(t('pleaseEnterSubjectName'));
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newSubjectName.trim() }),
        });

        if (!res.ok) {
          throw new Error(t('failedToCreateSubject'));
        }

        const data = await res.json();
        subjectId = data.data.id;
      } catch {
        toast.error(t('failedToCreateSubject'));
        setIsLoading(false);
        return;
      }
    }

    if (!subjectId) {
      toast.error(t('pleaseSelectTargetSubject'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/problem-sets/${problemSetId}/copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_subject_id: subjectId,
          copy_tags: copyTags,
        }),
      });

      if (!res.ok) {
        let errorMessage = t('failedToCopySet');
        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = res.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const result = data.data;

      toast.success(
        t(result.tag_count > 0 ? 'copiedProblemsAndTags' : 'copied', {
          problems: result.problem_count,
          tags: result.tag_count > 0 ? ` and ${result.tag_count} tags` : '',
        })
      );
      onOpenChange(false);
      router.push(`/problem-sets/${result.problem_set_id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('failedToCopySet')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {t('copyToMyLibrary')}
          </DialogTitle>
          <DialogDescription>{t('createCopyInAccount')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source info */}
          <div className="rounded-lg border p-3 bg-muted/30 space-y-1">
            <p className="text-sm font-medium">{problemSetName}</p>
            <p className="text-xs text-muted-foreground">
              {t('problemsCount', { count: problemCount })}
            </p>
          </div>

          {/* Smart set info banner */}
          {isSmart && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200/50 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-900/20 p-3">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {t('smartSetCopiedAsManual', { count: problemCount })}
              </p>
            </div>
          )}

          {/* Subject picker */}
          <div className="space-y-2">
            <Label>{t('targetSubject')}</Label>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loadingSubjects')}
              </div>
            ) : (
              <Select
                value={createNewSubject ? '__new__' : targetSubjectId}
                onValueChange={value => {
                  if (value === '__new__') {
                    setCreateNewSubject(true);
                    setTargetSubjectId('');
                  } else {
                    setCreateNewSubject(false);
                    setTargetSubjectId(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectSubject')} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">
                    {t('createNewSubject')}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {createNewSubject && (
              <Input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                placeholder={t('enterSubjectName')}
                maxLength={50}
                autoFocus
              />
            )}
          </div>

          {/* Tag toggle */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="copy-tags" className="text-sm">
                {t('copyTagsToTargetSubject')}
              </Label>
              <Switch
                id="copy-tags"
                checked={copyTags}
                onCheckedChange={setCopyTags}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {copyTags
                ? t('tagsNotInTargetWillBeCreated')
                : t('tagsWillBeDropped')}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('copying')}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  {t('copyToMyLibrary')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
