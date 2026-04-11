'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Info, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api-utils';

type AnnouncementType = 'info' | 'warning' | 'success';

interface AnnouncementEditorProps {
  initial: {
    enabled: boolean;
    message: string;
    type: AnnouncementType;
  } | null;
}

const typeOptions = [
  {
    value: 'info' as AnnouncementType,
    labelKey: 'info' as const,
    icon: Info,
    color:
      'text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border-blue-200/50 dark:border-blue-800/40',
  },
  {
    value: 'warning' as AnnouncementType,
    labelKey: 'warning' as const,
    icon: AlertTriangle,
    color:
      'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border-amber-200/50 dark:border-amber-800/40',
  },
  {
    value: 'success' as AnnouncementType,
    labelKey: 'success' as const,
    icon: CheckCircle,
    color:
      'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-200/50 dark:border-emerald-800/40',
  },
];

const previewStyles: Record<AnnouncementType, string> = {
  info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/50 dark:border-blue-800/40 text-blue-800 dark:text-blue-200',
  warning:
    'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-200',
  success:
    'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200',
};

export function AnnouncementEditor({ initial }: AnnouncementEditorProps) {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');
  const [enabled, setEnabled] = useState(initial?.enabled ?? false);
  const [message, setMessage] = useState(initial?.message ?? '');
  const [type, setType] = useState<AnnouncementType>(initial?.type ?? 'info');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl('/api/admin/settings/site_announcement'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: { enabled, message, type },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('errorSavingAnnouncement'));
        return;
      }
      toast.success(t('announcementSaved'));
    } catch {
      toast.error(t('errorSavingAnnouncement'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('announcementsTitle')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('announcementDesc')}
        </p>
      </div>

      <div className="admin-section-card space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium text-gray-900 dark:text-white">
              {t('enableBanner')}
            </Label>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('showBannerDesc')}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {/* Type Selector */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t('bannerType')}
          </Label>
          <div className="flex gap-2">
            {typeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all',
                  opt.color,
                  type === opt.value
                    ? 'ring-2 ring-offset-1 ring-amber-400/50'
                    : 'opacity-60 hover:opacity-80'
                )}
              >
                <opt.icon className="h-4 w-4" />
                {opt.value === 'info'
                  ? t('info')
                  : opt.value === 'warning'
                    ? t('warning')
                    : tCommon('success')}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            {t('message')}
          </Label>
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={t('enterAnnouncement')}
            rows={3}
            className="rounded-xl"
          />
        </div>

        {/* Preview */}
        {message && (
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              {t('preview')}
            </Label>
            <div
              className={cn(
                'px-4 py-3 rounded-xl border text-sm',
                previewStyles[type]
              )}
            >
              {message}
            </div>
          </div>
        )}

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? t('saving') : t('saveAnnouncement')}
        </Button>
      </div>
    </div>
  );
}
