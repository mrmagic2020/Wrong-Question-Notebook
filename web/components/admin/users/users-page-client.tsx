'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserProfileType, UserRoleType } from '@/lib/schemas';
import { formatDisplayDate } from '@/lib/common-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  User,
  Eye,
  Shield,
  Ban,
  CheckCircle,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserSearchBar } from './user-search-bar';
import { UserRoleBadge } from './user-role-badge';
import { UserStatusBadge } from './user-status-badge';
import { DeleteUserDialog } from './delete-user-dialog';
import { ChangeRoleDialog } from './change-role-dialog';

interface UsersPageClientProps {
  initialUsers: UserProfileType[];
  initialTotalCount: number;
}

type SortColumn =
  | 'created_at'
  | 'username'
  | 'user_role'
  | 'is_active'
  | 'last_login_at';

export function UsersPageClient({
  initialUsers,
  initialTotalCount,
}: UsersPageClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(false);
  const limit = 20;

  // Dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    user: UserProfileType | null;
    loading: boolean;
  }>({ open: false, user: null, loading: false });
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    user: UserProfileType | null;
    loading: boolean;
  }>({ open: false, user: null, loading: false });

  const fetchUsers = useCallback(
    async (
      p: number,
      s: string,
      role: string,
      sort: SortColumn,
      dir: 'asc' | 'desc'
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: p.toString(),
          limit: limit.toString(),
          sort,
          dir,
        });
        if (s) params.set('search', s);
        if (role) params.set('role', role);

        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setUsers(data.users);
        setTotalCount(data.total_count);
      } catch {
        toast.error('Failed to fetch users');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchUsers(1, value, roleFilter, sortColumn, sortDir);
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    setPage(1);
    fetchUsers(1, search, role, sortColumn, sortDir);
  };

  const handleSort = (col: SortColumn) => {
    const newDir = sortColumn === col && sortDir === 'desc' ? 'asc' : 'desc';
    setSortColumn(col);
    setSortDir(newDir);
    fetchUsers(page, search, roleFilter, col, newDir);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, search, roleFilter, sortColumn, sortDir);
  };

  const handleToggleActive = async (user: UserProfileType) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-active`, {
        method: 'PATCH',
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to toggle status');
        return;
      }
      toast.success(
        `User ${user.is_active ? 'deactivated' : 'activated'} successfully`
      );
      fetchUsers(page, search, roleFilter, sortColumn, sortDir);
      router.refresh();
    } catch {
      toast.error('Error toggling user status');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    setDeleteDialog(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/admin/users/${deleteDialog.user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete user');
        return;
      }
      toast.success('User deleted successfully');
      setDeleteDialog({ open: false, user: null, loading: false });
      fetchUsers(page, search, roleFilter, sortColumn, sortDir);
      router.refresh();
    } catch {
      toast.error('Error deleting user');
    } finally {
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleChangeRole = async (newRole: UserRoleType) => {
    if (!roleDialog.user) return;
    setRoleDialog(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/admin/users/${roleDialog.user.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to change role');
        return;
      }
      toast.success('User role updated successfully');
      setRoleDialog({ open: false, user: null, loading: false });
      fetchUsers(page, search, roleFilter, sortColumn, sortDir);
      router.refresh();
    } catch {
      toast.error('Error changing role');
    } finally {
      setRoleDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const totalPages = Math.ceil(totalCount / limit);
  const getDisplayName = (user: UserProfileType) =>
    user.username ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    'No name';

  const SortButton = ({
    col,
    children,
  }: {
    col: SortColumn;
    children: React.ReactNode;
  }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => handleSort(col)}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Users
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <UserSearchBar value={search} onChange={handleSearchChange} />
        </div>
        <div className="flex gap-2">
          {['', 'user', 'moderator', 'admin', 'super_admin'].map(r => (
            <Button
              key={r}
              variant={roleFilter === r ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => handleRoleFilter(r)}
            >
              {r ? r.replace('_', ' ') : 'All'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-section-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <SortButton col="username">User</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton col="user_role">Role</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton col="is_active">Status</SortButton>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortButton col="last_login_at">Last Login</SortButton>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <SortButton col="created_at">Created</SortButton>
                </TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading...
                    </p>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No users found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow
                    key={user.id}
                    className={loading ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100/80 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {getDisplayName(user)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <UserRoleBadge role={user.user_role} />
                    </TableCell>
                    <TableCell>
                      <UserStatusBadge isActive={user.is_active} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {user.last_login_at
                        ? formatDisplayDate(user.last_login_at)
                        : 'Never'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-500 dark:text-gray-400">
                      {formatDisplayDate(user.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/users/${user.id}`)
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {user.user_role !== 'super_admin' && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setRoleDialog({
                                    open: true,
                                    user,
                                    loading: false,
                                  })
                                }
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggleActive(user)}
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
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  setDeleteDialog({
                                    open: true,
                                    user,
                                    loading: false,
                                  })
                                }
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-amber-200/30 dark:border-stone-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * limit + 1}-
              {Math.min(page * limit, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page <= 1 || loading}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page >= totalPages || loading}
                onClick={() => handlePageChange(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <DeleteUserDialog
        open={deleteDialog.open}
        onOpenChange={open => setDeleteDialog(prev => ({ ...prev, open }))}
        username={deleteDialog.user ? getDisplayName(deleteDialog.user) : ''}
        onConfirm={handleDeleteUser}
        loading={deleteDialog.loading}
      />
      {roleDialog.user && (
        <ChangeRoleDialog
          open={roleDialog.open}
          onOpenChange={open => setRoleDialog(prev => ({ ...prev, open }))}
          username={getDisplayName(roleDialog.user)}
          currentRole={roleDialog.user.user_role}
          onConfirm={handleChangeRole}
          loading={roleDialog.loading}
        />
      )}
    </div>
  );
}
