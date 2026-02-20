'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { ROUTES } from '@/lib/constants';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
}

export function UserDetailClient({
  profile,
  contentStats,
  quotaUsage,
  activity,
  storageUsage,
}: UserDetailClientProps) {
  const router = useRouter();
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [quotaInput, setQuotaInput] = useState('');
  const [quotaSaving, setQuotaSaving] = useState(false);

  const displayName =
    profile.username ||
    [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
    'No name';

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${profile.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete');
        return;
      }
      toast.success('User deleted');
      router.push(ROUTES.ADMIN.USERS);
      router.refresh();
    } catch {
      toast.error('Error deleting user');
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
        toast.error(err.error || 'Failed to change role');
        return;
      }
      toast.success('Role updated');
      setRoleDialog(false);
      router.refresh();
    } catch {
      toast.error('Error changing role');
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
        toast.error(err.error || 'Failed');
        return;
      }
      toast.success(profile.is_active ? 'User deactivated' : 'User activated');
      router.refresh();
    } catch {
      toast.error('Error toggling status');
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
        toast.error(err.error || 'Failed to update quota');
        return;
      }
      toast.success(
        quotaInput ? 'Quota override set' : 'Quota override removed'
      );
      setQuotaInput('');
      router.refresh();
    } catch {
      toast.error('Error updating quota');
    } finally {
      setQuotaSaving(false);
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
            User details and management
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
              <span className="text-gray-500 dark:text-gray-400">ID</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {profile.id.slice(0, 12)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Joined</span>
              <span className="text-gray-700 dark:text-gray-300">
                {formatDisplayDate(profile.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                Last Login
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {profile.last_login_at
                  ? formatDisplayDate(profile.last_login_at)
                  : 'Never'}
              </span>
            </div>
            {profile.region && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Region</span>
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
                Change Role
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
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
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
                Delete User
              </Button>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content Stats */}
          <div className="admin-section-card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Content
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: BookOpen,
                  value: contentStats.subjects,
                  label: 'Subjects',
                  color: 'text-rose-600 dark:text-rose-400',
                  bg: 'bg-rose-500/10 dark:bg-rose-500/20',
                },
                {
                  icon: FileQuestion,
                  value: contentStats.problems,
                  label: 'Problems',
                  color: 'text-orange-600 dark:text-orange-400',
                  bg: 'bg-orange-500/10 dark:bg-orange-500/20',
                },
                {
                  icon: FolderOpen,
                  value: contentStats.problem_sets,
                  label: 'Sets',
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-500/10 dark:bg-blue-500/20',
                },
                {
                  icon: Target,
                  value: contentStats.attempts,
                  label: 'Attempts',
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
                  Storage
                </h3>
              </div>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {formatBytes(storageUsage.totalBytes)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {storageUsage.fileCount} files
              </p>
            </div>

            {/* Quota */}
            <div className="admin-section-card">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  AI Quota
                </h3>
              </div>
              {quotaUsage ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                      {quotaUsage.current_usage}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      / {quotaUsage.daily_limit} today
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
                      placeholder="Override limit"
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
                      {quotaInput ? 'Set' : 'Reset'}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No quota data
                </p>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="admin-section-card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h2>
            {activity.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No activity recorded
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
