'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  UserProfileType,
  UserRoleType,
  UserActivityLogType,
} from '@/lib/schemas';
import { QuotaCheckResult } from '@/lib/usage-quota';
import { formatDisplayDate, formatDisplayDateTime } from '@/lib/common-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  BookOpen,
  FileQuestion,
  FolderOpen,
  Target,
  HardDrive,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  Zap,
} from 'lucide-react';
import { UserRoleBadge } from './user-role-badge';
import { UserStatusBadge } from './user-status-badge';
import { DeleteUserDialog } from './delete-user-dialog';
import { ChangeRoleDialog } from './change-role-dialog';
import { ROUTES, CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';
import { formatBytes } from '@/lib/format-utils';
import type { ContentLimitResult } from '@/lib/content-limits';

interface UserDetailClientProps {
  profile: UserProfileType;
  contentStats: {
    subjects: number;
    problems: number;
    problem_sets: number;
    attempts: number;
  };
  quotaUsage: QuotaCheckResult | null;
  activity: UserActivityLogType[];
  storageUsage: { totalBytes: number; fileCount: number };
  contentLimits: ContentLimitResult[];
}

export function UserDetailClient({
  profile,
  contentStats,
  quotaUsage,
  activity,
  storageUsage,
  contentLimits: initialContentLimits,
}: UserDetailClientProps) {
  const router = useRouter();
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [quotaInput, setQuotaInput] = useState('');
  const [quotaSaving, setQuotaSaving] = useState(false);
  const [contentLimits, setContentLimits] = useState(initialContentLimits);
  const [contentLimitInputs, setContentLimitInputs] = useState<
    Record<string, string>
  >({});
  const [contentLimitSaving, setContentLimitSaving] = useState<string | null>(
    null
  );

  const displayName =
    profile.username ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    t('noName');

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('errorDeleting'));
        return;
      }
      toast.success(t('userDeleted'));
      router.push(ROUTES.ADMIN.USERS);
      router.refresh();
    } catch {
      toast.error(t('errorDeletingUser'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRoleChange = async (newRole: UserRoleType) => {
    setRoleLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('errorChangingRole'));
        return;
      }
      toast.success(t('roleUpdated'));
      setRoleDialog(false);
      router.refresh();
    } catch {
      toast.error(t('errorChangingRole'));
    } finally {
      setRoleLoading(false);
    }
  };

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/toggle-active`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('errorTogglingStatus'));
        return;
      }
      toast.success(
        profile.is_active ? t('userDeactivated') : t('userActivated')
      );
      router.refresh();
    } catch {
      toast.error(t('errorTogglingStatus'));
    }
  };

  const handleQuotaSave = async () => {
    setQuotaSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}/quota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          daily_limit: quotaInput ? parseInt(quotaInput) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('errorUpdatingQuota'));
        return;
      }
      toast.success(
        quotaInput ? t('quotaOverrideSet') : t('quotaOverrideRemoved')
      );
      setQuotaInput('');
      router.refresh();
    } catch {
      toast.error(t('errorUpdatingQuota'));
    } finally {
      setQuotaSaving(false);
    }
  };

  const handleContentLimitSave = async (resourceType: string) => {
    setContentLimitSaving(resourceType);
    try {
      const inputValue = contentLimitInputs[resourceType];
      const res = await fetch(`/api/admin/users/${profile.id}/content-limits`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_type: resourceType,
          limit_value: inputValue ? parseInt(inputValue) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || t('errorUpdatingLimit'));
        return;
      }
      const json = await res.json();
      setContentLimits(json.limits);
      toast.success(
        inputValue ? t('limitOverrideSet') : t('limitOverrideRemoved')
      );
      setContentLimitInputs(prev => ({ ...prev, [resourceType]: '' }));
    } catch {
      toast.error(t('errorUpdatingLimit'));
    } finally {
      setContentLimitSaving(null);
    }
  };

  const isSuperAdmin = profile.user_role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Link href={ROUTES.ADMIN.USERS}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('userDetails')}
          </p>
        </div>
      </div>

      {/* Profile + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="admin-section-card lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 dark:bg-amber-900/30 flex items-center justify-center mb-3">
              <User className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {displayName}
            </h2>
            {profile.username && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{profile.username}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              <UserRoleBadge role={profile.user_role} />
              <UserStatusBadge isActive={profile.is_active} />
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {tCommon('id')}
              </span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {profile.id.slice(0, 12)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t('joined')}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatDisplayDate(profile.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {t('lastLogin')}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {profile.last_login_at
                  ? formatDisplayDate(profile.last_login_at)
                  : t('neverLoggedIn')}
              </span>
            </div>
            {profile.region && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {t('region')}
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {profile.region}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isSuperAdmin && (
            <div className="mt-6 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={() => setRoleDialog(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                {t('changeRole')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                onClick={handleToggleActive}
              >
                {profile.is_active ? (
                  <>
                    <Ban className="h-4 w-4 mr-2" />
                    {t('deactivate')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t('activate')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-xl text-red-600 hover:text-red-700 border-red-200/50 hover:bg-red-50 dark:border-red-800/40 dark:text-red-400 dark:hover:bg-red-950/30"
                onClick={() => setDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('deleteUser')}
              </Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Stats */}
          <div className="admin-section-card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('content')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: BookOpen,
                  value: contentStats.subjects,
                  label: t('subjects'),
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-500/10 dark:bg-rose-500/20',
                },
                {
                  icon: FileQuestion,
                  value: contentStats.problems,
                  label: t('problems'),
                  color: 'text-orange-600 dark:text-orange-400',
                  bg: 'bg-orange-500/10 dark:bg-orange-500/20',
                },
                {
                  icon: FolderOpen,
                  value: contentStats.problem_sets,
                  label: t('sets'),
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-500/10 dark:bg-blue-500/20',
                },
                {
                  icon: Target,
                  value: contentStats.attempts,
                  label: t('attempts'),
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/50 dark:bg-stone-800/30 border border-amber-200/20 dark:border-stone-700/30"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.bg}`}
                  >
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage + Quota */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Storage */}
            <div className="admin-section-card">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {tCommon('storage')}
                </h3>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatBytes(storageUsage.totalBytes)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('files', { count: storageUsage.fileCount })}
              </p>
            </div>

            {/* Quota */}
            <div className="admin-section-card">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('aiQuota')}
                </h3>
              </div>
              {quotaUsage ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {quotaUsage.current_usage}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      / {quotaUsage.daily_limit} {t('today')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-stone-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-amber-500 dark:bg-amber-400 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((quotaUsage.current_usage / quotaUsage.daily_limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      type="number"
                      placeholder={t('overrideLimit')}
                      value={quotaInput}
                      onChange={e => setQuotaInput(e.target.value)}
                      className="h-8 text-xs rounded-lg"
                      min="0"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs rounded-lg"
                      onClick={handleQuotaSave}
                      disabled={quotaSaving}
                    >
                      {quotaInput ? tCommon('set') : tCommon('reset')}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('noQuotaData')}
                </p>
              )}
            </div>
          </div>

          {/* Content Limits */}
          <div className="admin-section-card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('contentLimits')}
            </h2>
            <div className="space-y-4">
              {contentLimits.map(cl => {
                const ratio =
                  cl.limit > 0 ? Math.min(cl.current / cl.limit, 1) : 0;
                const barColor =
                  cl.current >= cl.limit
                    ? 'bg-rose-500 dark:bg-rose-400'
                    : ratio >= CONTENT_LIMIT_CONSTANTS.WARNING_THRESHOLD
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-emerald-500 dark:bg-emerald-400';
                const isStorage =
                  cl.resource_type ===
                  CONTENT_LIMIT_CONSTANTS.RESOURCE_TYPES.STORAGE_BYTES;
                const fmt = (n: number) =>
                  isStorage ? formatBytes(n) : String(n);
                return (
                  <div key={cl.resource_type}>
                    <div className="flex items-baseline justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {CONTENT_LIMIT_CONSTANTS.LABELS[cl.resource_type] ??
                          cl.resource_type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {fmt(cl.current)} / {fmt(cl.limit)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-stone-700 rounded-full h-2">
                      <div
                        className={`${barColor} h-2 rounded-full transition-all`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        placeholder={t('override')}
                        value={contentLimitInputs[cl.resource_type] ?? ''}
                        onChange={e =>
                          setContentLimitInputs(prev => ({
                            ...prev,
                            [cl.resource_type]: e.target.value,
                          }))
                        }
                        className="h-7 text-xs rounded-lg"
                        min="0"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-lg"
                        onClick={() => handleContentLimitSave(cl.resource_type)}
                        disabled={contentLimitSaving === cl.resource_type}
                      >
                        {contentLimitInputs[cl.resource_type]
                          ? tCommon('set')
                          : tCommon('reset')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity */}
          <div className="admin-section-card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('recentActivityTitle')}
            </h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('noActivityRecorded')}
              </p>
            ) : (
              <div className="space-y-2">
                {activity.map(a => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-2 border-b border-amber-100/50 dark:border-stone-800/50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {a.action}
                      </span>
                      {a.resource_type && (
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-200/50 dark:border-amber-800/40"
                        >
                          {a.resource_type}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatDisplayDateTime(a.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <DeleteUserDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        username={displayName}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
      <ChangeRoleDialog
        open={roleDialog}
        onOpenChange={setRoleDialog}
        username={displayName}
        currentRole={profile.user_role}
        onConfirm={handleRoleChange}
        loading={roleLoading}
      />
    </div>
  );
}
