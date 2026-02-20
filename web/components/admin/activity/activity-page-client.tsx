'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { UserActivityLogType } from '@/lib/schemas';

type ActivityWithProfile = UserActivityLogType & {
  user_profiles?: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  };
};
import { formatDisplayDateTime } from '@/lib/common-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChevronLeft, ChevronRight, Filter, X } from 'lucide-react';

interface ActivityPageClientProps {
  initialActivities: ActivityWithProfile[];
  initialTotalCount: number;
}

export function ActivityPageClient({
  initialActivities,
  initialTotalCount,
}: ActivityPageClientProps) {
  const [activities, setActivities] =
    useState<ActivityWithProfile[]>(initialActivities);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const fetchActivities = useCallback(
    async (p: number, action: string, from: string, to: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: p.toString(),
          limit: limit.toString(),
        });
        if (action) params.set('action', action);
        if (from) params.set('from', from);
        if (to) params.set('to', to);

        const res = await fetch(`/api/admin/activity?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setActivities(data.activities);
        setTotalCount(data.total_count);
      } catch {
        toast.error('Failed to fetch activity');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleApplyFilters = () => {
    setPage(1);
    fetchActivities(1, actionFilter, fromDate, toDate);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
    fetchActivities(1, '', '', '');
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchActivities(newPage, actionFilter, fromDate, toDate);
  };

  const totalPages = Math.ceil(totalCount / limit);
  const hasFilters = actionFilter || fromDate || toDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Activity Log
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse platform-wide activity
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-2"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-amber-500" />}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="admin-section-card">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Action
              </label>
              <Input
                placeholder="e.g. login, create_problem"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                From Date
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="rounded-xl"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
            {hasFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="rounded-xl"
                onClick={handleClearFilters}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="admin-section-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Resource</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Loading...
                    </p>
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No activity found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                activities.map(activity => {
                  const profile = activity.user_profiles;
                  const displayName =
                    profile?.username ||
                    [profile?.first_name, profile?.last_name]
                      .filter(Boolean)
                      .join(' ') ||
                    'Unknown';

                  return (
                    <TableRow
                      key={activity.id}
                      className={loading ? 'opacity-50' : ''}
                    >
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {displayName}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs border-amber-200/50 dark:border-amber-800/40"
                        >
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {activity.resource_type ? (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {activity.resource_type}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDisplayDateTime(activity.created_at)}
                      </TableCell>
                    </TableRow>
                  );
                })
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
    </div>
  );
}
