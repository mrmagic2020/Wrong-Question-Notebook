/**
 * Centralized constants for the application
 * All magic numbers and configuration values should be defined here
 */

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

    TEXT_BODY_MAX: 1000,

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
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
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
// Gender Options
// =====================================================
export const GENDER_OPTIONS = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
} as const;
