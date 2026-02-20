'use client';

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

const roles: { value: UserRoleType; label: string }[] = [
  { value: 'user', label: 'User' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
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
  const [selectedRole, setSelectedRole] = useState<UserRoleType>(currentRole);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change User Role</AlertDialogTitle>
          <AlertDialogDescription>
            Change the role for{' '}
            <span className="font-semibold text-foreground">{username}</span>.
            This will affect their permissions immediately.
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
                  Current
                </span>
              )}
            </Label>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(selectedRole)}
            disabled={loading || selectedRole === currentRole}
          >
            {loading ? 'Saving...' : 'Change Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
