'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProfileAvatar } from '@/components/profile-avatar';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import type { UserProfileType } from '@/lib/schemas';
import { Loader2, Camera, X, Check, BarChart3, LogOut } from 'lucide-react';
import { FILE_CONSTANTS } from '@/lib/constants';
import { UsageLimitsDialog } from '@/components/usage-limits-dialog';

interface ProfileSheetProps {
  initialProfile: UserProfileType | null;
  email: string;
}

export function ProfileSheet({ initialProfile, email }: ProfileSheetProps) {
  const router = useRouter();
  const t = useTranslations('Profile');
  const tCommon = useTranslations('Common');

  // Sheet open state (controlled so we can intercept close)
  const [open, setOpen] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  // Form state
  const [username, setUsername] = useState(initialProfile?.username ?? '');
  const [firstName, setFirstName] = useState(initialProfile?.first_name ?? '');
  const [lastName, setLastName] = useState(initialProfile?.last_name ?? '');
  const [bio, setBio] = useState(initialProfile?.bio ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(
    initialProfile?.date_of_birth ?? ''
  );
  const [gender, setGender] = useState(initialProfile?.gender ?? '');

  const detectedTimezone =
    typeof window !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  // Snapshot of the last successfully saved values for dirty detection
  const savedSnapshotRef = useRef({
    username: initialProfile?.username ?? '',
    firstName: initialProfile?.first_name ?? '',
    lastName: initialProfile?.last_name ?? '',
    bio: initialProfile?.bio ?? '',
    dateOfBirth: initialProfile?.date_of_birth ?? '',
    gender: initialProfile?.gender ?? '',
  });

  const isDirty =
    username !== savedSnapshotRef.current.username ||
    firstName !== savedSnapshotRef.current.firstName ||
    lastName !== savedSnapshotRef.current.lastName ||
    bio !== savedSnapshotRef.current.bio ||
    dateOfBirth !== savedSnapshotRef.current.dateOfBirth ||
    gender !== savedSnapshotRef.current.gender;

  // Avatar state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    initialProfile?.avatar_url ?? null
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Username check state
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Usage dialog state
  const [usageDialogOpen, setUsageDialogOpen] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const savedUsernameRef = useRef(initialProfile?.username ?? '');

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    setOpen(nextOpen);
  };

  const resetFormToSnapshot = () => {
    const s = savedSnapshotRef.current;
    setUsername(s.username);
    setFirstName(s.firstName);
    setLastName(s.lastName);
    setBio(s.bio);
    setDateOfBirth(s.dateOfBirth);
    setGender(s.gender);
    setSaveError(null);
    setUsernameError(null);
    setFieldErrors({});
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    resetFormToSnapshot();
    setOpen(false);
  };

  // Cleanup object URLs when avatarPreview changes or on unmount
  useEffect(() => {
    const current = avatarPreview;
    return () => {
      if (current) URL.revokeObjectURL(current);
    };
  }, [avatarPreview]);

  // Cleanup saved timer on unmount
  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError(t('fileTypeNotAllowed'));
      return;
    }
    if (file.size > FILE_CONSTANTS.STORAGE.AVATAR_MAX_SIZE) {
      setAvatarError(t('fileTooLarge'));
      return;
    }

    // Immediate preview
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setAvatarPreview(null);
        setAvatarError(t('uploadFailed'));
      } else {
        setAvatarPreview(null);
        setAvatarUrl(json.data.avatar_url);
        router.refresh();
      }
    } catch {
      setAvatarPreview(null);
      setAvatarError(t('uploadFailed'));
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const res = await fetch('/api/profile/avatar', { method: 'DELETE' });
      if (res.ok) {
        setAvatarPreview(null);
        setAvatarUrl(null);
        router.refresh();
      } else {
        const json = await res.json();
        setAvatarError(json.error ?? t('failedToRemove'));
      }
    } catch {
      setAvatarError(t('failedToRemove'));
    } finally {
      setAvatarUploading(false);
    }
  };

  const checkUsername = useCallback(
    async (value: string) => {
      if (!value || value.length < 3 || value === savedUsernameRef.current) {
        setUsernameError(null);
        return;
      }
      setUsernameChecking(true);
      try {
        const res = await fetch(
          `/api/profile/username-check?username=${encodeURIComponent(value)}`
        );
        const json = await res.json();
        setUsernameError(
          res.ok && !json.data.available ? t('usernameTaken') : null
        );
      } catch {
        // Ignore network errors during check
      } finally {
        setUsernameChecking(false);
      }
    },
    [t]
  );

  const handleSave = async () => {
    if (usernameError || usernameChecking) return;
    setSaving(true);
    setSaveError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          first_name: firstName,
          last_name: lastName,
          bio,
          date_of_birth: dateOfBirth,
          gender,
          timezone: detectedTimezone,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const errors = json.details?.fieldErrors as
          | Record<string, string[]>
          | undefined;
        if (errors && Object.keys(errors).length > 0) {
          setFieldErrors(errors);
          setSaveError(null);
        } else {
          setSaveError(json.error ?? t('failedToSave'));
        }
      } else {
        savedUsernameRef.current = username;
        savedSnapshotRef.current = {
          username,
          firstName,
          lastName,
          bio,
          dateOfBirth,
          gender,
        };
        setSaved(true);
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
        router.refresh();
      }
    } catch {
      setSaveError(t('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  const displayAvatarUrl = avatarPreview ?? avatarUrl;

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          <button
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors"
            aria-label="Open profile"
            onClick={() => setOpen(true)}
          >
            <ProfileAvatar
              avatarUrl={displayAvatarUrl}
              firstName={firstName || null}
              lastName={lastName || null}
              email={email}
              size="sm"
            />
            <span className="hidden sm:block max-w-[140px] truncate text-sm text-muted-foreground">
              {username || email}
            </span>
          </button>
        </SheetTrigger>

        <SheetContent
          side="right"
          className="flex flex-col overflow-y-auto p-0"
        >
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle>{t('title')}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-5 px-4 py-2 flex-1">
            {/* Avatar section */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="relative">
                <ProfileAvatar
                  avatarUrl={displayAvatarUrl}
                  firstName={firstName || null}
                  lastName={lastName || null}
                  email={email}
                  size="lg"
                />
                {avatarUploading && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </div>
              {avatarError && (
                <p className="text-xs text-destructive text-center">
                  {avatarError}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-xs"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  {t('changePhoto')}
                </Button>
                {(avatarUrl || avatarPreview) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading}
                    className="text-xs text-destructive hover:text-destructive"
                  >
                    <X className="w-3 h-3 mr-1" />
                    {t('remove')}
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarSelect}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-1">
              <Label htmlFor="sheet-email" className="text-xs">
                {t('email')}
              </Label>
              <Input
                id="sheet-email"
                value={email}
                disabled
                className="text-sm"
              />
            </div>

            {/* Username */}
            <div className="space-y-1">
              <Label htmlFor="sheet-username" className="text-xs">
                {t('username')}
              </Label>
              <div className="relative">
                <Input
                  id="sheet-username"
                  value={username}
                  onChange={e => {
                    // Only allow alphanumeric, underscore, hyphen
                    const sanitized = e.target.value.replace(
                      /[^a-zA-Z0-9_-]/g,
                      ''
                    );
                    setUsername(sanitized);
                    setUsernameError(null);
                    setFieldErrors(prev => ({ ...prev, username: [] }));
                  }}
                  onBlur={() => checkUsername(username)}
                  placeholder={t('usernamePlaceholder')}
                  maxLength={50}
                  className="text-sm pr-8"
                />
                {usernameChecking && (
                  <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {(usernameError ?? fieldErrors.username?.[0]) && (
                <p className="text-xs text-destructive">
                  {usernameError ?? fieldErrors.username?.[0]}
                </p>
              )}
            </div>

            {/* First name */}
            <div className="space-y-1">
              <Label htmlFor="sheet-first-name" className="text-xs">
                {t('firstName')}
              </Label>
              <Input
                id="sheet-first-name"
                value={firstName}
                onChange={e => {
                  setFirstName(e.target.value);
                  setFieldErrors(prev => ({ ...prev, first_name: [] }));
                }}
                placeholder={t('firstName')}
                maxLength={100}
                className="text-sm"
              />
              {fieldErrors.first_name?.[0] && (
                <p className="text-xs text-destructive">
                  {fieldErrors.first_name[0]}
                </p>
              )}
            </div>

            {/* Last name */}
            <div className="space-y-1">
              <Label htmlFor="sheet-last-name" className="text-xs">
                {t('lastName')}
              </Label>
              <Input
                id="sheet-last-name"
                value={lastName}
                onChange={e => {
                  setLastName(e.target.value);
                  setFieldErrors(prev => ({ ...prev, last_name: [] }));
                }}
                placeholder={t('lastName')}
                maxLength={100}
                className="text-sm"
              />
              {fieldErrors.last_name?.[0] && (
                <p className="text-xs text-destructive">
                  {fieldErrors.last_name[0]}
                </p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1">
              <Label htmlFor="sheet-bio" className="text-xs">
                {t('bio')}
              </Label>
              <Textarea
                id="sheet-bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder={t('bioPlaceholder')}
                maxLength={500}
                rows={3}
                className="text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {t('bioCount', { count: bio.length })}
              </p>
            </div>

            {/* Date of birth */}
            <div className="space-y-1">
              <Label htmlFor="sheet-dob" className="text-xs">
                {t('dateOfBirth')}
              </Label>
              <Input
                id="sheet-dob"
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Gender */}
            <div className="space-y-1">
              <Label className="text-xs">{t('gender')}</Label>
              <Select
                value={gender || undefined}
                onValueChange={val => setGender(val)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={t('selectGender')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t('male')}</SelectItem>
                  <SelectItem value="female">{t('female')}</SelectItem>
                  <SelectItem value="other">{t('other')}</SelectItem>
                  <SelectItem value="prefer_not_to_say">
                    {t('preferNotToSay')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Timezone (auto-detected) */}
            <div className="space-y-1">
              <Label htmlFor="sheet-timezone" className="text-xs">
                {t('timezone')}
              </Label>
              <Input
                id="sheet-timezone"
                value={detectedTimezone}
                disabled
                className="text-sm"
              />
            </div>

            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
          </div>

          <SheetFooter className="flex-col gap-2 px-4 pb-4">
            <Button
              onClick={handleSave}
              disabled={saving || saved || !!usernameError || usernameChecking}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : saved ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('saved')}
                </>
              ) : (
                t('saveChanges')
              )}
            </Button>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground px-2"
                onClick={() => setUsageDialogOpen(true)}
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                {t('usageAndLimits')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground px-2"
                onClick={async () => {
                  const { createClient } = await import(
                    '@/lib/supabase/client'
                  );
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  router.replace('/');
                  router.refresh();
                }}
              >
                {t('signOut')}
                <LogOut className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <UsageLimitsDialog
        open={usageDialogOpen}
        onOpenChange={setUsageDialogOpen}
      />

      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('discardChangesTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('discardChangesDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('keepEditing')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDiscardChanges}
            >
              {t('discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
