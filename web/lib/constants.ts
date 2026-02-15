/**
 * Centralized constants for the application
 * All magic numbers and configuration values should be defined here
 */

// Type-safe icon component map
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// =====================================================
// File Upload Constants
// =====================================================
export const FILE_CONSTANTS = {
  // Maximum file sizes (in bytes)
  MAX_FILE_SIZE: {
    IMAGE: 5 * 1024 * 1024, // 5MB for images
    DOCUMENT: 10 * 1024 * 1024, // 10MB for PDFs
    GENERAL: 10 * 1024 * 1024, // 10MB general limit
  },

  // Allowed file types and their MIME types
  ALLOWED_FILE_TYPES: {
    images: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    documents: {
      'application/pdf': ['.pdf'],
    },
  },

  // Allowed file extensions
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'],

  // Storage configuration
  STORAGE: {
    BUCKET: 'problem-uploads',
    CACHE_CONTROL: '3600',
    SIGNED_URL_EXPIRES_IN: 60 * 5, // 5 minutes
    // File security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
} as const;

// =====================================================
// Rate Limiting Constants
// =====================================================
export const RATE_LIMIT_CONSTANTS = {
  // Time windows (in milliseconds)
  WINDOWS: {
    FIFTEEN_MINUTES: 15 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
  },

  // Rate limit configurations
  CONFIGURATIONS: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
    },
    fileUpload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 uploads per hour
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 auth attempts per 15 minutes
    },
    problemCreation: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50, // 50 problems per hour
    },
  },

  // Cleanup intervals
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

// =====================================================
// Request Validation Constants
// =====================================================
export const REQUEST_CONSTANTS = {
  // Maximum request sizes
  MAX_CONTENT_LENGTH: {
    JSON: 1024 * 1024, // 1MB for JSON
    FILE_UPLOAD: 10 * 1024 * 1024, // 10MB for file uploads
  },

  // Required headers
  REQUIRED_HEADERS: ['x-forwarded-for', 'user-agent'],
  OPTIONAL_HEADERS: ['x-real-ip', 'x-forwarded-proto', 'x-forwarded-host'],

  // Content types
  CONTENT_TYPES: {
    JSON: 'application/json',
    MULTIPART: 'multipart/form-data',
  },
} as const;

// =====================================================
// Database Constants
// =====================================================
export const DATABASE_CONSTANTS = {
  // Default pagination limits
  PAGINATION: {
    DEFAULT_LIMIT: 50,
    SEARCH_LIMIT: 20,
    ACTIVITY_LIMIT: 20,
    RECENT_LIMIT: 20,
    MAX_LIMIT: 1000,
  },

  // Timeout configurations
  STAGING_CLEANUP_HOURS: 24,
  MAX_AGE_HOURS: 24,
} as const;

// =====================================================
// Validation Constants
// =====================================================
export const VALIDATION_CONSTANTS = {
  // String length limits
  STRING_LIMITS: {
    USERNAME_MIN: 3,
    USERNAME_MAX: 50,

    FIRST_NAME_MIN: 1,
    FIRST_NAME_MAX: 100,

    LAST_NAME_MIN: 1,
    LAST_NAME_MAX: 100,

    REGION_MAX: 100,

    BIO_MAX: 500,

    TITLE_MIN: 1,
    TITLE_MAX: 50,

    TEXT_BODY_MAX: 5000,

    TAG_NAME_MIN: 1,
    TAG_NAME_MAX: 30,

    SUBJECT_NAME_MIN: 1,
    SUBJECT_NAME_MAX: 30,

    SETTING_KEY_MIN: 1,
    SETTING_KEY_MAX: 100,
  },
} as const;

// =====================================================
// Security Constants
// =====================================================
export const SECURITY_CONSTANTS = {
  // Security headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.supabase.in; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },

  // File security headers
  FILE_SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
} as const;

// =====================================================
// Error Messages
// =====================================================
export const ERROR_MESSAGES = {
  // General errors
  INVALID_DATE: 'Invalid date',
  UNAUTHORIZED: 'Unauthorized',
  NOT_FOUND: 'Not found',
  INTERNAL_ERROR: 'Internal server error',

  // File errors
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'File type is not allowed',
  FILE_UPLOAD_FAILED: 'File upload failed',

  // Request errors
  INVALID_REQUEST: 'Invalid request',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  MALICIOUS_REQUEST: 'Suspicious request detected',

  // Authentication errors
  NOT_SIGNED_IN: 'Not signed in',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SESSION_EXPIRED: 'Session expired',

  // Database errors
  DATABASE_ERROR: 'Database operation failed',
  RECORD_NOT_FOUND: 'Record not found',
  DUPLICATE_RECORD: 'Record already exists',
} as const;

// =====================================================
// Environment Variable Names
// =====================================================
export const ENV_VARS = {
  SUPABASE_URL: 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY',
  SUPABASE_SERVICE_ROLE_KEY: 'SUPABASE_SERVICE_ROLE_KEY',
} as const;

// =====================================================
// Application Routes
// =====================================================
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  ADMIN: {
    DASHBOARD: '/admin',
    USERS: '/admin/users',
    SETTINGS: '/admin/settings',
  },
  SUBJECTS: '/subjects',
  HOME: '/',
} as const;

// =====================================================
// User Roles
// =====================================================
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// =====================================================
// Problem Types and Status
// =====================================================
export const PROBLEM_CONSTANTS = {
  TYPES: {
    MCQ: 'mcq',
    SHORT: 'short',
    EXTENDED: 'extended',
  },
  STATUS: {
    WRONG: 'wrong',
    NEEDS_REVIEW: 'needs_review',
    MASTERED: 'mastered',
  },
} as const;

// =====================================================
// Problem Set Constants
// =====================================================
export const PROBLEM_SET_CONSTANTS = {
  SHARING_LEVELS: {
    PRIVATE: 'private',
    LIMITED: 'limited',
    PUBLIC: 'public',
  },
} as const;

// =====================================================
// Answer Configuration Constants
// =====================================================
export const ANSWER_CONFIG_CONSTANTS = {
  MCQ: {
    MIN_CHOICES: 2,
    MAX_CHOICES: 10,
    DEFAULT_CHOICES: ['A', 'B', 'C', 'D'],
    MAX_CHOICE_TEXT_LENGTH: 200,
  },
  SHORT_ANSWER: {
    MAX_ACCEPTABLE_ANSWERS: 20,
    MAX_ANSWER_LENGTH: 200,
    NUMERIC: {
      MIN_TOLERANCE: 0,
      MAX_UNIT_LENGTH: 50,
    },
  },
} as const;

// =====================================================
// Gender Options
// =====================================================
export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;

// =====================================================
// Subject Personalization Constants
// =====================================================
export const SUBJECT_CONSTANTS = {
  COLORS: [
    'amber',
    'orange',
    'rose',
    'blue',
    'emerald',
    'purple',
    'teal',
    'pink',
  ] as const,
  DEFAULT_COLOR: 'amber',
  DEFAULT_ICON: 'BookOpen',

  ICONS: [
    'BookOpen',
    'NotebookPen',
    'Calculator',
    'Atom',
    'Beaker',
    'Globe',
    'Languages',
    'Music',
    'Palette',
    'Code',
    'FlaskConical',
    'Microscope',
    'BookMarked',
    'GraduationCap',
    'Lightbulb',
  ] as const,

  // Smart icon suggestions based on keywords
  ICON_KEYWORDS: {
    Calculator: ['math', 'calculus', 'algebra', 'geometry', 'statistics'],
    Atom: ['physics', 'quantum', 'mechanic'],
    Beaker: ['chemistry', 'lab'],
    Code: ['programming', 'coding', 'computer', 'software'],
    Globe: ['geography', 'history', 'social'],
    Languages: ['chinese', 'spanish', 'french', 'latin', 'language'],
    Music: ['music', 'composition'],
    FlaskConical: ['chemistry', 'science'],
    Microscope: ['biology', 'microbiology'],
  } as Record<string, string[]>,

  // Tailwind class mappings for each color
  COLOR_GRADIENTS: {
    amber: {
      light: 'from-amber-50 to-amber-100/50',
      dark: 'dark:from-amber-950/40 dark:to-amber-900/20',
      border: 'border-amber-200/40 dark:border-amber-800/30',
      icon: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      buttonHover: 'hover:bg-amber-500/10 dark:hover:bg-amber-500/20',
    },
    orange: {
      light: 'from-orange-50 to-orange-100/50',
      dark: 'dark:from-orange-950/40 dark:to-orange-900/20',
      border: 'border-orange-200/40 dark:border-orange-800/30',
      icon: 'bg-orange-500/10 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      buttonHover: 'hover:bg-orange-500/10 dark:hover:bg-orange-500/20',
    },
    rose: {
      light: 'from-rose-50 to-rose-100/50',
      dark: 'dark:from-rose-950/40 dark:to-rose-900/20',
      border: 'border-rose-200/40 dark:border-rose-800/30',
      icon: 'bg-rose-500/10 dark:bg-rose-500/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      buttonHover: 'hover:bg-rose-500/10 dark:hover:bg-rose-500/20',
    },
    blue: {
      light: 'from-blue-50 to-blue-100/50',
      dark: 'dark:from-blue-950/40 dark:to-blue-900/20',
      border: 'border-blue-200/40 dark:border-blue-800/30',
      icon: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonHover: 'hover:bg-blue-500/10 dark:hover:bg-blue-500/20',
    },
    emerald: {
      light: 'from-emerald-50 to-emerald-100/50',
      dark: 'dark:from-emerald-950/40 dark:to-emerald-900/20',
      border: 'border-emerald-200/40 dark:border-emerald-800/30',
      icon: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      buttonHover: 'hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
    },
    purple: {
      light: 'from-purple-50 to-purple-100/50',
      dark: 'dark:from-purple-950/40 dark:to-purple-900/20',
      border: 'border-purple-200/40 dark:border-purple-800/30',
      icon: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      buttonHover: 'hover:bg-purple-500/10 dark:hover:bg-purple-500/20',
    },
    teal: {
      light: 'from-teal-50 to-teal-100/50',
      dark: 'dark:from-teal-950/40 dark:to-teal-900/20',
      border: 'border-teal-200/40 dark:border-teal-800/30',
      icon: 'bg-teal-500/10 dark:bg-teal-500/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      buttonHover: 'hover:bg-teal-500/10 dark:hover:bg-teal-500/20',
    },
    pink: {
      light: 'from-pink-50 to-pink-100/50',
      dark: 'dark:from-pink-950/40 dark:to-pink-900/20',
      border: 'border-pink-200/40 dark:border-pink-800/30',
      icon: 'bg-pink-500/10 dark:bg-pink-500/20',
      iconColor: 'text-pink-600 dark:text-pink-400',
      buttonHover: 'hover:bg-pink-500/10 dark:hover:bg-pink-500/20',
    },
  },
} as const;

export type SubjectColor = (typeof SUBJECT_CONSTANTS.COLORS)[number];
export type SubjectIcon = (typeof SUBJECT_CONSTANTS.ICONS)[number];

// Helper: Get next color in rotation
export function getNextSubjectColor(
  existingSubjects: Array<{ color?: string }>
): SubjectColor {
  const colorCounts = SUBJECT_CONSTANTS.COLORS.map(color => ({
    color,
    count: existingSubjects.filter(s => s.color === color).length,
  }));

  // Return color with lowest count
  return colorCounts.sort((a, b) => a.count - b.count)[0].color;
}

// Helper: Suggest icon based on subject name
export function suggestIconForSubject(name: string): SubjectIcon {
  const lowerName = name.toLowerCase();

  for (const [icon, keywords] of Object.entries(
    SUBJECT_CONSTANTS.ICON_KEYWORDS
  )) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return icon as SubjectIcon;
    }
  }

  return SUBJECT_CONSTANTS.DEFAULT_ICON;
}

const ICON_COMPONENT_MAP: Record<SubjectIcon, LucideIcon> = {
  BookOpen: Icons.BookOpen,
  NotebookPen: Icons.NotebookPen,
  Calculator: Icons.Calculator,
  Atom: Icons.Atom,
  Beaker: Icons.Beaker,
  Globe: Icons.Globe,
  Languages: Icons.Languages,
  Music: Icons.Music,
  Palette: Icons.Palette,
  Code: Icons.Code,
  FlaskConical: Icons.FlaskConical,
  Microscope: Icons.Microscope,
  BookMarked: Icons.BookMarked,
  GraduationCap: Icons.GraduationCap,
  Lightbulb: Icons.Lightbulb,
};

// Helper: Get icon component with runtime validation and fallback
export function getIconComponent(iconName: string): LucideIcon {
  // Type guard to check if iconName is a valid SubjectIcon
  if (
    SUBJECT_CONSTANTS.ICONS.includes(iconName as SubjectIcon) &&
    iconName in ICON_COMPONENT_MAP
  ) {
    return ICON_COMPONENT_MAP[iconName as SubjectIcon];
  }
  // Fallback to default icon for invalid names
  console.warn(
    `Invalid icon name "${iconName}", falling back to ${SUBJECT_CONSTANTS.DEFAULT_ICON}`
  );
  return Icons.BookOpen;
}
