// Security configuration for the Wrong Question Notebook application

export const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimits: {
    // General API endpoints
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per 15 minutes
    },

    // File upload endpoints (more restrictive)
    fileUpload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 uploads per hour
    },

    // Authentication endpoints (very restrictive)
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 auth attempts per 15 minutes
    },

    // Problem creation (moderate)
    problemCreation: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 50, // 50 problems per hour
    },

    // Read-only endpoints (less restrictive)
    readOnly: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 200, // 200 requests per 5 minutes
    },
  },

  // File upload security
  fileUpload: {
    // Allowed file types
    allowedTypes: {
      images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      documents: ['application/pdf'],
    },

    // Maximum file sizes (in bytes)
    maxSizes: {
      image: 5 * 1024 * 1024, // 5MB
      document: 10 * 1024 * 1024, // 10MB
    },

    // Allowed file extensions
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'],

    // Security headers for file responses
    securityHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
    },
  },

  // Request validation
  requestValidation: {
    // Maximum request size (in bytes)
    maxRequestSize: 50 * 1024 * 1024, // 50MB

    // Maximum JSON body size (in bytes)
    maxJsonBodySize: 1024 * 1024, // 1MB

    // Required headers
    requiredHeaders: ['user-agent'],

    // Suspicious patterns to block
    suspiciousPatterns: {
      sqlInjection:
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      xss: /<script|javascript:|on\w+\s*=/i,
      pathTraversal: /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i,
      commandInjection: /[;&|`$()]/,
    },

    // Suspicious user agents
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
      'scanner',
      'bot',
    ],
  },

  // CORS configuration
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'https://localhost:3000',
      'https://your-domain.vercel.app',
      'https://wrong-question-notebook.vercel.app',
    ],

    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-User-ID',
    ],

    credentials: true,
  },

  // Security headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co",
    ].join('; '),
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },

  // Monitoring and alerting
  monitoring: {
    // Usage thresholds (percentage)
    warningThreshold: 80, // Warn at 80% of limits
    criticalThreshold: 95, // Critical at 95% of limits

    // Rate limit violation thresholds
    rateLimitViolations: {
      warning: 10, // Warn after 10 violations per hour
      critical: 50, // Critical after 50 violations per hour
    },

    // Security event thresholds
    securityEvents: {
      suspiciousRequests: 5, // Alert after 5 suspicious requests per hour
      blockedRequests: 20, // Alert after 20 blocked requests per hour
    },
  },

  // Free tier limits (for monitoring)
  freeTierLimits: {
    vercel: {
      bandwidth: 100 * 1024 * 1024 * 1024, // 100GB
      requests: 1000000, // 1M requests
      functions: 100 * 1024 * 1024 * 1024, // 100GB-hours
    },
    supabase: {
      database: 500 * 1024 * 1024, // 500MB
      bandwidth: 2 * 1024 * 1024 * 1024, // 2GB
      requests: 50000, // 50K requests
      storage: 1024 * 1024 * 1024, // 1GB
    },
  },
} as const;

// Helper functions
export function isAllowedOrigin(origin: string): boolean {
  return (SECURITY_CONFIG.cors.allowedOrigins as readonly string[]).includes(
    origin
  );
}

export function isSuspiciousUserAgent(userAgent: string): boolean {
  return SECURITY_CONFIG.requestValidation.suspiciousUserAgents.some(ua =>
    userAgent.toLowerCase().includes(ua.toLowerCase())
  );
}

export function isSuspiciousRequest(url: string): boolean {
  const patterns = SECURITY_CONFIG.requestValidation.suspiciousPatterns;
  return Object.values(patterns).some(pattern => pattern.test(url));
}

export function getSecurityHeaders(): Record<string, string> {
  return { ...SECURITY_CONFIG.securityHeaders };
}

export function getFileSecurityHeaders(
  filename: string
): Record<string, string> {
  const headers: Record<string, string> = {
    ...SECURITY_CONFIG.fileUpload.securityHeaders,
  };
  headers['Content-Disposition'] = `inline; filename="${filename}"`;
  return headers;
}
