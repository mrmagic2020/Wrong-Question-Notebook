import { createServiceClient } from './supabase-utils';
import { CONTENT_LIMIT_CONSTANTS } from './constants';

const { RESOURCE_TYPES, DEFAULTS } = CONTENT_LIMIT_CONSTANTS;

export interface ContentLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  resource_type: string;
  /** Per-subject breakdown (only for per-subject resource types in getAllContentLimits) */
  per_subject?: Array<{
    subject_id: string;
    subject_name: string;
    current: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultLimit(resourceType: string): number {
  return DEFAULTS[resourceType] ?? 0;
}

function buildResult(
  resourceType: string,
  current: number,
  limit: number
): ContentLimitResult {
  return {
    allowed: current < limit,
    current,
    limit,
    remaining: Math.max(limit - current, 0),
    resource_type: resourceType,
  };
}

// ---------------------------------------------------------------------------
// Limit resolution (override or default)
// ---------------------------------------------------------------------------

export async function getContentLimit(
  userId: string,
  resourceType: string
): Promise<number> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('content_limit_overrides')
    .select('limit_value')
    .eq('user_id', userId)
    .eq('resource_type', resourceType)
    .maybeSingle();

  if (error) {
    console.error('Content limit override lookup failed:', error);
    throw new Error('Failed to look up content limit');
  }

  return data ? Number(data.limit_value) : getDefaultLimit(resourceType);
}

// ---------------------------------------------------------------------------
// Count queries
// ---------------------------------------------------------------------------

async function countSubjects(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('subjects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error('Failed to count subjects');
  return count ?? 0;
}

async function countProblemsInSubject(
  userId: string,
  subjectId: string
): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('problems')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subject_id', subjectId);

  if (error) throw new Error('Failed to count problems');
  return count ?? 0;
}

async function countProblemSets(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('problem_sets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw new Error('Failed to count problem sets');
  return count ?? 0;
}

async function countTagsInSubject(
  userId: string,
  subjectId: string
): Promise<number> {
  const supabase = createServiceClient();
  const { count, error } = await supabase
    .from('tags')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subject_id', subjectId);

  if (error) throw new Error('Failed to count tags');
  return count ?? 0;
}

async function getStorageBytes(userId: string): Promise<number> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc('get_user_storage_bytes', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Storage RPC failed:', error);
    return 0; // Fail open — don't block uploads on query failure
  }

  return Number(data) || 0;
}

// ---------------------------------------------------------------------------
// Single limit check
// ---------------------------------------------------------------------------

export async function checkContentLimit(
  userId: string,
  resourceType: string,
  context?: { subjectId?: string }
): Promise<ContentLimitResult> {
  const limit = await getContentLimit(userId, resourceType);

  let current: number;
  switch (resourceType) {
    case RESOURCE_TYPES.SUBJECTS:
      current = await countSubjects(userId);
      break;
    case RESOURCE_TYPES.PROBLEMS_PER_SUBJECT:
      if (!context?.subjectId)
        throw new Error('subjectId required for problems_per_subject');
      current = await countProblemsInSubject(userId, context.subjectId);
      break;
    case RESOURCE_TYPES.PROBLEM_SETS:
      current = await countProblemSets(userId);
      break;
    case RESOURCE_TYPES.TAGS_PER_SUBJECT:
      if (!context?.subjectId)
        throw new Error('subjectId required for tags_per_subject');
      current = await countTagsInSubject(userId, context.subjectId);
      break;
    case RESOURCE_TYPES.STORAGE_BYTES:
      current = await getStorageBytes(userId);
      break;
    default:
      throw new Error(`Unknown resource type: ${resourceType}`);
  }

  return buildResult(resourceType, current, limit);
}

// ---------------------------------------------------------------------------
// All limits (for the usage dialog)
// ---------------------------------------------------------------------------

/** Per-subject breakdown for a given resource type. */
async function getPerSubjectBreakdown(
  userId: string,
  resourceType: string
): Promise<{
  max: number;
  breakdown: Array<{
    subject_id: string;
    subject_name: string;
    current: number;
  }>;
}> {
  const supabase = createServiceClient();

  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name')
    .eq('user_id', userId)
    .order('name');

  if (error || !subjects) return { max: 0, breakdown: [] };

  const table =
    resourceType === RESOURCE_TYPES.PROBLEMS_PER_SUBJECT ? 'problems' : 'tags';

  const counts = await Promise.all(
    subjects.map(async s => {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('subject_id', s.id);
      return {
        subject_id: s.id,
        subject_name: s.name,
        current: count ?? 0,
      };
    })
  );

  const max = counts.reduce((m, c) => Math.max(m, c.current), 0);
  return { max, breakdown: counts };
}

export async function getAllContentLimits(
  userId: string
): Promise<ContentLimitResult[]> {
  const resourceTypes = Object.values(RESOURCE_TYPES);

  // Fetch all overrides in one query
  const supabase = createServiceClient();
  const { data: overrides } = await supabase
    .from('content_limit_overrides')
    .select('resource_type, limit_value')
    .eq('user_id', userId);

  const overrideMap = new Map(
    (overrides ?? []).map(o => [o.resource_type, Number(o.limit_value)])
  );

  const resolveLimit = (rt: string) =>
    overrideMap.get(rt) ?? getDefaultLimit(rt);

  // Gather counts in parallel
  const [
    subjectCount,
    problemSetCount,
    storageBytes,
    problemsBreakdown,
    tagsBreakdown,
  ] = await Promise.all([
    countSubjects(userId),
    countProblemSets(userId),
    getStorageBytes(userId),
    getPerSubjectBreakdown(userId, RESOURCE_TYPES.PROBLEMS_PER_SUBJECT),
    getPerSubjectBreakdown(userId, RESOURCE_TYPES.TAGS_PER_SUBJECT),
  ]);

  return resourceTypes.map(rt => {
    const limit = resolveLimit(rt);

    switch (rt) {
      case RESOURCE_TYPES.SUBJECTS:
        return buildResult(rt, subjectCount, limit);

      case RESOURCE_TYPES.PROBLEMS_PER_SUBJECT:
        return {
          ...buildResult(rt, problemsBreakdown.max, limit),
          per_subject: problemsBreakdown.breakdown,
        };

      case RESOURCE_TYPES.PROBLEM_SETS:
        return buildResult(rt, problemSetCount, limit);

      case RESOURCE_TYPES.TAGS_PER_SUBJECT:
        return {
          ...buildResult(rt, tagsBreakdown.max, limit),
          per_subject: tagsBreakdown.breakdown,
        };

      case RESOURCE_TYPES.STORAGE_BYTES:
        return buildResult(rt, storageBytes, limit);

      default:
        return buildResult(rt, 0, limit);
    }
  });
}

// ---------------------------------------------------------------------------
// Admin override management
// ---------------------------------------------------------------------------

export async function setContentLimitOverride(
  userId: string,
  resourceType: string,
  limitValue: number
): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase.from('content_limit_overrides').upsert(
    {
      user_id: userId,
      resource_type: resourceType,
      limit_value: limitValue,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,resource_type' }
  );

  if (error) {
    console.error('Failed to set content limit override:', error);
    return false;
  }
  return true;
}

export async function removeContentLimitOverride(
  userId: string,
  resourceType: string
): Promise<boolean> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('content_limit_overrides')
    .delete()
    .eq('user_id', userId)
    .eq('resource_type', resourceType);

  if (error) {
    console.error('Failed to remove content limit override:', error);
    return false;
  }
  return true;
}
