import { FILE_CONSTANTS } from './constants';

/**
 * Maximum allowed file sizes by type
 */
export const MAX_FILE_SIZES = {
  image: FILE_CONSTANTS.MAX_FILE_SIZE.IMAGE,
  document: FILE_CONSTANTS.MAX_FILE_SIZE.DOCUMENT,
} as const;

export function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase(); // Convert to lowercase
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || '';
}

export function validateFilePath(filePath: string): boolean {
  // Check for directory traversal attempts
  if (
    filePath.includes('..') ||
    filePath.includes('~') ||
    filePath.startsWith('/')
  ) {
    return false;
  }

  // Check for allowed path pattern (user/{userId}/...)
  const userPathPattern =
    /^user\/[a-f0-9-]+\/(staging|problems)\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  return userPathPattern.test(filePath);
}

export function generateSecureFilePath(
  userId: string,
  category: 'staging' | 'problems',
  stagingId?: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);

  if (category === 'staging') {
    return `user/${userId}/staging/${stagingId || randomId}/${timestamp}_${randomId}`;
  } else {
    return `user/${userId}/problems/${timestamp}_${randomId}`;
  }
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: 'image' | 'document';
  sanitizedFilename?: string;
}

/**
 * Validates an uploaded file against security constraints
 * - Checks file size against limits
 * - Validates MIME type against allowed types
 * - Can enforce specific file type requirements
 * - Returns sanitized filename for safe storage
 * 
 * @param file - The File object to validate
 * @param options - Validation options including size limits and allowed types
 * @returns Validation result with error message if invalid
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    requireImage?: boolean;
    requireDocument?: boolean;
  } = {}
): FileValidationResult {
  const {
    maxSize = MAX_FILE_SIZES.image,
    allowedTypes = Object.keys(FILE_CONSTANTS.ALLOWED_FILE_TYPES.images),
    requireImage = false,
    requireDocument = false,
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Determine file type
  let fileType: 'image' | 'document' | undefined;
  if (
    Object.keys(FILE_CONSTANTS.ALLOWED_FILE_TYPES.images).includes(file.type)
  ) {
    fileType = 'image';
  } else if (
    Object.keys(FILE_CONSTANTS.ALLOWED_FILE_TYPES.documents).includes(file.type)
  ) {
    fileType = 'document';
  }

  // Check specific requirements
  if (requireImage && fileType !== 'image') {
    return {
      isValid: false,
      error: 'Only image files are allowed for this upload',
    };
  }

  if (requireDocument && fileType !== 'document') {
    return {
      isValid: false,
      error: 'Only PDF documents are allowed for this upload',
    };
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(file.name);

  return {
    isValid: true,
    fileType,
    sanitizedFilename,
  };
}

export function isImageFile(mimeType: string): boolean {
  return Object.keys(FILE_CONSTANTS.ALLOWED_FILE_TYPES.images).includes(
    mimeType
  );
}

export function isDocumentFile(mimeType: string): boolean {
  return Object.keys(FILE_CONSTANTS.ALLOWED_FILE_TYPES.documents).includes(
    mimeType
  );
}

/**
 * Returns security headers for file responses
 * These headers prevent:
 * - MIME type sniffing attacks
 * - Clickjacking via iframes
 * - XSS attacks
 * - Information leakage via referrer
 * 
 * @param filename - The filename to include in Content-Disposition header
 * @returns Object containing security headers
 */
export function getFileSecurityHeaders(filename: string) {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Disposition': `inline; filename="${sanitizeFilename(filename)}"`,
  };

  return headers;
}
