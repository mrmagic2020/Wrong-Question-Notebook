import { NextRequest, NextResponse } from 'next/server';
import { createRateLimit, createApiRateLimit, createFileUploadRateLimit, createAuthRateLimit } from './rate-limit';
import { validateRequest, getSecurityHeaders } from './request-validation';
import { validateFileUpload, validateFilePath } from './file-security';

export interface SecurityConfig {
  enableRateLimit?: boolean;
  enableRequestValidation?: boolean;
  enableFileValidation?: boolean;
  rateLimitType?: 'api' | 'fileUpload' | 'auth' | 'custom' | 'readOnly' | 'problemCreation';
  customRateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

export function createSecurityMiddleware(config: SecurityConfig = {}) {
  const {
    enableRateLimit = true,
    enableRequestValidation = true,
    enableFileValidation = false,
    rateLimitType = 'api',
    customRateLimit,
  } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    // 1. Request validation
    if (enableRequestValidation) {
      const validation = validateRequest(req);
      
      if (!validation.isValid) {
        console.warn('Request validation failed:', {
          url: req.url,
          errors: validation.errors,
          warnings: validation.warnings,
          riskLevel: validation.riskLevel,
        });

        // Block high-risk requests
        if (validation.riskLevel === 'high') {
          return new NextResponse(
            JSON.stringify({
              error: 'Request blocked',
              message: 'Suspicious request detected',
              details: validation.errors,
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...getSecurityHeaders(),
              },
            }
          );
        }
      }
    }

    // 2. Rate limiting
    if (enableRateLimit) {
      let rateLimitResponse: NextResponse | null = null;

      if (rateLimitType === 'custom' && customRateLimit) {
        const rateLimit = createRateLimit(customRateLimit);
        rateLimitResponse = rateLimit(req);
      } else {
        switch (rateLimitType) {
          case 'fileUpload':
            rateLimitResponse = createFileUploadRateLimit()(req);
            break;
          case 'auth':
            rateLimitResponse = createAuthRateLimit()(req);
            break;
          case 'readOnly':
            rateLimitResponse = createApiRateLimit()(req); // Use API rate limit for read-only
            break;
          case 'problemCreation':
            rateLimitResponse = createApiRateLimit()(req); // Use API rate limit for problem creation
            break;
          case 'api':
          default:
            rateLimitResponse = createApiRateLimit()(req);
            break;
        }
      }

      if (rateLimitResponse) {
        return rateLimitResponse;
      }
    }

    // 3. File validation (for file upload endpoints only)
    if (enableFileValidation && req.method === 'POST') {
      const contentType = req.headers.get('content-type');
      // Only validate files for actual file upload endpoints, not JSON API endpoints
      if (contentType?.includes('multipart/form-data') && req.nextUrl.pathname.includes('/upload')) {
        try {
          const formData = await req.formData();
          const file = formData.get('file') as File;
          
          if (file) {
            const validation = validateFileUpload(file, {
              maxSize: 5 * 1024 * 1024, // 5MB
              allowedTypes: Object.keys({
                ...require('./file-security').ALLOWED_FILE_TYPES.images,
                ...require('./file-security').ALLOWED_FILE_TYPES.documents,
              }),
            });

            if (!validation.isValid) {
              return new NextResponse(
                JSON.stringify({
                  error: 'File validation failed',
                  message: validation.error,
                }),
                {
                  status: 400,
                  headers: {
                    'Content-Type': 'application/json',
                    ...getSecurityHeaders(),
                  },
                }
              );
            }
          }
        } catch (error) {
          console.error('File validation error:', error);
          return new NextResponse(
            JSON.stringify({
              error: 'File processing failed',
              message: 'Invalid file upload',
            }),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...getSecurityHeaders(),
              },
            }
          );
        }
      }
    }

    // 4. Add security headers to response
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return null; // Allow request to proceed
  };
}

// Pre-configured security middleware for different endpoint types
export const securityMiddleware = {
  // General API endpoints
  api: createSecurityMiddleware({
    enableRateLimit: true,
    enableRequestValidation: true,
    rateLimitType: 'api',
  }),

  // File upload endpoints
  fileUpload: createSecurityMiddleware({
    enableRateLimit: true,
    enableRequestValidation: true,
    enableFileValidation: true,
    rateLimitType: 'fileUpload',
  }),

  // Authentication endpoints
  auth: createSecurityMiddleware({
    enableRateLimit: true,
    enableRequestValidation: true,
    rateLimitType: 'auth',
  }),

  // Read-only endpoints (less restrictive)
  readOnly: createSecurityMiddleware({
    enableRateLimit: true,
    enableRequestValidation: true,
    rateLimitType: 'api',
  }),
};

// Helper function to apply security middleware to API routes
export function withSecurity(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: SecurityConfig = {}
) {
  const middleware = createSecurityMiddleware(config);

  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Apply security middleware
    const securityResponse = await middleware(req);
    if (securityResponse) {
      return securityResponse;
    }

    // Call the original handler
    const response = await handler(req, ...args);

    // Add security headers to the response
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
