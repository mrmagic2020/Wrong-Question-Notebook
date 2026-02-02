/**
 * Cache invalidation utilities for Vercel Data Cache
 *
 * Provides helper functions for on-demand cache revalidation after data mutations.
 */

import { revalidateTag, revalidatePath } from 'next/cache';
import {
  CACHE_TAGS,
  createUserCacheTag,
  createSubjectCacheTag,
  createProblemSetCacheTag,
  createProblemCacheTag,
} from './cache-config';

/**
 * Revalidate all subjects cache for a specific user
 */
export async function revalidateUserSubjects(userId: string): Promise<void> {
  const userSubjectsTag = createUserCacheTag(CACHE_TAGS.USER_SUBJECTS, userId);
  await revalidateTag(userSubjectsTag, "max");
  await revalidateTag(CACHE_TAGS.SUBJECTS, "max");
}

/**
 * Revalidate all problems cache for a specific user
 */
export async function revalidateUserProblems(userId: string): Promise<void> {
  const userProblemsTag = createUserCacheTag(CACHE_TAGS.USER_PROBLEMS, userId);
  await revalidateTag(userProblemsTag, "max");
  await revalidateTag(CACHE_TAGS.PROBLEMS, "max");
}

/**
 * Revalidate problems cache for a specific subject
 */
export async function revalidateSubjectProblems(
  subjectId: string
): Promise<void> {
  const subjectProblemsTag = createSubjectCacheTag(
    CACHE_TAGS.PROBLEMS,
    subjectId
  );
  await revalidateTag(subjectProblemsTag, "max");
  await revalidateTag(CACHE_TAGS.PROBLEMS, "max");
}

/**
 * Revalidate cache for a specific problem (most granular)
 */
export async function revalidateProblem(problemId: string): Promise<void> {
  const problemTag = createProblemCacheTag(CACHE_TAGS.PROBLEMS, problemId);
  await revalidateTag(problemTag, "max");
  await revalidateTag(CACHE_TAGS.PROBLEMS, "max");
}

/**
 * Revalidate cache for a specific problem and its subject (optimal for status updates)
 */
export async function revalidateProblemAndSubject(
  problemId: string,
  subjectId: string
): Promise<void> {
  await Promise.all([
    revalidateProblem(problemId),
    revalidateSubjectProblems(subjectId),
  ]);
}

/**
 * Revalidate cache for a problem and all related caches (for deletions/updates)
 * This includes the problem, its subject, and all problem sets that might contain it
 */
export async function revalidateProblemComprehensive(
  problemId: string,
  subjectId: string,
  userId: string
): Promise<void> {
  await Promise.all([
    revalidateProblem(problemId),
    revalidateSubjectProblems(subjectId),
    revalidateUserProblems(userId),
    revalidateUserProblemSets(userId), // Invalidate all user's problem sets
  ]);
}

/**
 * Revalidate all problem sets cache for a specific user
 */
export async function revalidateUserProblemSets(userId: string): Promise<void> {
  const userProblemSetsTag = createUserCacheTag(
    CACHE_TAGS.USER_PROBLEM_SETS,
    userId
  );
  await revalidateTag(userProblemSetsTag, "max");
  await revalidateTag(CACHE_TAGS.PROBLEM_SETS, "max");
}

/**
 * Revalidate problem set cache for a specific problem set
 */
export async function revalidateProblemSet(
  problemSetId: string
): Promise<void> {
  const problemSetTag = createProblemSetCacheTag(
    CACHE_TAGS.PROBLEM_SETS,
    problemSetId
  );
  await revalidateTag(problemSetTag, "max");
  await revalidateTag(CACHE_TAGS.PROBLEM_SETS, "max");
}

/**
 * Revalidate all tags cache for a specific user
 */
export async function revalidateUserTags(userId: string): Promise<void> {
  const userTagsTag = createUserCacheTag(CACHE_TAGS.USER_TAGS, userId);
  await revalidateTag(userTagsTag, "max");
  await revalidateTag(CACHE_TAGS.TAGS, "max");
}

/**
 * Revalidate tags cache for a specific subject
 */
export async function revalidateSubjectTags(subjectId: string): Promise<void> {
  const subjectTagsTag = createSubjectCacheTag(CACHE_TAGS.TAGS, subjectId);
  await revalidateTag(subjectTagsTag, "max");
  await revalidateTag(CACHE_TAGS.TAGS, "max");
}

/**
 * Revalidate admin statistics cache
 */
export async function revalidateAdminStats(): Promise<void> {
  await revalidateTag(CACHE_TAGS.ADMIN_STATS, "max");
}

/**
 * Revalidate admin users cache
 */
export async function revalidateAdminUsers(): Promise<void> {
  await revalidateTag(CACHE_TAGS.ADMIN_USERS, "max");
}

/**
 * Revalidate all caches for a specific user (useful for user deletion or role changes)
 */
export async function revalidateAllUserCaches(userId: string): Promise<void> {
  await Promise.all([
    revalidateUserSubjects(userId),
    revalidateUserProblems(userId),
    revalidateUserProblemSets(userId),
    revalidateUserTags(userId),
  ]);
}

/**
 * Revalidate specific page paths
 */
export async function revalidateSubjectsPage(): Promise<void> {
  await revalidatePath('/subjects');
}

export async function revalidateProblemSetsPage(): Promise<void> {
  await revalidatePath('/problem-sets');
}

export async function revalidateSubjectPage(subjectId: string): Promise<void> {
  await revalidatePath(`/subjects/${subjectId}`);
  await revalidatePath(`/subjects/${subjectId}/problems`);
  await revalidatePath(`/subjects/${subjectId}/tags`);
}

export async function revalidateProblemSetPage(
  problemSetId: string
): Promise<void> {
  await revalidatePath(`/problem-sets/${problemSetId}`);
}

export async function revalidateAdminPage(): Promise<void> {
  await revalidatePath('/admin');
}
