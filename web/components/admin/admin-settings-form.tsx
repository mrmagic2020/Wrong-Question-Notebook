'use client';

import { useState } from 'react';
import { AdminSettingsType } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, RefreshCw } from 'lucide-react';

interface AdminSettingsFormProps {
  settings: AdminSettingsType[];
}

export function AdminSettingsForm({ settings }: AdminSettingsFormProps) {
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, any>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    setModifiedSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // This would call an API to save the settings
      console.log('Saving settings:', modifiedSettings);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setModifiedSettings({});
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSettingField = (setting: AdminSettingsType) => {
    const key = setting.key;
    const currentValue =
      modifiedSettings[key] !== undefined
        ? modifiedSettings[key]
        : setting.value;

    switch (key) {
      case 'site_maintenance':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${key}-enabled`}>Maintenance Mode</Label>
              <Switch
                id={`${key}-enabled`}
                checked={currentValue.enabled || false}
                onCheckedChange={enabled =>
                  handleSettingChange(key, { ...currentValue, enabled })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${key}-message`}>Maintenance Message</Label>
              <Textarea
                id={`${key}-message`}
                value={currentValue.message || ''}
                onChange={e =>
                  handleSettingChange(key, {
                    ...currentValue,
                    message: e.target.value,
                  })
                }
                placeholder="Enter maintenance message..."
                rows={3}
              />
            </div>
          </div>
        );

      case 'user_registration':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${key}-enabled`}>Allow Registration</Label>
              <Switch
                id={`${key}-enabled`}
                checked={currentValue.enabled !== false}
                onCheckedChange={enabled =>
                  handleSettingChange(key, { ...currentValue, enabled })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${key}-verify`}>
                Require Email Verification
              </Label>
              <Switch
                id={`${key}-verify`}
                checked={currentValue.require_email_verification !== false}
                onCheckedChange={require_email_verification =>
                  handleSettingChange(key, {
                    ...currentValue,
                    require_email_verification,
                  })
                }
              />
            </div>
          </div>
        );

      case 'max_file_upload_size':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${key}-size`}>Maximum Upload Size (MB)</Label>
            <Input
              id={`${key}-size`}
              type="number"
              value={currentValue.size_mb || 10}
              onChange={e =>
                handleSettingChange(key, {
                  size_mb: parseInt(e.target.value) || 10,
                })
              }
              min="1"
              max="100"
            />
          </div>
        );

      case 'session_timeout':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${key}-hours`}>Session Timeout (Hours)</Label>
            <Input
              id={`${key}-hours`}
              type="number"
              value={currentValue.hours || 24}
              onChange={e =>
                handleSettingChange(key, {
                  hours: parseInt(e.target.value) || 24,
                })
              }
              min="1"
              max="168"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>Raw Value</Label>
            <Textarea
              value={JSON.stringify(currentValue, null, 2)}
              onChange={e => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleSettingChange(key, parsed);
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              rows={4}
            />
          </div>
        );
    }
  };

  const hasModifications = Object.keys(modifiedSettings).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">System Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Modify application-wide settings and behavior
          </p>
        </div>
        {hasModifications && (
          <Badge variant="outline" className="text-orange-600">
            Unsaved Changes
          </Badge>
        )}
      </div>

      <div className="grid gap-6">
        {settings.map(setting => (
          <Card key={setting.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {setting.key
                  .replace('_', ' ')
                  .replace(/\b\w/g, l => l.toUpperCase())}
              </CardTitle>
              {setting.description && (
                <CardDescription>{setting.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>{renderSettingField(setting)}</CardContent>
          </Card>
        ))}
      </div>

      {hasModifications && (
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setModifiedSettings({})}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Changes
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
