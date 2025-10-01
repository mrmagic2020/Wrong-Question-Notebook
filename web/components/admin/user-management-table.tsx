'use client';

import { useState } from 'react';
import { UserProfileType, UserRoleType } from '@/lib/types';
import { formatDisplayDate } from '@/lib/date-utils';
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
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        alert(`Failed to update role: ${error.error}`);
      }
    } catch {
      alert('Error updating user role');
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-active`, {
        method: 'PATCH',
      });

      if (response.ok) {
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        alert(`Failed to toggle user status: ${error.error}`);
      }
    } catch {
      alert('Error toggling user status');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete user "${username}"? This will delete all their data including subjects, problems, files, and cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingUsers(prev => new Set(prev).add(userId));

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        alert(`Failed to delete user: ${error.error}`);
      }
    } catch {
      alert('Error deleting user');
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
          {users.length} users total
        </p>
        {selectedUsers.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Bulk Actions ({selectedUsers.size})
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
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead>Created</TableHead>
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
                          'No name'}
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
                        <span className="text-green-700">Active</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 text-red-500" />
                        <span className="text-red-700">Inactive</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.last_login_at
                    ? formatDisplayDate(user.last_login_at)
                    : 'Never'}
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
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      {user.user_role !== 'super_admin' && (
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(user.id)}
                        >
                          {user.is_active ? (
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
                        </DropdownMenuItem>
                      )}
                      {user.user_role !== 'super_admin' && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRoleChange(user.id, 'moderator')
                            }
                          >
                            Make Moderator
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, 'admin')}
                          >
                            Make Admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRoleChange(user.id, 'user')}
                          >
                            Make Regular User
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.user_role !== 'super_admin' && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteUser(
                              user.id,
                              user.username || 'Unknown User'
                            )
                          }
                          className="text-red-600 focus:text-red-600"
                          disabled={deletingUsers.has(user.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {deletingUsers.has(user.id)
                            ? 'Deleting...'
                            : 'Delete User'}
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
