import { z } from 'zod';
import {
  PROBLEM_CONSTANTS,
  VALIDATION_CONSTANTS,
  USER_ROLES,
  GENDER_OPTIONS,
} from './constants';

// Database enum values - these should match the PostgreSQL enum type
export const PROBLEM_TYPE_VALUES = [
  PROBLEM_CONSTANTS.TYPES.MCQ,
  PROBLEM_CONSTANTS.TYPES.SHORT,
  PROBLEM_CONSTANTS.TYPES.EXTENDED,
] as const;
export const PROBLEM_STATUS_VALUES = [
  PROBLEM_CONSTANTS.STATUS.WRONG,
  PROBLEM_CONSTANTS.STATUS.NEEDS_REVIEW,
  PROBLEM_CONSTANTS.STATUS.MASTERED,
] as const;

export const ProblemType = z.enum(PROBLEM_TYPE_VALUES);
export type ProblemType = z.infer<typeof ProblemType>;

export const ProblemStatus = z.enum(PROBLEM_STATUS_VALUES);
export type ProblemStatus = z.infer<typeof ProblemStatus>;

const Asset = z.object({
  path: z.string(),
  kind: z.enum(['image', 'pdf']).optional(),
});

export const CreateProblemDto = z.object({
  subject_id: z.uuid(),
  title: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.TITLE_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.TITLE_MAX),
  content: z
    .string()
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX)
    .optional(),
  problem_type: ProblemType,
  correct_answer: z
    .string()
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX)
    .optional(),
  auto_mark: z.boolean().default(false),
  status: ProblemStatus.default(PROBLEM_CONSTANTS.STATUS.NEEDS_REVIEW),
  assets: z.array(Asset).default([]),

  // NEW:
  solution_text: z
    .string()
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.TEXT_BODY_MAX)
    .optional(),
  solution_assets: z.array(Asset).default([]),
  last_reviewed_date: z.string().optional(),

  tag_ids: z.array(z.uuid()).optional(),
});

export const UpdateProblemDto = CreateProblemDto.partial();

export const CreateTagDto = z.object({
  subject_id: z.uuid(),
  name: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.TAG_NAME_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.TAG_NAME_MAX),
});

export const UpdateTagDto = z.object({
  name: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.TAG_NAME_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.TAG_NAME_MAX)
    .optional(),
});

export const CreateAttemptDto = z.object({
  problem_id: z.uuid(),
  submitted_answer: z.any(), // keep flexible; will handle in review endpoints later
  is_correct: z.boolean().nullable().optional(), // optional for manual types
  cause: z.string().optional(), // reflection text
});

export const ListAttemptsQuery = z.object({
  problem_id: z.uuid(),
});

// =====================================================
// User Management Types
// =====================================================

// User roles enum
export const UserRole = z.enum([
  USER_ROLES.USER,
  USER_ROLES.MODERATOR,
  USER_ROLES.ADMIN,
  USER_ROLES.SUPER_ADMIN,
]);
export type UserRoleType = z.infer<typeof UserRole>;

// Gender enum
export const Gender = z.enum([
  GENDER_OPTIONS.MALE,
  GENDER_OPTIONS.FEMALE,
  GENDER_OPTIONS.OTHER,
  GENDER_OPTIONS.PREFER_NOT_TO_SAY,
]);
export type GenderType = z.infer<typeof Gender>;

// User profile schema
export const UserProfile = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  date_of_birth: z.string().date().nullable(),
  gender: Gender.nullable(),
  region: z.string().nullable(),
  timezone: z.string().default('UTC'),
  avatar_url: z.string().url().nullable(),
  bio: z.string().nullable(),
  user_role: UserRole.default('user'),
  is_active: z.boolean().default(true),
  last_login_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserProfileType = z.infer<typeof UserProfile>;

// User activity log schema
export const UserActivityLog = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  action: z.string(),
  resource_type: z.string().nullable(),
  resource_id: z.string().uuid().nullable(),
  details: z.record(z.string(), z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type UserActivityLogType = z.infer<typeof UserActivityLog>;

// Admin settings schema
export const AdminSettings = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.record(z.string(), z.any()),
  description: z.string().nullable(),
  updated_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type AdminSettingsType = z.infer<typeof AdminSettings>;

// User statistics schema
export const UserStatistics = z.object({
  total_users: z.number(),
  active_users: z.number(),
  admin_users: z.number(),
  new_users_today: z.number(),
  new_users_this_week: z.number(),
});

export type UserStatisticsType = z.infer<typeof UserStatistics>;

// Create/Update DTOs for user profiles
export const CreateUserProfileDto = z.object({
  username: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.USERNAME_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.USERNAME_MAX)
    .optional(),
  first_name: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.FIRST_NAME_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.FIRST_NAME_MAX)
    .optional(),
  last_name: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.LAST_NAME_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.LAST_NAME_MAX)
    .optional(),
  date_of_birth: z.string().date().optional(),
  gender: Gender.optional(),
  region: z
    .string()
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.REGION_MAX)
    .optional(),
  timezone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(VALIDATION_CONSTANTS.STRING_LIMITS.BIO_MAX).optional(),
});

export const UpdateUserProfileDto = CreateUserProfileDto.partial().extend({
  user_role: UserRole.optional(),
  is_active: z.boolean().optional(),
});

export const CreateAdminSettingsDto = z.object({
  key: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.SETTING_KEY_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.SETTING_KEY_MAX),
  value: z.record(z.string(), z.any()),
  description: z.string().optional(),
});

export const UpdateAdminSettingsDto = z.object({
  value: z.record(z.string(), z.any()),
  description: z.string().optional(),
});

// Extended user type that includes auth data
export interface ExtendedUser {
  id: string;
  email: string;
  profile: UserProfileType | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

// Admin dashboard data type
export interface AdminDashboardData {
  statistics: UserStatisticsType;
  recentUsers: UserProfileType[];
  recentActivity: UserActivityLogType[];
  systemSettings: AdminSettingsType[];
}

// Subject DTOs
export const CreateSubjectDto = z.object({
  name: z
    .string()
    .min(VALIDATION_CONSTANTS.STRING_LIMITS.SUBJECT_NAME_MIN)
    .max(VALIDATION_CONSTANTS.STRING_LIMITS.SUBJECT_NAME_MAX),
});

export const UpdateSubjectDto = CreateSubjectDto.partial();
