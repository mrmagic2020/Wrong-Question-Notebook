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
  details?: Record<string, any>
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
  value: Record<string, any>
): Promise<AdminSettingsType | null> {
  const serviceSupabase = createServiceClient();

  const { data: authData } = await serviceSupabase.auth.getUser();
  if (!authData.user) {
    return null;
  }

  const { data, error } = await serviceSupabase
    .from('admin_settings')
    .update({
      value,
      updated_by: authData.user.id,
    })
    .eq('key', key)
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
      console.error('Error deleting user subjects:', subjectsError);
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
      console.error('Error deleting user activity logs:', activityError);
      // Continue anyway
    }

    // 5. Delete user profile (this should cascade delete any remaining related records)
    const { error: profileError } = await serviceSupabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return false;
    }

    // 6. Finally, delete user from auth (this requires service role)
    const { error: authError } =
      await serviceSupabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
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
        console.error(`Error listing directory ${path}:`, listError);
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
          console.error(`Error deleting files in ${path}:`, deleteError);
        }
      }
    }
  } catch (error) {
    console.error('Error in deleteUserStorageFiles:', error);
  }
}
