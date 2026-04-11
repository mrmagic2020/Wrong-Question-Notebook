'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
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
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ProblemSetSharingLevel } from '@/lib/schemas';
import { RichTextEditor } from '@/components/editor';
import { VALIDATION_CONSTANTS, CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';
import { Switch } from '@/components/ui/switch';
import { useContentLimit } from '@/lib/hooks/useContentLimit';
import { ContentLimitIndicator } from '@/components/ui/content-limit-indicator';

interface ProblemSetCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  selectedProblemIds: string[];
  onSuccess?: () => void;
}

export default function ProblemSetCreationDialog({
  open,
  onOpenChange,
  subjectId,
  selectedProblemIds,
  onSuccess,
}: ProblemSetCreationDialogProps) {
  const t = useTranslations('ProblemSets');
  const tCommon = useTranslations('Common');
  const router = useRouter();
  const { data: limitData, isExhausted } = useContentLimit(
    CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.PROBLEM_SETS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sharing_level: ProblemSetSharingLevel.enum
      .private as ProblemSetSharingLevel,
    shared_with_emails: [] as string[],
    allow_copying: true,
  });
  const [emailInput, setEmailInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('pleaseEnterNameForProblemSet'));
      return;
    }

    if (selectedProblemIds.length === 0) {
      toast.error(t('pleaseSelectAtLeastOneProblem'));
      return;
    }

    if (!subjectId) {
      toast.error(t('invalidSubject'));
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        subject_id: subjectId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sharing_level: formData.sharing_level,
        shared_with_emails:
          formData.shared_with_emails.length > 0
            ? formData.shared_with_emails
            : undefined,
        problem_ids: selectedProblemIds,
        allow_copying: formData.allow_copying,
      };

      const response = await fetch('/api/problem-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = t('failedToCreate');
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(t('problemSetCreatedSuccessfully'));

      // Reset form
      setFormData({
        name: '',
        description: '',
        sharing_level: ProblemSetSharingLevel.enum.private,
        shared_with_emails: [],
        allow_copying: true,
      });
      setEmailInput('');

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }

      // Navigate to the new problem set
      router.push(`/problem-sets/${result.data.id}`);
    } catch (error) {
      console.error('Error creating problem set:', error);
      toast.error(error instanceof Error ? error.message : t('failedToCreate'));
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('enterValidEmail'));
      return;
    }

    if (formData.shared_with_emails.includes(email)) {
      toast.error(t('emailAlreadyAdded'));
      return;
    }

    setFormData(prev => ({
      ...prev,
      shared_with_emails: [...prev.shared_with_emails, email],
    }));
    setEmailInput('');
  };

  const removeEmail = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      shared_with_emails: prev.shared_with_emails.filter(
        email => email !== emailToRemove
      ),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      formData.sharing_level === ProblemSetSharingLevel.enum.limited
    ) {
      e.preventDefault();
      addEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('createProblemSetTitle')}</DialogTitle>
          <DialogDescription>
            {t('createProblemSetDesc', {
              count: selectedProblemIds.length,
            })}
          </DialogDescription>
          {limitData && (
            <ContentLimitIndicator
              current={limitData.current}
              limit={limitData.limit}
              label={t('problemSetsUsed')}
            />
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder={t('enterNameForProblemSet')}
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <RichTextEditor
              initialContent={formData.description}
              onChange={content =>
                setFormData(prev => ({ ...prev, description: content }))
              }
              placeholder={t('enterProblemSetDescription')}
              height="300px"
              minHeight="200px"
              maxHeight="400px"
              maxLength={VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX}
              showCharacterCount={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sharing">{t('sharing')}</Label>
            <Select
              value={formData.sharing_level}
              onValueChange={value =>
                setFormData(prev => ({ ...prev, sharing_level: value as any }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProblemSetSharingLevel.enum.private}>
                  {t('privateLabel')}
                </SelectItem>
                <SelectItem value={ProblemSetSharingLevel.enum.limited}>
                  {t('limitedLabel')}
                </SelectItem>
                <SelectItem value={ProblemSetSharingLevel.enum.public}>
                  {t('publicLabel')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.sharing_level === ProblemSetSharingLevel.enum.limited && (
            <div className="space-y-2">
              <Label htmlFor="emails">{t('shareWith')}</Label>
              <div className="flex gap-2">
                <Input
                  id="emails"
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('enterEmailAddress')}
                />
                <Button type="button" onClick={addEmail} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.shared_with_emails.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.shared_with_emails.map(email => (
                    <Badge
                      key={email}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeEmail(email)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {formData.sharing_level !== ProblemSetSharingLevel.enum.private && (
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-copying" className="text-sm">
                {t('allowOthersToCopy')}
              </Label>
              <Switch
                id="allow-copying"
                checked={formData.allow_copying}
                onCheckedChange={checked =>
                  setFormData(prev => ({ ...prev, allow_copying: checked }))
                }
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || isExhausted}>
              {isLoading
                ? t('creating')
                : isExhausted
                  ? t('problemSetLimitReached')
                  : t('createProblemSet')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
