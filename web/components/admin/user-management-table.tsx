'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { UserProfileType, UserRoleType } from '@/lib/schemas';
import { formatDisplayDate } from '@/lib/common-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  User,
  Shield,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  // AlertCircle,
  Trash2,
} from 'lucide-react';

interface UserManagementTableProps {
  users: UserProfileType[];
}

const roleColors = {
  user: 'bg-gray-100 text-gray-800',
  moderator: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
  super_admin: 'bg-red-100 text-red-800',
};

export function UserManagementTable({ users }: UserManagementTableProps) {
  const t = useTranslations('Admin');
  const tCommon = useTranslations('Common');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());

  const handleRoleChange = async (userId: string, newRole: UserRoleType) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`${t('errorUpdatingRole')}: ${error.error}`);
      }
    } catch {
      alert(t('errorUpdatingUserRole'));
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`${t('errorTogglingStatus')}: ${error.error}`);
      }
    } catch {
      alert(t('errorTogglingUserStatus'));
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = window.confirm(t('confirmDeleteUser', { username }));

    if (!confirmed) return;

    setDeletingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`${t('errorDeletingUser')}: ${error.error}`);
      }
    } catch {
      alert(t('errorDeleting'));
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const getRoleIcon = (role: UserRoleType) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t('usersTotal', { count: users.length })}
        </p>
        {selectedUsers.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              {t('bulkActions', { count: selectedUsers.size })}
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="rounded"
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedUsers(new Set(users.map(u => u.id)));
                    } else {
                      setSelectedUsers(new Set());
                    }
                  }}
                />
              </TableHead>
              <TableHead>{tCommon('user')}</TableHead>
              <TableHead>{t('role')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('lastLogin')}</TableHead>
              <TableHead>{t('created')}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedUsers.has(user.id)}
                    onChange={e => {
                      const newSelected = new Set(selectedUsers);
                      if (e.target.checked) {
                        newSelected.add(user.id);
                      } else {
                        newSelected.delete(user.id);
                      }
                      setSelectedUsers(newSelected);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.username ||
                          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                          t('noName')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.id.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={roleColors[user.user_role]}>
                    {getRoleIcon(user.user_role)}
                    <span className="ml-1 capitalize">
                      {user.user_role.replace('_', ' ')}
                    </span>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    {user.is_active ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700">{t('active')}</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">{t('inactive')}</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.last_login_at
                    ? formatDisplayDate(user.last_login_at)
                    : t('never')}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDisplayDate(user.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        {tCommon('viewDetails')}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('editProfile')}
                      </DropdownMenuItem>
                      {user.user_role !== 'super_admin' && (
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(user.id)}
                        >
                          {user.is_active ? (
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
                        </DropdownMenuItem>
                      )}
                      {user.user_role !== 'super_admin' && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(user.id, 'moderator')
                            }
                          >
                            {t('makeModerator')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, 'admin')}
                          >
                            {t('makeAdmin')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, 'user')}
                          >
                            {t('makeRegularUser')}
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.user_role !== 'super_admin' && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteUser(
                              user.id,
                              user.username || t('noName')
                            )
                          }
                          className="text-red-600 focus:text-red-600"
                          disabled={deletingUsers.has(user.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingUsers.has(user.id)
                            ? t('deleting')
                            : t('deleteUser')}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
