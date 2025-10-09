import { NextRequest } from 'next/server';
import { z } from 'zod';
import { REQUEST_CONSTANTS, SECURITY_CONSTANTS } from './constants';

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
    contentLength: z
      .number()
      .max(REQUEST_CONSTANTS.MAX_CONTENT_LENGTH.FILE_UPLOAD),
  }),

  // API request validation
  apiRequest: z.object({
    contentType: z.string().regex(/^application\/json/),
    contentLength: z.number().max(REQUEST_CONSTANTS.MAX_CONTENT_LENGTH.JSON),
  }),
};

// Security headers validation
export const securityHeaders = {
  required: REQUEST_CONSTANTS.REQUIRED_HEADERS,
  optional: REQUEST_CONSTANTS.OPTIONAL_HEADERS,
};

// Malicious patterns to detect (blacklist approach)
export const maliciousPatterns = {
  // SQL injection patterns - more comprehensive
  sqlInjection: [
    /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT|TRUNCATE|GRANT|REVOKE)\b/i,
    /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i, // OR 1=1, AND 1=1
    /(\bOR\b|\bAND\b)\s+['"]\s*=\s*['"]/i, // OR ''=''
    /UNION\s+SELECT/i,
    /--\s*$|#\s*$|\/\*.*\*\//i, // SQL comments
    /(BENCHMARK|SLEEP|WAITFOR)\s*\(/i, // Time-based attacks
  ],

  // XSS patterns - more comprehensive
  xss: [
    /<script[^>]*>.*?<\/script>/i,
    /javascript\s*:/i,
    /on\w+\s*=\s*["'][^"']*["']/i, // Event handlers
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i,
    /expression\s*\(/i, // CSS expressions
    /vbscript\s*:/i,
  ],

  // Path traversal patterns
  pathTraversal: [
    /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i,
    /%2e%2e%2f|%2e%2e%5c/i, // URL encoded
    /\.\.%252f|\.\.%255c/i, // Double URL encoded
    /\.\.%c0%af|\.\.%c1%9c/i, // UTF-8 encoded
  ],

  // Command injection patterns - more precise to avoid false positives
  commandInjection: [
    /;\s*(rm|cat|ls|pwd|whoami|id|wget|curl|nc|netcat|bash|sh|cmd|powershell)/i, // Command chaining with dangerous commands
    /\|\s*(rm|cat|ls|pwd|whoami|id|wget|curl|nc|netcat|bash|sh|cmd|powershell)/i, // Pipe with dangerous commands
    /`[^`]*(rm|cat|ls|pwd|whoami|id|wget|curl|nc|netcat|bash|sh|cmd|powershell)[^`]*`/i, // Backtick execution with dangerous commands
    /\$\s*\([^)]*(rm|cat|ls|pwd|whoami|id|wget|curl|nc|netcat|bash|sh|cmd|powershell)[^)]*\)/i, // Command substitution with dangerous commands
    /&&\s*(rm|cat|ls|pwd|whoami|id|wget|curl|nc|netcat|bash|sh|cmd|powershell)/i, // Logical AND with dangerous commands
    /\|\|\s*(rm|cat|ls|pwd|whoami|id|wget|curl|nc|netcat|bash|sh|cmd|powershell)/i, // Logical OR with dangerous commands
  ],

  // LDAP injection patterns - more specific to avoid false positives
  ldapInjection: [
    /\([^)]*\)\s*=\s*[^)]*\)/, // Malformed LDAP filter
    /\\[0-9a-fA-F]{2}.*\\[0-9a-fA-F]{2}/, // Multiple hex encodings (suspicious)
    /\(.*\*.*\*.*\)/, // Multiple wildcards in LDAP filter
  ],

  // NoSQL injection patterns
  noSqlInjection: [
    /\$where/i,
    /\$ne\s*:/i,
    /\$gt\s*:/i,
    /\$lt\s*:/i,
    /\$regex\s*:/i,
    /\$exists\s*:/i,
  ],

  // Suspicious user agents (security scanners)
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
    'openvas',
    'retina',
    'qualys',
    'rapid7',
    'metasploit',
    'havij',
    'sqlninja',
    'pangolin',
    'bsqlbf',
  ],

  // Suspicious file extensions
  suspiciousExtensions: [
    '.php',
    '.asp',
    '.aspx',
    '.jsp',
    '.cgi',
    '.pl',
    '.py',
    '.rb',
    '.sh',
    '.bat',
    '.cmd',
    '.exe',
    '.scr',
    '.pif',
    '.com',
  ],

  // Dangerous protocols
  dangerousProtocols: [
    'javascript:',
    'vbscript:',
    'data:',
    'file:',
    'ftp:',
    'gopher:',
  ],
};

// Helper functions for blacklist-based validation
const validationHelpers = {
  // Check if a string contains any malicious patterns
  containsMaliciousPattern: (input: string, patterns: RegExp[]): boolean => {
    return patterns.some(pattern => pattern.test(input));
  },

  // Check if a string contains suspicious characters that might indicate injection
  containsSuspiciousChars: (input: string): boolean => {
    // Allow most characters, but block clearly malicious ones
    const suspiciousChars = /[<>'"`\\]|javascript:|vbscript:|data:|file:/i;
    return suspiciousChars.test(input);
  },

  // Check if a parameter name is suspicious
  isSuspiciousParamName: (paramName: string): boolean => {
    const suspiciousNames = [
      'cmd',
      'exec',
      'eval',
      'system',
      'shell',
      'passwd',
      'password',
      'admin',
      'root',
      'config',
      'database',
      'db',
      'sql',
      'query',
      'script',
      'file',
      'path',
      'dir',
      'directory',
      'upload',
      'download',
    ];
    // Use word boundaries to avoid false positives (e.g., "description" containing "script")
    return suspiciousNames.some(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      return regex.test(paramName);
    });
  },

  // Check if a value looks like an attempt to break out of context
  looksLikeInjection: (value: string): boolean => {
    // Check for common injection patterns
    const injectionPatterns = [
      /['"]\s*(or|and)\s*['"]?\s*=\s*['"]?/i, // SQL injection
      /<script/i, // XSS
      /javascript:/i, // XSS
      /\.\.\//, // Path traversal
      /[;&|`$()]/, // Command injection
    ];
    return injectionPatterns.some(pattern => pattern.test(value));
  },
};

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Helper function to check if a query parameter value is malicious (blacklist approach)
function isMaliciousQueryValue(key: string, value: string): boolean {
  // Check if parameter name itself is suspicious
  if (validationHelpers.isSuspiciousParamName(key)) {
    return true;
  }

  // Check if value contains malicious patterns
  if (validationHelpers.looksLikeInjection(value)) {
    return true;
  }

  // Check for SQL injection patterns
  if (
    validationHelpers.containsMaliciousPattern(
      value,
      maliciousPatterns.sqlInjection
    )
  ) {
    return true;
  }

  // Check for XSS patterns
  if (
    validationHelpers.containsMaliciousPattern(value, maliciousPatterns.xss)
  ) {
    return true;
  }

  // Check for path traversal patterns
  if (
    validationHelpers.containsMaliciousPattern(
      value,
      maliciousPatterns.pathTraversal
    )
  ) {
    return true;
  }

  // Check for command injection patterns
  if (
    validationHelpers.containsMaliciousPattern(
      value,
      maliciousPatterns.commandInjection
    )
  ) {
    return true;
  }

  // Check for NoSQL injection patterns
  if (
    validationHelpers.containsMaliciousPattern(
      value,
      maliciousPatterns.noSqlInjection
    )
  ) {
    return true;
  }

  // Check for dangerous protocols
  if (
    maliciousPatterns.dangerousProtocols.some(protocol =>
      value.toLowerCase().includes(protocol.toLowerCase())
    )
  ) {
    return true;
  }

  // Check for suspicious file extensions in the value
  if (
    maliciousPatterns.suspiciousExtensions.some(ext =>
      value.toLowerCase().includes(ext.toLowerCase())
    )
  ) {
    return true;
  }

  return false;
}

// Helper function to parse and validate query parameters (blacklist approach)
function validateQueryParameters(searchParams: URLSearchParams): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const [key, value] of searchParams.entries()) {
    // Skip empty values
    if (!value) continue;

    // Check if the parameter value is malicious
    if (isMaliciousQueryValue(key, value)) {
      errors.push(`Malicious query parameter detected: ${key}=${value}`);
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
  if (contentLength > REQUEST_CONSTANTS.MAX_CONTENT_LENGTH.FILE_UPLOAD) {
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
    const isSuspicious = maliciousPatterns.suspiciousUserAgents.some(
      (ua: string) => userAgent.toLowerCase().includes(ua.toLowerCase())
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

  // Check for malicious patterns in the path (blacklist approach)
  const pathOnly = pathname;

  // Check for SQL injection in the path
  if (
    validationHelpers.containsMaliciousPattern(
      pathOnly,
      maliciousPatterns.sqlInjection
    )
  ) {
    errors.push('SQL injection attempt detected in path');
    riskLevel = 'high';
  }

  // Check for XSS in the path
  if (
    validationHelpers.containsMaliciousPattern(pathOnly, maliciousPatterns.xss)
  ) {
    errors.push('XSS attempt detected in path');
    riskLevel = 'high';
  }

  // Check for path traversal
  if (
    validationHelpers.containsMaliciousPattern(
      url,
      maliciousPatterns.pathTraversal
    )
  ) {
    errors.push('Path traversal attempt detected');
    riskLevel = 'high';
  }

  // Check for command injection in the path
  if (
    validationHelpers.containsMaliciousPattern(
      pathOnly,
      maliciousPatterns.commandInjection
    )
  ) {
    errors.push('Command injection attempt detected in path');
    riskLevel = 'high';
  }

  // Check for LDAP injection
  if (
    validationHelpers.containsMaliciousPattern(
      pathOnly,
      maliciousPatterns.ldapInjection
    )
  ) {
    errors.push('LDAP injection attempt detected in path');
    riskLevel = 'high';
  }

  // Check for NoSQL injection
  if (
    validationHelpers.containsMaliciousPattern(
      pathOnly,
      maliciousPatterns.noSqlInjection
    )
  ) {
    errors.push('NoSQL injection attempt detected in path');
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
  // Block obviously malicious origins
  const maliciousOrigins = [
    'javascript:',
    'vbscript:',
    'data:',
    'file:',
    'ftp:',
    'gopher:',
    'about:',
    'chrome:',
    'chrome-extension:',
    'moz-extension:',
  ];

  if (
    maliciousOrigins.some(malicious =>
      origin.toLowerCase().startsWith(malicious)
    )
  ) {
    return false;
  }

  // Allow localhost for development
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    return true;
  }

  // Allow HTTPS origins (more permissive)
  if (origin.startsWith('https://')) {
    return true;
  }

  // Allow HTTP for development (localhost)
  if (origin.startsWith('http://') && origin.includes('localhost')) {
    return true;
  }

  // Block other protocols
  return false;
}

function isValidReferer(referer: string): boolean {
  // Block obviously malicious referers
  const maliciousReferers = [
    'javascript:',
    'vbscript:',
    'data:',
    'file:',
    'ftp:',
    'gopher:',
    'about:',
    'chrome:',
    'chrome-extension:',
    'moz-extension:',
  ];

  if (
    maliciousReferers.some(malicious =>
      referer.toLowerCase().startsWith(malicious)
    )
  ) {
    return false;
  }

  // Allow localhost for development
  if (referer.includes('localhost') || referer.includes('127.0.0.1')) {
    return true;
  }

  // Allow HTTPS referers (more permissive)
  if (referer.startsWith('https://')) {
    return true;
  }

  // Allow HTTP for development (localhost)
  if (referer.startsWith('http://') && referer.includes('localhost')) {
    return true;
  }

  // Block other protocols
  return false;
}

// Validate request body for specific endpoints
export function validateRequestBody(
  body: unknown,
  schema: z.ZodSchema
): ValidationResult {
  try {
    // First check for malicious patterns in the body
    const bodyString = JSON.stringify(body);
    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.sqlInjection
      )
    ) {
      return {
        isValid: false,
        errors: ['SQL injection attempt detected in request body'],
        warnings: [],
        riskLevel: 'high',
      };
    }

    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.xss
      )
    ) {
      return {
        isValid: false,
        errors: ['XSS attempt detected in request body'],
        warnings: [],
        riskLevel: 'high',
      };
    }

    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.commandInjection
      )
    ) {
      return {
        isValid: false,
        errors: ['Command injection attempt detected in request body'],
        warnings: [],
        riskLevel: 'high',
      };
    }

    // Then validate against schema
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
          issue => `${issue.path.join('.')}: ${issue.message}`
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

// New function to validate request body content for malicious patterns (blacklist approach)
export function validateRequestBodyContent(body: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  try {
    const bodyString = JSON.stringify(body);

    // Check for various injection patterns
    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.sqlInjection
      )
    ) {
      errors.push('SQL injection pattern detected in request body');
      riskLevel = 'high';
    }

    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.xss
      )
    ) {
      errors.push('XSS pattern detected in request body');
      riskLevel = 'high';
    }

    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.commandInjection
      )
    ) {
      errors.push('Command injection pattern detected in request body');
      riskLevel = 'high';
    }

    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.pathTraversal
      )
    ) {
      errors.push('Path traversal pattern detected in request body');
      riskLevel = 'high';
    }

    if (
      validationHelpers.containsMaliciousPattern(
        bodyString,
        maliciousPatterns.noSqlInjection
      )
    ) {
      errors.push('NoSQL injection pattern detected in request body');
      riskLevel = 'high';
    }

    // Check for dangerous protocols
    if (
      maliciousPatterns.dangerousProtocols.some(protocol =>
        bodyString.toLowerCase().includes(protocol.toLowerCase())
      )
    ) {
      errors.push('Dangerous protocol detected in request body');
      riskLevel = 'high';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskLevel,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        error instanceof Error
          ? error.message
          : 'Unable to parse request body for validation',
      ],
      warnings: [],
      riskLevel: 'medium',
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
  return SECURITY_CONSTANTS.SECURITY_HEADERS;
}
