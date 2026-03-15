import { createServiceClient } from './supabase-utils';
import { USAGE_QUOTA_CONSTANTS } from './constants';
import { getTodayInTimezone, DEFAULT_TIMEZONE } from './timezone-utils';

export interface QuotaCheckResult {
  allowed: boolean;
  current_usage: number;
  daily_limit: number;
  remaining: number;
}

/** Resolve the system default limit for a resource type. */
function getDefaultLimit(resourceType: string): number {
  return (
    USAGE_QUOTA_CONSTANTS.DEFAULT_LIMITS[resourceType] ??
    USAGE_QUOTA_CONSTANTS.DEFAULTS.AI_EXTRACTION_DAILY_LIMIT
  );
}

/**
 * Get the effective daily limit for a user (override or system default).
 */
export async function getUserQuotaLimit(
  userId: string,
  resourceType: string = USAGE_QUOTA_CONSTANTS.RESOURCE_TYPES.AI_EXTRACTION
): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('user_quota_overrides')
    .select('daily_limit')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .maybeSingle();

  if (error) {
    console.error('Quota override lookup failed:', error);
    throw new Error('Failed to look up quota limit');
  }

  return data?.daily_limit ?? getDefaultLimit(resourceType);
}

/**
 * Atomically check and increment a user's daily quota for a resource.
 * The DB RPC looks up per-user overrides and falls back to the system default.
 */
export async function checkAndIncrementQuota(
  userId: string,
  resourceType: string = USAGE_QUOTA_CONSTANTS.RESOURCE_TYPES.AI_EXTRACTION,
  userTimezone: string = DEFAULT_TIMEZONE
): Promise<QuotaCheckResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.rpc('check_and_increment_quota', {
    p_user_id: userId,
    p_resource_type: resourceType,
    p_default_limit: getDefaultLimit(resourceType),
    p_user_tz: userTimezone,
  });

  if (error) {
    console.error('Quota check failed:', error);
    throw new Error('Failed to check usage quota');
  }

  return data as QuotaCheckResult;
}

/**
 * Read-only query for current quota usage (does not increment).
 * Looks up the user's effective limit (override or default) for display.
 */
export async function getQuotaUsage(
  userId: string,
  resourceType: string = USAGE_QUOTA_CONSTANTS.RESOURCE_TYPES.AI_EXTRACTION,
  userTimezone: string = DEFAULT_TIMEZONE
): Promise<QuotaCheckResult> {
  const supabase = createServiceClient();

  const [usageResult, effectiveLimit] = await Promise.all([
    supabase
      .from('usage_quotas')
      .select('usage_count')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('period_start', getTodayInTimezone(userTimezone))
      .maybeSingle(),
    getUserQuotaLimit(userId, resourceType),
  ]);

  if (usageResult.error) {
    console.error('Quota usage query failed:', usageResult.error);
    throw new Error('Failed to fetch usage quota');
  }

  const currentUsage = usageResult.data?.usage_count ?? 0;

  return {
    allowed: currentUsage < effectiveLimit,
    current_usage: currentUsage,
    daily_limit: effectiveLimit,
    remaining: Math.max(effectiveLimit - currentUsage, 0),
  };
}
