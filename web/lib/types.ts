import { z } from 'zod';

// Import from schemas to maintain consistency
import { ProblemType, ProblemStatus } from './schemas';
export { ProblemType, ProblemStatus };
export type ProblemTypeType = z.infer<typeof ProblemType>;
export type ProblemStatusType = z.infer<typeof ProblemStatus>;

// =====================================================
// User Management Types
// =====================================================

// User roles enum
export const UserRole = z.enum(['user', 'moderator', 'admin', 'super_admin']);
export type UserRoleType = z.infer<typeof UserRole>;

// Gender enum
export const Gender = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
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
  details: z.record(z.any()).nullable(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type UserActivityLogType = z.infer<typeof UserActivityLog>;

// Admin settings schema
export const AdminSettings = z.object({
  id: z.string().uuid(),
  key: z.string(),
  value: z.record(z.any()),
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
  username: z.string().min(3).max(50).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  date_of_birth: z.string().date().optional(),
  gender: Gender.optional(),
  region: z.string().max(100).optional(),
  timezone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const UpdateUserProfileDto = CreateUserProfileDto.partial().extend({
  user_role: UserRole.optional(),
  is_active: z.boolean().optional(),
});

export const CreateAdminSettingsDto = z.object({
  key: z.string().min(1).max(100),
  value: z.record(z.any()),
  description: z.string().optional(),
});

export const UpdateAdminSettingsDto = z.object({
  value: z.record(z.any()),
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

// Create/Update DTOs
export const CreateSubjectDto = z.object({
  name: z.string().min(1).max(120),
});

export const CreateProblemDto = z.object({
  subject_id: z.string().uuid(),
  content: z.string().optional(),
  assets: z
    .array(
      z.object({
        path: z.string(),
        kind: z.enum(['image', 'pdf']).optional(),
      })
    )
    .default([]),
  problem_type: ProblemType,
  correct_answer: z.any().optional(), // keep flexible for now
  auto_mark: z.boolean().default(false),
  status: ProblemStatus.default('needs_review'),
});

export const UpdateProblemDto = CreateProblemDto.partial();
export const UpdateSubjectDto = CreateSubjectDto.partial();
