import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkAndIncrementQuota,
  getQuotaUsage,
  getUserQuotaLimit,
} from '../usage-quota';

// Mock createServiceClient
const mockRpc = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();

vi.mock('../supabase-utils', () => ({
  createServiceClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();

  // Set up chained query builder
  mockFrom.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockImplementation(() => ({
    eq: mockEq,
    maybeSingle: mockMaybeSingle,
  }));
});

// ---------------------------------------------------------------------------
// checkAndIncrementQuota
// ---------------------------------------------------------------------------

describe('checkAndIncrementQuota', () => {
  it('returns allowed result when under quota', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        current_usage: 3,
        daily_limit: 10,
        remaining: 7,
      },
      error: null,
    });

    const result = await checkAndIncrementQuota('user-1');

    expect(result.allowed).toBe(true);
    expect(result.current_usage).toBe(3);
    expect(result.remaining).toBe(7);
    expect(mockRpc).toHaveBeenCalledWith('check_and_increment_quota', {
      p_user_id: 'user-1',
      p_resource_type: 'ai_extraction',
      p_default_limit: 10,
    });
  });

  it('returns denied result when at quota', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: false,
        current_usage: 10,
        daily_limit: 10,
        remaining: 0,
      },
      error: null,
    });

    const result = await checkAndIncrementQuota('user-1');

    expect(result.allowed).toBe(false);
    expect(result.current_usage).toBe(10);
    expect(result.remaining).toBe(0);
  });

  it('returns result with per-user override limit from RPC', async () => {
    mockRpc.mockResolvedValue({
      data: {
        allowed: true,
        current_usage: 12,
        daily_limit: 50,
        remaining: 38,
      },
      error: null,
    });

    const result = await checkAndIncrementQuota('user-1');

    expect(result.daily_limit).toBe(50);
    expect(result.current_usage).toBe(12);
    expect(result.remaining).toBe(38);
  });

  it('throws when RPC fails', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    await expect(checkAndIncrementQuota('user-1')).rejects.toThrow(
      'Failed to check usage quota'
    );
  });
});

// ---------------------------------------------------------------------------
// getUserQuotaLimit
// ---------------------------------------------------------------------------

describe('getUserQuotaLimit', () => {
  it('returns override limit when one exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { daily_limit: 50 },
      error: null,
    });

    const limit = await getUserQuotaLimit('user-1');

    expect(limit).toBe(50);
  });

  it('returns system default when no override exists', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const limit = await getUserQuotaLimit('user-1');

    expect(limit).toBe(10);
  });

  it('throws when query fails', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'DB error' },
    });

    await expect(getUserQuotaLimit('user-1')).rejects.toThrow(
      'Failed to look up quota limit'
    );
  });
});

// ---------------------------------------------------------------------------
// getQuotaUsage
// ---------------------------------------------------------------------------

describe('getQuotaUsage', () => {
  it('returns usage with override limit', async () => {
    // First call: usage_quotas query
    // Second call (via getUserQuotaLimit): user_quota_overrides query
    let callCount = 0;
    mockMaybeSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // usage_quotas result
        return Promise.resolve({ data: { usage_count: 7 }, error: null });
      }
      // user_quota_overrides result
      return Promise.resolve({ data: { daily_limit: 25 }, error: null });
    });

    const result = await getQuotaUsage('user-1');

    expect(result.current_usage).toBe(7);
    expect(result.daily_limit).toBe(25);
    expect(result.remaining).toBe(18);
    expect(result.allowed).toBe(true);
  });

  it('returns zero usage when no row exists with default limit', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await getQuotaUsage('user-1');

    expect(result.current_usage).toBe(0);
    expect(result.daily_limit).toBe(10);
    expect(result.remaining).toBe(10);
    expect(result.allowed).toBe(true);
  });

  it('returns not allowed when at limit', async () => {
    let callCount = 0;
    mockMaybeSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ data: { usage_count: 10 }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    const result = await getQuotaUsage('user-1');

    expect(result.current_usage).toBe(10);
    expect(result.remaining).toBe(0);
    expect(result.allowed).toBe(false);
  });

  it('throws when usage query fails', async () => {
    let callCount = 0;
    mockMaybeSingle.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          data: null,
          error: { message: 'DB error' },
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    await expect(getQuotaUsage('user-1')).rejects.toThrow(
      'Failed to fetch usage quota'
    );
  });
});
