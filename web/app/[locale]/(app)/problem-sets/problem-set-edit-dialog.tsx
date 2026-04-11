'use client';

import { useState, useEffect } from 'react';
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
import { RichTextEditor } from '@/components/editor';
import { VALIDATION_CONSTANTS } from '@/lib/constants';
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
import { ProblemSetEditDialogProps } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

export default function ProblemSetEditDialog({
  open,
  onOpenChange,
  problemSet,
  onSuccess,
}: ProblemSetEditDialogProps) {
  const t = useTranslations('ProblemSets');
  const tCommon = useTranslations('Common');
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

  // Initialize form data when problem set changes
  useEffect(() => {
    if (problemSet) {
      setFormData({
        name: problemSet.name,
        description: problemSet.description || '',
        sharing_level: problemSet.sharing_level,
        shared_with_emails: problemSet.shared_with_emails || [],
        allow_copying: problemSet.allow_copying ?? true,
      });
    }
  }, [problemSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t('enterName'));
      return;
    }

    if (!problemSet?.id) {
      toast.error(t('invalidProblemSet'));
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || '',
        sharing_level: formData.sharing_level,
        shared_with_emails:
          formData.shared_with_emails.length > 0
            ? formData.shared_with_emails
            : undefined,
        allow_copying: formData.allow_copying,
      };

      const response = await fetch(`/api/problem-sets/${problemSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = t('failedToUpdate');
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success(t('problemSetUpdated'));
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error updating problem set:', error);
      toast.error(error instanceof Error ? error.message : t('failedToUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim();
    if (!email) return;

    // Parse comma separated emails
    const emails = email.split(',').map(e => e.trim());

    const newEmails: string[] = [];

    for (const email of emails) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error(t('enterValidEmail'));
        return;
      }

      if (!formData.shared_with_emails.includes(email)) {
        newEmails.push(email);
      }
    }

    setFormData(prev => ({
      ...prev,
      shared_with_emails: [...prev.shared_with_emails, ...newEmails],
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
          <DialogTitle>{t('editProblemSet')}</DialogTitle>
          <DialogDescription>{t('editProblemSetDesc')}</DialogDescription>
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
              placeholder={t('namePlaceholder')}
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
              placeholder={t('descriptionPlaceholder')}
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
                  {t('private')} - {t('privateDesc')}
                </SelectItem>
                <SelectItem value={ProblemSetSharingLevel.enum.limited}>
                  {t('limited')} - {t('limitedDesc')}
                </SelectItem>
                <SelectItem value={ProblemSetSharingLevel.enum.public}>
                  {t('public')} - {t('publicDesc')}
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
                  onKeyDown={handleKeyPress}
                  placeholder={t('emailPlaceholder')}
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
                {t('allowCopy')}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('updating') : t('updateProblemSet')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
