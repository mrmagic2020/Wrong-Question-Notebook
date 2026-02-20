import { createClient } from '@/lib/supabase/server';
import {
  UserProfileType,
  UserRoleType,
  ExtendedUser,
  UserStatisticsType,
  UserActivityLogType,
  AdminSettingsType,
} from '@/lib/schemas';
import { createServiceClient } from './supabase-utils';
import { DATABASE_CONSTANTS } from './constants';
import { logger } from './logger';

/**
 * Get user profile by ID
 */
export async function getUserProfile(
  userId: string
): Promise<UserProfileType | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get user profile by ID using service role (for admin operations)
 */
export async function getUserProfileWithServiceRole(
  userId: string
): Promise<UserProfileType | null> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// Service client is now imported from supabase-utils

/**
 * Get extended user information including auth data and profile
 */
export async function getExtendedUser(
  userId: string
): Promise<ExtendedUser | null> {
  const supabase = await createClient();

  // Get auth user data
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || authData.user.id !== userId) {
    return null;
  }

  // Get user profile
  const profile = await getUserProfile(userId);

  return {
    id: authData.user.id,
    email: authData.user.email!,
    profile,
    isAdmin:
      profile?.user_role === 'admin' || profile?.user_role === 'super_admin',
    isSuperAdmin: profile?.user_role === 'super_admin',
  };
}

/**
 * Check if current user is admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return false;
  }

  // Use service role to bypass RLS for admin check
  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from('user_profiles')
    .select('user_role')
    .eq('id', authData.user.id)
    .single();

  return (
    profile?.user_role === 'admin' ||
    profile?.user_role === 'super_admin' ||
    false
  );
}

/**
 * Check if current user is super admin
 */
export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return false;
  }

  // Use service role to bypass RLS for admin check
  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from('user_profiles')
    .select('user_role')
    .eq('id', authData.user.id)
    .single();

  return profile?.user_role === 'super_admin' || false;
}

/**
 * Get all users for admin management
 */
export async function getAllUsers(
  limit: number = DATABASE_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  offset: number = 0
): Promise<UserProfileType[]> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Search users by username, email, or name
 */
export async function searchUsers(
  query: string,
  limit: number = DATABASE_CONSTANTS.PAGINATION.SEARCH_LIMIT
): Promise<UserProfileType[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .or(
      `username.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
    )
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfileType>
): Promise<UserProfileType | null> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRoleType
): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase
    .from('user_profiles')
    .update({ user_role: newRole })
    .eq('id', userId);

  return !error;
}

/**
 * Toggle user active status
 */
export async function toggleUserActive(userId: string): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  // First get current status
  const profile = await getUserProfileWithServiceRole(userId);
  if (!profile) {
    return false;
  }

  const { error } = await serviceSupabase
    .from('user_profiles')
    .update({ is_active: !profile.is_active })
    .eq('id', userId);

  return !error;
}

/**
 * Get user statistics for admin dashboard
 */
export async function getUserStatistics(): Promise<UserStatisticsType | null> {
  const serviceSupabase = createServiceClient();

  try {
    // Get total users
    const { count: totalUsers } = await serviceSupabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Get active users
    const { count: activeUsers } = await serviceSupabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Get admin users
    const { count: adminUsers } = await serviceSupabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .in('user_role', ['admin', 'super_admin']);

    // Get new users today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await serviceSupabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // Get new users this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: newUsersThisWeek } = await serviceSupabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    return {
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      admin_users: adminUsers || 0,
      new_users_today: newUsersToday || 0,
      new_users_this_week: newUsersThisWeek || 0,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    return {
      total_users: 0,
      active_users: 0,
      admin_users: 0,
      new_users_today: 0,
      new_users_this_week: 0,
    };
  }
}

/**
 * Get recent user activity
 */
export async function getRecentActivity(
  limit: number = DATABASE_CONSTANTS.PAGINATION.ACTIVITY_LIMIT
): Promise<UserActivityLogType[]> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('user_activity_log')
    .select(
      `
      *,
      user_profiles!inner(username, first_name, last_name)
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Log user activity
 */
export async function logUserActivity(
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase.rpc('log_user_activity', {
    p_action: action,
    p_resource_type: resourceType,
    p_resource_id: resourceId,
    p_details: details,
  });

  return !error;
}

/**
 * Get admin settings
 */
export async function getAdminSettings(): Promise<AdminSettingsType[]> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('admin_settings')
    .select('*')
    .order('key');

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Update admin setting
 */
export async function updateAdminSetting(
  key: string,
  value: Record<string, unknown>
): Promise<AdminSettingsType | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const serviceSupabase = createServiceClient();
  const { data, error } = await serviceSupabase
    .from('admin_settings')
    .upsert(
      {
        key,
        value,
        updated_by: user.id,
      },
      { onConflict: 'key' }
    )
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Get users by role
 */
export async function getUsersByRole(
  role: UserRoleType
): Promise<UserProfileType[]> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('user_profiles')
    .select('*')
    .eq('user_role', role)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Get user activity for a specific user
 */
export async function getUserActivity(
  userId: string,
  limit: number = DATABASE_CONSTANTS.PAGINATION.DEFAULT_LIMIT
): Promise<UserActivityLogType[]> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('user_activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data;
}

/**
 * Get all users with total count for paginated admin table
 */
export async function getAllUsersWithCount(
  limit: number = DATABASE_CONSTANTS.PAGINATION.DEFAULT_LIMIT,
  offset: number = 0,
  search?: string,
  role?: string,
  sortColumn: string = 'created_at',
  sortDir: 'asc' | 'desc' = 'desc'
): Promise<{ users: UserProfileType[]; total_count: number }> {
  const serviceSupabase = createServiceClient();

  let query = serviceSupabase
    .from('user_profiles')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `username.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
    );
  }

  if (role) {
    query = query.eq('user_role', role);
  }

  const allowedSortColumns = [
    'created_at',
    'username',
    'user_role',
    'is_active',
    'last_login_at',
  ];
  const col = allowedSortColumns.includes(sortColumn)
    ? sortColumn
    : 'created_at';

  query = query
    .order(col, { ascending: sortDir === 'asc' })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error || !data) {
    return { users: [], total_count: 0 };
  }

  return { users: data, total_count: count || 0 };
}

/**
 * Get content statistics for admin dashboard
 */
export async function getContentStatistics(): Promise<{
  total_problems: number;
  total_subjects: number;
  total_problem_sets: number;
  total_attempts: number;
}> {
  const serviceSupabase = createServiceClient();

  const [problems, subjects, problemSets, attempts] = await Promise.all([
    serviceSupabase
      .from('problems')
      .select('*', { count: 'exact', head: true }),
    serviceSupabase
      .from('subjects')
      .select('*', { count: 'exact', head: true }),
    serviceSupabase
      .from('problem_sets')
      .select('*', { count: 'exact', head: true }),
    serviceSupabase
      .from('attempts')
      .select('*', { count: 'exact', head: true }),
  ]);

  return {
    total_problems: problems.count || 0,
    total_subjects: subjects.count || 0,
    total_problem_sets: problemSets.count || 0,
    total_attempts: attempts.count || 0,
  };
}

/**
 * Get per-user content statistics
 */
export async function getUserContentStatistics(userId: string): Promise<{
  subjects: number;
  problems: number;
  problem_sets: number;
  attempts: number;
}> {
  const serviceSupabase = createServiceClient();

  const [subjects, problems, problemSets, attempts] = await Promise.all([
    serviceSupabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    serviceSupabase
      .from('problems')
      .select('*, subjects!inner(user_id)', { count: 'exact', head: true })
      .eq('subjects.user_id', userId),
    serviceSupabase
      .from('problem_sets')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    serviceSupabase
      .from('attempts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  return {
    subjects: subjects.count || 0,
    problems: problems.count || 0,
    problem_sets: problemSets.count || 0,
    attempts: attempts.count || 0,
  };
}

/**
 * Get storage usage for a specific user
 */
export async function getUserStorageUsage(
  userId: string
): Promise<{ totalBytes: number; fileCount: number }> {
  const serviceSupabase = createServiceClient();
  let totalBytes = 0;
  let fileCount = 0;

  async function listRecursive(path: string) {
    const { data: items } = await serviceSupabase.storage
      .from('problem-uploads')
      .list(path, { limit: 1000 });

    if (!items) return;

    for (const item of items) {
      const itemPath = `${path}/${item.name}`;
      if (item.metadata?.size) {
        totalBytes += item.metadata.size;
        fileCount++;
      } else if (!item.metadata?.mimetype) {
        await listRecursive(itemPath);
      }
    }
  }

  await listRecursive(`user/${userId}`);
  return { totalBytes, fileCount };
}

/**
 * Get total storage usage across all users
 */
export async function getTotalStorageUsage(): Promise<{
  totalBytes: number;
  fileCount: number;
}> {
  const serviceSupabase = createServiceClient();
  let totalBytes = 0;
  let fileCount = 0;

  async function listRecursive(path: string) {
    const { data: items } = await serviceSupabase.storage
      .from('problem-uploads')
      .list(path, { limit: 1000 });

    if (!items) return;

    for (const item of items) {
      const itemPath = path ? `${path}/${item.name}` : item.name;
      if (item.metadata?.size) {
        totalBytes += item.metadata.size;
        fileCount++;
      } else if (!item.metadata?.mimetype) {
        await listRecursive(itemPath);
      }
    }
  }

  await listRecursive('');
  return { totalBytes, fileCount };
}

/**
 * Get filtered activity with total count
 */
export async function getFilteredActivity(options: {
  limit?: number;
  offset?: number;
  userId?: string;
  action?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<{ activities: UserActivityLogType[]; total_count: number }> {
  const serviceSupabase = createServiceClient();
  const {
    limit = DATABASE_CONSTANTS.PAGINATION.ACTIVITY_LIMIT,
    offset = 0,
    userId,
    action,
    fromDate,
    toDate,
  } = options;

  let query = serviceSupabase
    .from('user_activity_log')
    .select('*, user_profiles!inner(username, first_name, last_name)', {
      count: 'exact',
    });

  if (userId) {
    query = query.eq('user_id', userId);
  }
  if (action) {
    query = query.eq('action', action);
  }
  if (fromDate) {
    query = query.gte('created_at', fromDate);
  }
  if (toDate) {
    query = query.lte('created_at', toDate);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error || !data) {
    return { activities: [], total_count: 0 };
  }

  return { activities: data, total_count: count || 0 };
}

/**
 * Get announcement from admin_settings
 */
export async function getAnnouncement(): Promise<{
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success';
} | null> {
  const serviceSupabase = createServiceClient();

  const { data, error } = await serviceSupabase
    .from('admin_settings')
    .select('value')
    .eq('key', 'site_announcement')
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const val = data.value as Record<string, unknown>;
  return {
    enabled: (val.enabled as boolean) || false,
    message: (val.message as string) || '',
    type: (val.type as 'info' | 'warning' | 'success') || 'info',
  };
}

/**
 * Set announcement in admin_settings
 */
export async function setAnnouncement(
  enabled: boolean,
  message: string,
  type: 'info' | 'warning' | 'success'
): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase.from('admin_settings').upsert(
    {
      key: 'site_announcement',
      value: { enabled, message, type },
      description: 'Site-wide announcement banner',
    },
    { onConflict: 'key' }
  );

  return !error;
}

/**
 * Set user quota override
 */
export async function setUserQuotaOverride(
  userId: string,
  resourceType: string,
  dailyLimit: number
): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase.from('user_quota_overrides').upsert(
    {
      user_id: userId,
      resource_type: resourceType,
      daily_limit: dailyLimit,
    },
    { onConflict: 'user_id,resource_type' }
  );

  return !error;
}

/**
 * Remove user quota override
 */
export async function removeUserQuotaOverride(
  userId: string,
  resourceType: string
): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase
    .from('user_quota_overrides')
    .delete()
    .eq('user_id', userId)
    .eq('resource_type', resourceType);

  return !error;
}

/**
 * Delete user completely (admin only) - includes all related data and storage
 */
export async function deleteUser(userId: string): Promise<boolean> {
  const serviceSupabase = createServiceClient();

  try {
    // 1. Delete all user's storage files first
    await deleteUserStorageFiles(userId);

    // 2. Delete user's subjects (this will cascade to problems, tags, etc.)
    const { error: subjectsError } = await serviceSupabase
      .from('subjects')
      .delete()
      .eq('user_id', userId);

    if (subjectsError) {
      logger.error('Error deleting user subjects', subjectsError, {
        component: 'UserManagement',
        action: 'deleteUser',
        userId,
      });
      // Continue anyway, as this might be due to RLS policies
    }

    // 3. Delete user's attempts
    const { error: attemptsError } = await serviceSupabase
      .from('attempts')
      .delete()
      .eq('user_id', userId);

    if (attemptsError) {
      console.error('Error deleting user attempts:', attemptsError);
      // Continue anyway
    }

    // 4. Delete user's activity logs
    const { error: activityError } = await serviceSupabase
      .from('user_activity_log')
      .delete()
      .eq('user_id', userId);

    if (activityError) {
      logger.error('Error deleting user activity logs', activityError, {
        component: 'UserManagement',
        action: 'deleteUser',
        userId,
      });
      // Continue anyway
    }

    // 5. Delete user profile (this should cascade delete any remaining related records)
    const { error: profileError } = await serviceSupabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      logger.error('Error deleting user profile', profileError, {
        component: 'UserManagement',
        action: 'deleteUser',
        userId,
      });
      return false;
    }

    // 6. Finally, delete user from auth (this requires service role)
    const { error: authError } =
      await serviceSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      logger.error('Error deleting auth user', authError, {
        component: 'UserManagement',
        action: 'deleteUser',
        userId,
      });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting user', error, {
      component: 'UserManagement',
      action: 'deleteUser',
      userId,
    });
    return false;
  }
}

/**
 * Delete all storage files for a user (recursive)
 */
async function deleteUserStorageFiles(userId: string): Promise<void> {
  const serviceSupabase = createServiceClient();

  try {
    // Recursively delete all files in the user's directory
    await deleteDirectoryRecursive(`user/${userId}`);

    async function deleteDirectoryRecursive(path: string) {
      const { data: items, error: listError } = await serviceSupabase.storage
        .from('problem-uploads')
        .list(path, {
          limit: DATABASE_CONSTANTS.PAGINATION.MAX_LIMIT,
          offset: 0,
        });

      if (listError) {
        logger.error(`Error listing directory ${path}`, listError, {
          component: 'UserManagement',
          action: 'deleteDirectoryRecursive',
          path,
        });
        return;
      }

      if (!items || items.length === 0) {
        return;
      }

      const filesToDelete: string[] = [];

      for (const item of items) {
        const itemPath = `${path}/${item.name}`;

        if (item.metadata?.mimetype) {
          // It's a file
          filesToDelete.push(itemPath);
        } else {
          // It's a directory, recurse
          await deleteDirectoryRecursive(itemPath);
        }
      }

      // Delete all files in this directory
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await serviceSupabase.storage
          .from('problem-uploads')
          .remove(filesToDelete);

        if (deleteError) {
          logger.error(`Error deleting files in ${path}`, deleteError, {
            component: 'UserManagement',
            action: 'deleteDirectoryRecursive',
            path,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Error in deleteUserStorageFiles', error, {
      component: 'UserManagement',
      action: 'deleteUserStorageFiles',
    });
  }
}
