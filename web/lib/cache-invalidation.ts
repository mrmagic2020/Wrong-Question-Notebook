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
} from './cache-config';

/**
 * Revalidate all subjects cache for a specific user
 */
export async function revalidateUserSubjects(userId: string): Promise<void> {
  const userSubjectsTag = createUserCacheTag(CACHE_TAGS.USER_SUBJECTS, userId);
  await revalidateTag(userSubjectsTag);
  await revalidateTag(CACHE_TAGS.SUBJECTS);
}

/**
 * Revalidate all problems cache for a specific user
 */
export async function revalidateUserProblems(userId: string): Promise<void> {
  const userProblemsTag = createUserCacheTag(CACHE_TAGS.USER_PROBLEMS, userId);
  await revalidateTag(userProblemsTag);
  await revalidateTag(CACHE_TAGS.PROBLEMS);
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
  await revalidateTag(subjectProblemsTag);
  await revalidateTag(CACHE_TAGS.PROBLEMS);
}

/**
 * Revalidate all problem sets cache for a specific user
 */
export async function revalidateUserProblemSets(userId: string): Promise<void> {
  const userProblemSetsTag = createUserCacheTag(
    CACHE_TAGS.USER_PROBLEM_SETS,
    userId
  );
  await revalidateTag(userProblemSetsTag);
  await revalidateTag(CACHE_TAGS.PROBLEM_SETS);
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
  await revalidateTag(problemSetTag);
  await revalidateTag(CACHE_TAGS.PROBLEM_SETS);
}

/**
 * Revalidate all tags cache for a specific user
 */
export async function revalidateUserTags(userId: string): Promise<void> {
  const userTagsTag = createUserCacheTag(CACHE_TAGS.USER_TAGS, userId);
  await revalidateTag(userTagsTag);
  await revalidateTag(CACHE_TAGS.TAGS);
}

/**
 * Revalidate tags cache for a specific subject
 */
export async function revalidateSubjectTags(subjectId: string): Promise<void> {
  const subjectTagsTag = createSubjectCacheTag(CACHE_TAGS.TAGS, subjectId);
  await revalidateTag(subjectTagsTag);
  await revalidateTag(CACHE_TAGS.TAGS);
}

/**
 * Revalidate admin statistics cache
 */
export async function revalidateAdminStats(): Promise<void> {
  await revalidateTag(CACHE_TAGS.ADMIN_STATS);
}

/**
 * Revalidate admin users cache
 */
export async function revalidateAdminUsers(): Promise<void> {
  await revalidateTag(CACHE_TAGS.ADMIN_USERS);
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
