'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { AdminSettingsType } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, RotateCcw, Settings } from 'lucide-react';

interface SettingsPageClientProps {
  settings: AdminSettingsType[];
}

export function SettingsPageClient({ settings }: SettingsPageClientProps) {
  const [modifiedSettings, setModifiedSettings] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: Record<string, unknown>) => {
    setModifiedSettings(prev => ({ ...prev, [key]: value }));
  };

  const getCurrentValue = (setting: AdminSettingsType) => {
    return modifiedSettings[setting.key] !== undefined
      ? modifiedSettings[setting.key]
      : setting.value;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const keys = Object.keys(modifiedSettings);
      const results = await Promise.all(
        keys.map(key =>
          fetch(`/api/admin/settings/${key}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: modifiedSettings[key] }),
          })
        )
      );

      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        toast.error(`Failed to save ${failed.length} setting(s)`);
      } else {
        toast.success('Settings saved successfully');
        setModifiedSettings({});
      }
    } catch {
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const hasModifications = Object.keys(modifiedSettings).length > 0;

  const formatKey = (key: string) =>
    key
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const renderSettingControls = (setting: AdminSettingsType) => {
    const val = getCurrentValue(setting) as Record<string, unknown>;
    const key = setting.key;

    switch (key) {
      case 'site_maintenance':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Maintenance Mode</Label>
              <Switch
                checked={(val.enabled as boolean) || false}
                onCheckedChange={enabled =>
                  handleChange(key, { ...val, enabled })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Maintenance Message</Label>
              <Textarea
                value={(val.message as string) || ''}
                onChange={e =>
                  handleChange(key, { ...val, message: e.target.value })
                }
                placeholder="Enter maintenance message..."
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
        );

      case 'user_registration':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Allow Registration</Label>
              <Switch
                checked={val.enabled !== false}
                onCheckedChange={enabled =>
                  handleChange(key, { ...val, enabled })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Require Email Verification</Label>
              <Switch
                checked={val.require_email_verification !== false}
                onCheckedChange={require_email_verification =>
                  handleChange(key, { ...val, require_email_verification })
                }
              />
            </div>
          </div>
        );

      case 'max_file_upload_size':
        return (
          <div className="space-y-2">
            <Label>Maximum Upload Size (MB)</Label>
            <Input
              type="number"
              value={(val.size_mb as number) || 10}
              onChange={e =>
                handleChange(key, {
                  size_mb: parseInt(e.target.value) || 10,
                })
              }
              min="1"
              max="100"
              className="rounded-xl"
            />
          </div>
        );

      case 'session_timeout':
        return (
          <div className="space-y-2">
            <Label>Session Timeout (Hours)</Label>
            <Input
              type="number"
              value={(val.hours as number) || 24}
              onChange={e =>
                handleChange(key, {
                  hours: parseInt(e.target.value) || 24,
                })
              }
              min="1"
              max="168"
              className="rounded-xl"
            />
          </div>
        );

      default:
        // Skip site_announcement (managed via Announcements page)
        if (key === 'site_announcement') return null;
        return (
          <div className="space-y-2">
            <Label>Raw Value (JSON)</Label>
            <Textarea
              value={JSON.stringify(val, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleChange(key, parsed);
                } catch {
                  // Invalid JSON
                }
              }}
              rows={4}
              className="rounded-xl font-mono text-xs"
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure application-wide settings
          </p>
        </div>
        {hasModifications && (
          <Badge
            variant="outline"
            className="bg-orange-100/80 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200/50 dark:border-orange-800/40"
          >
            Unsaved Changes
          </Badge>
        )}
      </div>

      {/* Settings Cards */}
      <div className="space-y-4">
        {settings
          .filter(s => s.key !== 'site_announcement')
          .map(setting => {
            const controls = renderSettingControls(setting);
            if (!controls) return null;

            return (
              <div key={setting.id} className="admin-section-card">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {formatKey(setting.key)}
                  </h3>
                </div>
                {setting.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {setting.description}
                  </p>
                )}
                {controls}
              </div>
            );
          })}
      </div>

      {/* Save bar */}
      {hasModifications && (
        <div className="flex justify-end gap-2 pt-4 border-t border-amber-200/30 dark:border-stone-800/50">
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={() => setModifiedSettings({})}
            disabled={saving}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button
            className="rounded-xl gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
