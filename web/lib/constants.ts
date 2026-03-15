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
    AVATAR_BUCKET: 'avatars',
    AVATAR_MAX_SIZE: 2 * 1024 * 1024, // 2MB
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
      maxRequests: 60, // 60 problems per hour
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
    ACTIVITY: '/admin/activity',
    SETTINGS: '/admin/settings',
    ANNOUNCEMENTS: '/admin/announcements',
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
  MOBILE_CARD_LIST_PAGE_SIZE: 10,
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
    MAX_CHOICE_TEXT_LENGTH: 500,
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
// CAPTCHA Constants
// =====================================================
export const CAPTCHA_CONSTANTS = {
  // Cloudflare Turnstile site key
  TURNSTILE_SITE_KEY: '0x4AAAAAACgUHR0HEEo3h1J4',
} as const;

// =====================================================
// AI Constants
// =====================================================
export const AI_CONSTANTS = {
  EXTRACTION: {
    MAX_IMAGE_SIZE: FILE_CONSTANTS.MAX_FILE_SIZE.IMAGE,
    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ] as readonly string[],
    RATE_LIMIT: { windowMs: 60 * 1000, maxRequests: 100 },
    COMPRESS_THRESHOLD: 4.3 * 1024 * 1024, // compress if base64 length exceeds this (leaves headroom below 4.5 MB Vercel limit)
    COMPRESS_MAX_DIMENSION: 1500, // max px on longest side
    COMPRESS_QUALITY: 0.8, // JPEG quality when compressing
  },
} as const;

// =====================================================
// Usage Quota Constants
// =====================================================
export const USAGE_QUOTA_CONSTANTS = {
  RESOURCE_TYPES: { AI_EXTRACTION: 'ai_extraction' },
  DEFAULTS: { AI_EXTRACTION_DAILY_LIMIT: 10 },
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
      cardBg: 'bg-amber-50/30 dark:bg-amber-950/20',
      badge:
        'bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    },
    orange: {
      light: 'from-orange-50 to-orange-100/50',
      dark: 'dark:from-orange-950/40 dark:to-orange-900/20',
      border: 'border-orange-200/40 dark:border-orange-800/30',
      icon: 'bg-orange-500/10 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      buttonHover: 'hover:bg-orange-500/10 dark:hover:bg-orange-500/20',
      cardBg: 'bg-orange-50/30 dark:bg-orange-950/20',
      badge:
        'bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    },
    rose: {
      light: 'from-rose-50 to-rose-100/50',
      dark: 'dark:from-rose-950/40 dark:to-rose-900/20',
      border: 'border-rose-200/40 dark:border-rose-800/30',
      icon: 'bg-rose-500/10 dark:bg-rose-500/20',
      iconColor: 'text-rose-600 dark:text-rose-400',
      buttonHover: 'hover:bg-rose-500/10 dark:hover:bg-rose-500/20',
      cardBg: 'bg-rose-50/30 dark:bg-rose-950/20',
      badge:
        'bg-rose-100/80 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    },
    blue: {
      light: 'from-blue-50 to-blue-100/50',
      dark: 'dark:from-blue-950/40 dark:to-blue-900/20',
      border: 'border-blue-200/40 dark:border-blue-800/30',
      icon: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      buttonHover: 'hover:bg-blue-500/10 dark:hover:bg-blue-500/20',
      cardBg: 'bg-blue-50/30 dark:bg-blue-950/20',
      badge:
        'bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    },
    emerald: {
      light: 'from-emerald-50 to-emerald-100/50',
      dark: 'dark:from-emerald-950/40 dark:to-emerald-900/20',
      border: 'border-emerald-200/40 dark:border-emerald-800/30',
      icon: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      buttonHover: 'hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20',
      cardBg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
      badge:
        'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    },
    purple: {
      light: 'from-purple-50 to-purple-100/50',
      dark: 'dark:from-purple-950/40 dark:to-purple-900/20',
      border: 'border-purple-200/40 dark:border-purple-800/30',
      icon: 'bg-purple-500/10 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      buttonHover: 'hover:bg-purple-500/10 dark:hover:bg-purple-500/20',
      cardBg: 'bg-purple-50/30 dark:bg-purple-950/20',
      badge:
        'bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    },
    teal: {
      light: 'from-teal-50 to-teal-100/50',
      dark: 'dark:from-teal-950/40 dark:to-teal-900/20',
      border: 'border-teal-200/40 dark:border-teal-800/30',
      icon: 'bg-teal-500/10 dark:bg-teal-500/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
      buttonHover: 'hover:bg-teal-500/10 dark:hover:bg-teal-500/20',
      cardBg: 'bg-teal-50/30 dark:bg-teal-950/20',
      badge:
        'bg-teal-100/80 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    },
    pink: {
      light: 'from-pink-50 to-pink-100/50',
      dark: 'dark:from-pink-950/40 dark:to-pink-900/20',
      border: 'border-pink-200/40 dark:border-pink-800/30',
      icon: 'bg-pink-500/10 dark:bg-pink-500/20',
      iconColor: 'text-pink-600 dark:text-pink-400',
      buttonHover: 'hover:bg-pink-500/10 dark:hover:bg-pink-500/20',
      cardBg: 'bg-pink-50/30 dark:bg-pink-950/20',
      badge:
        'bg-pink-100/80 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
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

// =====================================================
// Attempt & Reflection Constants
// =====================================================
export const ATTEMPT_CONSTANTS = {
  CAUSE_CATEGORIES: {
    INCORRECT: [
      { value: 'careless', label: 'Careless mistake' },
      { value: 'misread', label: 'Misread the question' },
      { value: 'knowledge_gap', label: 'Knowledge gap' },
      { value: 'forgot_method', label: 'Forgot the method' },
      { value: 'ran_out_of_time', label: 'Ran out of time' },
      { value: 'guessed', label: 'Guessed' },
      { value: 'other', label: 'Other' },
    ],
    CORRECT: [
      { value: 'confident', label: 'Confident' },
      { value: 'educated_guess', label: 'Educated guess' },
      { value: 'elimination', label: 'Process of elimination' },
      { value: 'lucky', label: 'Got lucky' },
      { value: 'other', label: 'Other' },
    ],
  },
  CONFIDENCE_LABELS: {
    1: 'Wild guess',
    2: 'Uncertain',
    3: 'Somewhat confident',
    4: 'Fairly confident',
    5: 'Absolutely certain',
  } as Record<number, string>,
  MAX_CAUSE_LENGTH: 50,
  MAX_REFLECTION_NOTES_LENGTH: 2000,
  MAX_RESPONSE_LENGTH: 500,
  TIMELINE_PAGE_SIZE: 5,
} as const;

// =====================================================
// QR Upload Session Constants
// =====================================================
export const QR_SESSION_CONSTANTS = {
  TOKEN_BYTES: 32,
  SESSION_EXPIRY_MINUTES: 5,
  REALTIME_FALLBACK_DELAY_MS: 5000,
  STORAGE_PATH_PREFIX: 'qr-uploads',
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILE_SIZE: FILE_CONSTANTS.MAX_FILE_SIZE.IMAGE,
  RATE_LIMITS: {
    SESSION_CREATION: { windowMs: 15 * 60 * 1000, maxRequests: 50 },
  },
  ERRORS: {
    SESSION_EXPIRED: 'QR code expired. Generate a new one on your computer.',
    SESSION_ALREADY_USED: 'QR code already used.',
    INVALID_TOKEN: 'Invalid link. Please scan the QR code again.',
    SESSION_NOT_FOUND: 'Session not found.',
    NOT_UPLOADED: 'No image has been uploaded yet.',
    FILE_TOO_LARGE: 'Image is too large. Maximum size is 5MB.',
    INVALID_FILE_TYPE: 'Please upload a JPEG, PNG, WebP, or GIF image.',
  },
} as const;

// =====================================================
// Cookie Consent Constants
// =====================================================
// =====================================================
// Spaced Repetition Constants
// =====================================================
export const SPACED_REPETITION_CONSTANTS = {
  DEFAULT_EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  DEFAULT_INTERVAL: 1,
  INITIAL_INTERVALS: [1, 3],
  MAX_SESSION_SIZE: 50,
  DEFAULT_SESSION_SIZE: 20,
  SESSION_PRESETS: [5, 10, 20],
} as const;

// =====================================================
// Insight & Error Categorisation Constants
// =====================================================
export const ERROR_CATEGORY_VALUES = [
  'conceptual_misunderstanding',
  'procedural_error',
  'knowledge_gap',
  'misread_question',
  'careless_mistake',
  'time_pressure',
  'incomplete_answer',
] as const;

export type ErrorBroadCategory = (typeof ERROR_CATEGORY_VALUES)[number];

export const ERROR_CATEGORY_LABELS: Record<ErrorBroadCategory, string> = {
  conceptual_misunderstanding: 'Conceptual',
  procedural_error: 'Procedural',
  knowledge_gap: 'Knowledge Gap',
  misread_question: 'Misread Question',
  careless_mistake: 'Careless Mistake',
  time_pressure: 'Time Pressure',
  incomplete_answer: 'Incomplete',
};

export const ERROR_CATEGORY_COLORS: Record<
  ErrorBroadCategory,
  { bg: string; text: string; dot: string }
> = {
  conceptual_misunderstanding: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  procedural_error: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
  },
  knowledge_gap: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  misread_question: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  careless_mistake: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-400',
    dot: 'bg-purple-500',
  },
  time_pressure: {
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    text: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  incomplete_answer: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-400',
    dot: 'bg-gray-500',
  },
};

export const INSIGHT_CONSTANTS = {
  MAX_WEAK_SPOTS_OVERVIEW: 7,
  MAX_WEAK_SPOTS_EXPANDED: 20,
  /** Minimum unique problems with at least one attempt (any outcome) */
  MIN_ACTIVITY_FOR_INSIGHTS: 5,
  /** Minimum unique problems with categorised errors for full error analysis */
  MIN_ERRORS_FOR_FULL_DIGEST: 3,
  /** Minimum subjects for cross-subject comparative framing */
  MIN_SUBJECTS_FOR_CROSS_SUBJECT: 2,
  BACKFILL_BATCH_SIZE: 20,
  DIGEST_COOLDOWN_HOURS: 24,
  MAX_DIGESTS_RETAINED: 30,
  MAX_REVIEW_PROBLEMS: 50,
  /** If a digest has been 'generating' for longer than this, treat it as stale/failed */
  GENERATING_STALE_MINUTES: 5,
  /** Polling interval (ms) for checking generation status on client */
  GENERATION_POLL_INTERVAL_MS: 10 * 1000,
  /** Max polling attempts before giving up (~5 minutes) */
  MAX_POLL_ATTEMPTS: 30,
} as const;

export const COOKIE_CONSENT_CONSTANTS = {
  COOKIE_NAME: 'wqn-cookie-consent',
  CONSENT_VERSION: 1, // bump to force re-consent if categories change
  MAX_AGE_SECONDS: 182 * 24 * 60 * 60, // ~6 months
} as const;

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
