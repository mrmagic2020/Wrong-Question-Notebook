'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { FilterConfig, SessionConfig, SimpleTag } from '@/lib/types';
import { apiUrl } from '@/lib/api-utils';

interface EditSmartSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  problemSetId: string;
  problemSetName: string;
  subjectId: string;
  subjectName: string;
  filterConfig: FilterConfig;
  sessionConfig: SessionConfig;
}

export default function EditSmartSetDialog({
  open,
  onOpenChange,
  onSuccess,
  problemSetId,
  problemSetName,
  subjectId,
  subjectName,
  filterConfig,
  sessionConfig,
}: EditSmartSetDialogProps) {
  const t = useTranslations('Review');
  const tCommon = useTranslations('Common');

  const [isLoading, setIsLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<SimpleTag[]>([]);
  const [filterCount, setFilterCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: problemSetName,
    // Filter config
    tag_ids: filterConfig.tag_ids,
    statuses: filterConfig.statuses as string[],
    problem_types: filterConfig.problem_types as string[],
    days_since_review: filterConfig.days_since_review,
    include_never_reviewed: filterConfig.include_never_reviewed,
    // Session config
    randomize: sessionConfig.randomize,
    session_size: sessionConfig.session_size,
    auto_advance: sessionConfig.auto_advance,
  });

  // Reset form when dialog opens with new props
  useEffect(() => {
    if (open) {
      setFormData({
        name: problemSetName,
        tag_ids: filterConfig.tag_ids,
        statuses: filterConfig.statuses as string[],
        problem_types: filterConfig.problem_types as string[],
        days_since_review: filterConfig.days_since_review,
        include_never_reviewed: filterConfig.include_never_reviewed,
        randomize: sessionConfig.randomize,
        session_size: sessionConfig.session_size,
        auto_advance: sessionConfig.auto_advance,
      });
    }
  }, [open, problemSetName, filterConfig, sessionConfig]);

  // Load tags for subject
  useEffect(() => {
    if (!open || !subjectId) return;
    async function loadTags() {
      try {
        const res = await fetch(apiUrl(`/api/tags?subject_id=${subjectId}`));
        if (res.ok) {
          const data = await res.json();
          setAvailableTags(data.data || []);
        }
      } catch {
        console.error('Failed to load tags');
      }
    }
    loadTags();
  }, [open, subjectId]);

  // Live preview count with debounce
  const fetchCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const res = await fetch(apiUrl('/api/problems/filter-count'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          filter_config: {
            tag_ids: formData.tag_ids,
            statuses: formData.statuses,
            problem_types: formData.problem_types,
            days_since_review: formData.days_since_review,
            include_never_reviewed: formData.include_never_reviewed,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFilterCount(data.data?.count ?? null);
      }
    } catch {
      setFilterCount(null);
    } finally {
      setCountLoading(false);
    }
  }, [
    subjectId,
    formData.tag_ids,
    formData.statuses,
    formData.problem_types,
    formData.days_since_review,
    formData.include_never_reviewed,
  ]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(fetchCount, 300);
    return () => clearTimeout(timeout);
  }, [open, fetchCount]);

  const toggleStatus = (status: string) => {
    setFormData(prev => ({
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status],
    }));
  };

  const toggleProblemType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      problem_types: prev.problem_types.includes(type)
        ? prev.problem_types.filter(t => t !== type)
        : [...prev.problem_types, type],
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('enterNameError'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/problem-sets/${problemSetId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          is_smart: true,
          filter_config: {
            tag_ids: formData.tag_ids,
            statuses: formData.statuses,
            problem_types: formData.problem_types,
            days_since_review: formData.days_since_review,
            include_never_reviewed: formData.include_never_reviewed,
          },
          session_config: {
            randomize: formData.randomize,
            session_size: formData.session_size,
            auto_advance: formData.auto_advance,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t('failedUpdateSmartSet'));
      }

      toast.success(t('smartSetUpdated'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber-500" />
            {t('editSmartSetTitle')}
          </DialogTitle>
          <DialogDescription>{t('editSmartSetDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-smart-name">{t('nameRequired')}</Label>
            <Input
              id="edit-smart-name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              maxLength={50}
              required
            />
          </div>

          {/* Subject (read-only) */}
          <div className="space-y-2">
            <Label>{t('subject')}</Label>
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
              {subjectName}
            </div>
          </div>

          {/* Status filter */}
          <div className="space-y-2">
            <Label>{t('statusFilter')}</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'wrong', label: t('wrong'), color: 'destructive' },
                {
                  value: 'needs_review',
                  label: t('needsReview'),
                  color: 'default',
                },
                {
                  value: 'mastered',
                  label: t('mastered'),
                  color: 'secondary',
                },
              ].map(status => (
                <Badge
                  key={status.value}
                  variant={
                    formData.statuses.includes(status.value)
                      ? (status.color as any)
                      : 'outline'
                  }
                  className="cursor-pointer select-none"
                  onClick={() => toggleStatus(status.value)}
                >
                  {status.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('leaveEmptyAll')}
            </p>
          </div>

          {/* Problem type filter */}
          <div className="space-y-2">
            <Label>{t('problemType')}</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'mcq', label: t('mcq') },
                { value: 'short', label: t('shortAnswerType') },
                { value: 'extended', label: t('extended') },
              ].map(type => (
                <Badge
                  key={type.value}
                  variant={
                    formData.problem_types.includes(type.value)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer select-none"
                  onClick={() => toggleProblemType(type.value)}
                >
                  {type.label}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('leaveEmptyTypes')}
            </p>
          </div>

          {/* Tag filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <Label>{t('tagsFilter')}</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant={
                      formData.tag_ids.includes(tag.id) ? 'default' : 'outline'
                    }
                    className="cursor-pointer select-none"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Review date filter */}
          <div className="space-y-3">
            <Label>{t('reviewDateFilter')}</Label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {t('notReviewedIn')}
              </span>
              <Input
                type="number"
                min={0}
                className="w-20"
                value={formData.days_since_review ?? ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    days_since_review: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                placeholder="--"
              />
              <span className="text-sm text-muted-foreground">{t('days')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="edit-include-never"
                checked={formData.include_never_reviewed}
                onCheckedChange={checked =>
                  setFormData(prev => ({
                    ...prev,
                    include_never_reviewed: !!checked,
                  }))
                }
              />
              <Label
                htmlFor="edit-include-never"
                className="text-sm font-normal"
              >
                {t('includeNeverReviewed')}
              </Label>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-lg border border-amber-200/40 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 p-3">
            <div className="flex items-center gap-2">
              {countLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
              ) : (
                <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              )}
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {filterCount !== null
                  ? t('matchingProblems', { count: filterCount })
                  : tCommon('loading')}
              </span>
            </div>
          </div>

          {/* Session settings */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-base">{t('sessionSettings')}</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-randomize" className="font-normal">
                  {t('randomizeOrder')}
                </Label>
                <Switch
                  id="edit-randomize"
                  checked={formData.randomize}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, randomize: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-auto-advance" className="font-normal">
                  {t('autoAdvance')}
                </Label>
                <Switch
                  id="edit-auto-advance"
                  checked={formData.auto_advance}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, auto_advance: checked }))
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="edit-session-size" className="font-normal">
                  {t('sessionSize')}
                </Label>
                <Input
                  id="edit-session-size"
                  type="number"
                  min={1}
                  max={100}
                  className="w-20"
                  value={formData.session_size ?? ''}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      session_size: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    }))
                  }
                  placeholder={tCommon('all')}
                />
                <span className="text-sm text-muted-foreground">
                  {t('problemsOptional')}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('saving') : t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
