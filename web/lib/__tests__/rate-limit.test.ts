import { NextRequest } from 'next/server';
import {
  createRateLimit,
  getUserKey,
  createApiRateLimit,
  createFileUploadRateLimit,
  createAuthRateLimit,
  createProblemCreationRateLimit,
  _resetRateLimitStore,
} from '../rate-limit';
import { RATE_LIMIT_CONSTANTS } from '../constants';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockRequest({
  ip = '127.0.0.1',
  cookies = {} as Record<string, string>,
} = {}): NextRequest {
  const req = new NextRequest('http://localhost/api/test', {
    headers: { 'x-forwarded-for': ip },
  });
  for (const [name, value] of Object.entries(cookies)) {
    req.cookies.set(name, value);
  }
  return req;
}

/** Builds a fake JWT with the given payload (no signature verification needed). */
function createFakeJwt(payload: Record<string, unknown>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString(
    'base64url'
  );
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.fakesig`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  _resetRateLimitStore();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ── createRateLimit ────────────────────────────────────────────────────────

describe('createRateLimit', () => {
  const config = { windowMs: 60_000, maxRequests: 3 };

  it('allows requests within the limit', () => {
    const limiter = createRateLimit(config);
    const req = createMockRequest();

    expect(limiter(req)).toBeNull();
    expect(limiter(req)).toBeNull();
    expect(limiter(req)).toBeNull();
  });

  it('blocks the request that exceeds the limit with a 429 response', () => {
    const limiter = createRateLimit(config);
    const req = createMockRequest();

    // Exhaust the limit
    for (let i = 0; i < config.maxRequests; i++) limiter(req);

    const response = limiter(req);
    expect(response).not.toBeNull();
    expect(response!.status).toBe(429);
    expect(response!.headers.get('X-RateLimit-Limit')).toBe('3');
    expect(response!.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response!.headers.get('Retry-After')).toBeTruthy();
  });

  it('resets the counter after the window expires', () => {
    const limiter = createRateLimit(config);
    const req = createMockRequest();

    // Exhaust the limit
    for (let i = 0; i < config.maxRequests; i++) limiter(req);
    expect(limiter(req)).not.toBeNull(); // blocked

    // Advance past the window
    vi.advanceTimersByTime(config.windowMs + 1);

    // Should be allowed again
    expect(limiter(req)).toBeNull();
  });

  it('does not reset the counter before the window expires', () => {
    const limiter = createRateLimit(config);
    const req = createMockRequest();

    for (let i = 0; i < config.maxRequests; i++) limiter(req);

    // Advance to just before window end
    vi.advanceTimersByTime(config.windowMs - 1);
    expect(limiter(req)).not.toBeNull(); // still blocked
  });

  it('tracks limits independently per key', () => {
    const limiter = createRateLimit(config);
    const reqA = createMockRequest({ ip: '1.1.1.1' });
    const reqB = createMockRequest({ ip: '2.2.2.2' });

    // Exhaust limit for A
    for (let i = 0; i < config.maxRequests; i++) limiter(reqA);
    expect(limiter(reqA)).not.toBeNull(); // A is blocked

    // B should still be allowed
    expect(limiter(reqB)).toBeNull();
  });

  it('uses a custom keyGenerator when provided', () => {
    const limiter = createRateLimit({
      ...config,
      keyGenerator: () => 'shared-bucket',
    });

    const reqA = createMockRequest({ ip: '1.1.1.1' });
    const reqB = createMockRequest({ ip: '2.2.2.2' });

    // Different IPs share the same bucket
    for (let i = 0; i < config.maxRequests; i++) limiter(reqA);
    expect(limiter(reqB)).not.toBeNull(); // B is also blocked
  });
});

// ── getUserKey ─────────────────────────────────────────────────────────────

describe('getUserKey', () => {
  const REF = 'testproject';
  const SUPABASE_URL = `https://${REF}.supabase.co`;
  const COOKIE_NAME = `sb-${REF}-auth-token`;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = SUPABASE_URL;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it('returns user key from a valid JWT cookie', () => {
    const jwt = createFakeJwt({ sub: 'user-123' });
    const req = createMockRequest({ cookies: { [COOKIE_NAME]: jwt } });

    expect(getUserKey(req)).toBe('rate_limit:user:user-123');
  });

  it('handles chunked cookies (.0, .1)', () => {
    const jwt = createFakeJwt({ sub: 'user-456' });
    const mid = Math.floor(jwt.length / 2);
    const chunk0 = jwt.slice(0, mid);
    const chunk1 = jwt.slice(mid);

    const req = createMockRequest({
      cookies: {
        [`${COOKIE_NAME}.0`]: chunk0,
        [`${COOKIE_NAME}.1`]: chunk1,
      },
    });

    expect(getUserKey(req)).toBe('rate_limit:user:user-456');
  });

  it('falls back to IP key when no cookie is present', () => {
    const req = createMockRequest({ ip: '10.0.0.1' });
    expect(getUserKey(req)).toBe('rate_limit:ip:10.0.0.1');
  });

  it('falls back to IP key when env var is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const jwt = createFakeJwt({ sub: 'user-789' });
    const req = createMockRequest({ cookies: { [COOKIE_NAME]: jwt } });

    expect(getUserKey(req)).toBe('rate_limit:ip:127.0.0.1');
  });

  it('falls back to IP key when JWT has no sub field', () => {
    const jwt = createFakeJwt({ role: 'anon' });
    const req = createMockRequest({ cookies: { [COOKIE_NAME]: jwt } });

    expect(getUserKey(req)).toBe('rate_limit:ip:127.0.0.1');
  });

  it('falls back to IP key for a malformed JWT', () => {
    const req = createMockRequest({
      cookies: { [COOKIE_NAME]: 'not-a-jwt' },
    });

    expect(getUserKey(req)).toBe('rate_limit:ip:127.0.0.1');
  });

  it('falls back to "unknown" when no x-forwarded-for header', () => {
    const req = new NextRequest('http://localhost/api/test');
    expect(getUserKey(req)).toBe('rate_limit:ip:unknown');
  });
});

// ── Pre-configured rate limit factories ────────────────────────────────────

describe('pre-configured rate limit factories', () => {
  function exhaustAndVerifyLimit(
    factory: (kg?: (req: NextRequest) => string) => (req: NextRequest) => any,
    expectedMax: number
  ) {
    const limiter = factory();
    const req = createMockRequest();

    for (let i = 0; i < expectedMax; i++) {
      expect(limiter(req)).toBeNull();
    }

    const blocked = limiter(req);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get('X-RateLimit-Limit')).toBe(
      expectedMax.toString()
    );
  }

  it('createApiRateLimit enforces the configured limit', () => {
    exhaustAndVerifyLimit(
      createApiRateLimit,
      RATE_LIMIT_CONSTANTS.CONFIGURATIONS.api.maxRequests
    );
  });

  it('createFileUploadRateLimit enforces the configured limit', () => {
    exhaustAndVerifyLimit(
      createFileUploadRateLimit,
      RATE_LIMIT_CONSTANTS.CONFIGURATIONS.fileUpload.maxRequests
    );
  });

  it('createAuthRateLimit enforces the configured limit', () => {
    const limiter = createAuthRateLimit();
    const req = createMockRequest();
    const max = RATE_LIMIT_CONSTANTS.CONFIGURATIONS.auth.maxRequests;

    for (let i = 0; i < max; i++) {
      expect(limiter(req)).toBeNull();
    }

    const blocked = limiter(req);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get('X-RateLimit-Limit')).toBe(max.toString());
  });

  it('createProblemCreationRateLimit enforces the configured limit', () => {
    exhaustAndVerifyLimit(
      createProblemCreationRateLimit,
      RATE_LIMIT_CONSTANTS.CONFIGURATIONS.problemCreation.maxRequests
    );
  });

  it('factories accept a custom keyGenerator', () => {
    const limiter = createApiRateLimit(() => 'custom-key');
    const reqA = createMockRequest({ ip: '1.1.1.1' });
    const reqB = createMockRequest({ ip: '2.2.2.2' });

    const max = RATE_LIMIT_CONSTANTS.CONFIGURATIONS.api.maxRequests;
    for (let i = 0; i < max; i++) limiter(reqA);

    // Different IP but same custom key → blocked
    expect(limiter(reqB)).not.toBeNull();
  });
});
