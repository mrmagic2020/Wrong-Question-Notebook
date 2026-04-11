'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { UserRoleType } from '@/lib/schemas';
import { UserRoleBadge } from './user-role-badge';

const roles: { value: UserRoleType; labelKey: string }[] = [
  { value: 'user', labelKey: 'user' },
  { value: 'moderator', labelKey: 'moderator' },
  { value: 'admin', labelKey: 'admin' },
  { value: 'super_admin', labelKey: 'superAdmin' },
];

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  currentRole: UserRoleType;
  onConfirm: (role: UserRoleType) => void;
  loading?: boolean;
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  username,
  currentRole,
  onConfirm,
  loading,
}: ChangeRoleDialogProps) {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(currentRole);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('changeRoleTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('changeRoleDesc', { username })}. {t('changeRoleAffects')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-3">
          {roles.map(role => (
            <Label
              key={role.value}
              className="flex items-center gap-3 p-3 rounded-xl border border-amber-200/30 dark:border-stone-800/50 cursor-pointer hover:bg-amber-50/50 dark:hover:bg-stone-800/30 transition-colors"
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={selectedRole === role.value}
                onChange={() => setSelectedRole(role.value)}
                className="text-amber-600"
              />
              <UserRoleBadge role={role.value} />
              {role.value === currentRole && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {t('current')}
                </span>
              )}
            </Label>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selectedRole)}
            disabled={loading || selectedRole === currentRole}
          >
            {loading ? t('saving') : t('changeRole')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
