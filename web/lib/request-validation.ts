import { NextRequest } from 'next/server';
import { z } from 'zod';

// Request validation schemas
export const requestValidationSchemas = {
  // Basic request validation
  basic: z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    contentType: z.string().optional(),
    userAgent: z.string().optional(),
    origin: z.string().optional(),
  }),

  // File upload validation
  fileUpload: z.object({
    contentType: z.string().regex(/^multipart\/form-data/),
    contentLength: z.number().max(50 * 1024 * 1024), // 50MB max
  }),

  // API request validation
  apiRequest: z.object({
    contentType: z.string().regex(/^application\/json/),
    contentLength: z.number().max(1024 * 1024), // 1MB max for JSON
  }),
};

// Security headers validation
export const securityHeaders = {
  required: ['x-forwarded-for', 'user-agent'],
  optional: ['x-real-ip', 'x-forwarded-proto', 'x-forwarded-host'],
};

// Suspicious patterns to detect
export const suspiciousPatterns = {
  sqlInjection:
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  xss: /<script[^>]*>|javascript\s*:|on\w+\s*=\s*["']/i,
  pathTraversal: /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i,
  commandInjection: /[;&|`$()]/,
  suspiciousUserAgents: [
    'sqlmap',
    'nikto',
    'nmap',
    'masscan',
    'zap',
    'burp',
    'w3af',
    'acunetix',
    'nessus',
  ],
};

// Common query parameter patterns that are safe
const safeQueryPatterns = {
  // Common API query parameters
  apiParams:
    /^(subject_id|search_text|search_title|search_content|problem_types|tag_ids|page|limit|offset|sort|order)=/i,
  // Boolean values
  booleanValues: /^(true|false)$/i,
  // UUIDs
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  // Common problem types
  problemTypes: /^(mcq|short|extended)$/i,
  // Common sort values
  sortValues: /^(created_at|updated_at|title|problem_type)$/i,
  // Common order values
  orderValues: /^(asc|desc|ascending|descending)$/i,
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Helper function to check if a query parameter value is safe
function isSafeQueryValue(key: string, value: string): boolean {
  // Check if it's a known safe parameter
  if (safeQueryPatterns.apiParams.test(key + '=')) {
    // For search_text, allow any text (will be sanitized by the API)
    if (key === 'search_text') {
      return true;
    }
    // For boolean parameters
    if (key === 'search_title' || key === 'search_content') {
      return safeQueryPatterns.booleanValues.test(value);
    }
    // For problem_types, allow comma-separated values
    if (key === 'problem_types') {
      return value
        .split(',')
        .every(type => safeQueryPatterns.problemTypes.test(type.trim()));
    }
    // For tag_ids, allow comma-separated UUIDs
    if (key === 'tag_ids') {
      return value
        .split(',')
        .every(id => safeQueryPatterns.uuid.test(id.trim()));
    }
    // For subject_id, expect a UUID
    if (key === 'subject_id') {
      return safeQueryPatterns.uuid.test(value);
    }
    // For other parameters, allow alphanumeric and common characters
    return /^[a-zA-Z0-9_,.-]+$/.test(value);
  }

  // For unknown parameters, be more restrictive
  return /^[a-zA-Z0-9_.-]+$/.test(value);
}

// Helper function to parse and validate query parameters
function validateQueryParameters(searchParams: URLSearchParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [key, value] of searchParams.entries()) {
    // Skip empty values
    if (!value) continue;

    // Check if the parameter value is safe
    if (!isSafeQueryValue(key, value)) {
      errors.push(`Suspicious query parameter: ${key}=${value}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRequest(req: NextRequest): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check request method
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    errors.push(`Invalid HTTP method: ${req.method}`);
    riskLevel = 'high';
  }

  // Check content type
  const contentType = req.headers.get('content-type') || '';
  if (req.method !== 'GET' && !contentType) {
    warnings.push('Missing content-type header');
    riskLevel = 'medium';
  }

  // Check content length
  const contentLength = parseInt(req.headers.get('content-length') || '0');
  if (contentLength > 50 * 1024 * 1024) {
    // 50MB
    errors.push('Request too large');
    riskLevel = 'high';
  }

  // Check user agent
  const userAgent = req.headers.get('user-agent') || '';
  if (!userAgent) {
    warnings.push('Missing user-agent header');
    riskLevel = 'medium';
  } else {
    // Check for suspicious user agents
    const isSuspicious = suspiciousPatterns.suspiciousUserAgents.some(ua =>
      userAgent.toLowerCase().includes(ua.toLowerCase())
    );
    if (isSuspicious) {
      errors.push('Suspicious user-agent detected');
      riskLevel = 'high';
    }
  }

  // Check for suspicious patterns in URL
  const url = req.url;
  const pathname = req.nextUrl.pathname;

  // First, validate query parameters intelligently
  const queryValidation = validateQueryParameters(req.nextUrl.searchParams);
  if (!queryValidation.isValid) {
    errors.push(...queryValidation.errors);
    riskLevel = 'high';
  }

  // Check for SQL injection in the path (not query parameters)
  const pathOnly = pathname;
  if (suspiciousPatterns.sqlInjection.test(pathOnly)) {
    errors.push('Potential SQL injection attempt detected in path');
    riskLevel = 'high';
  }

  // Check for XSS in the path (not query parameters)
  if (suspiciousPatterns.xss.test(pathOnly)) {
    errors.push('Potential XSS attempt detected in path');
    riskLevel = 'high';
  }

  // Check for path traversal
  if (suspiciousPatterns.pathTraversal.test(url)) {
    errors.push('Potential path traversal attempt detected');
    riskLevel = 'high';
  }

  // Check for command injection in the path (not query parameters)
  if (suspiciousPatterns.commandInjection.test(pathOnly)) {
    errors.push('Potential command injection attempt detected in path');
    riskLevel = 'high';
  }

  // Check origin header
  const origin = req.headers.get('origin');
  if (origin && !isValidOrigin(origin)) {
    warnings.push('Suspicious origin header');
    riskLevel = 'medium';
  }

  // Check referer header
  const referer = req.headers.get('referer');
  if (referer && !isValidReferer(referer)) {
    warnings.push('Suspicious referer header');
    riskLevel = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    riskLevel,
  };
}

function isValidOrigin(origin: string): boolean {
  // Allow localhost for development
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }

  // Allow your production domain
  const allowedOrigins = [
    'https://your-domain.vercel.app',
    'https://wrong-question-notebook.vercel.app',
  ];

  return allowedOrigins.some(allowed => origin.startsWith(allowed));
}

function isValidReferer(referer: string): boolean {
  // Allow same-origin requests
  if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
    return true;
  }

  // Allow your production domain
  const allowedReferers = [
    'https://your-domain.vercel.app',
    'https://wrong-question-notebook.vercel.app',
  ];

  return allowedReferers.some(allowed => referer.startsWith(allowed));
}

// Validate request body for specific endpoints
export function validateRequestBody(
  body: any,
  schema: z.ZodSchema
): ValidationResult {
  try {
    schema.parse(body);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      riskLevel: 'low',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map(
          (e: any) => `${e.path.join('.')}: ${e.message}`
        ),
        warnings: [],
        riskLevel: 'medium',
      };
    }
    return {
      isValid: false,
      errors: ['Invalid request body format'],
      warnings: [],
      riskLevel: 'high',
    };
  }
}

// Rate limiting key generator based on user and endpoint
export function generateRateLimitKey(
  req: NextRequest,
  userId?: string
): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const endpoint = req.nextUrl.pathname;

  if (userId) {
    return `user:${userId}:${endpoint}`;
  }

  return `ip:${ip}:${endpoint}`;
}

// Security headers for responses
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}
