import { NextRequest } from 'next/server';

interface UsageMetrics {
  requests: number;
  bandwidth: number; // in bytes
  storage: number; // in bytes
  lastUpdated: number;
}

// In-memory store for usage tracking (in production, use Redis or database)
const usageStore = new Map<string, UsageMetrics>();

// Free tier limits
export const FREE_TIER_LIMITS = {
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
} as const;

export function trackUsage(
  userId: string,
  request: NextRequest,
  responseSize: number = 0
): void {
  const now = Date.now();
  const key = `user:${userId}`;
  
  // Get or create usage metrics
  let metrics = usageStore.get(key);
  if (!metrics) {
    metrics = {
      requests: 0,
      bandwidth: 0,
      storage: 0,
      lastUpdated: now,
    };
    usageStore.set(key, metrics);
  }

  // Update metrics
  metrics.requests++;
  metrics.bandwidth += responseSize;
  metrics.lastUpdated = now;

  // Clean up old entries (older than 24 hours)
  if (now - metrics.lastUpdated > 24 * 60 * 60 * 1000) {
    usageStore.delete(key);
  }
}

export function getUsageMetrics(userId: string): UsageMetrics | null {
  return usageStore.get(`user:${userId}`) || null;
}

export function checkUsageLimits(userId: string): {
  withinLimits: boolean;
  warnings: string[];
  critical: string[];
} {
  const metrics = getUsageMetrics(userId);
  if (!metrics) {
    return { withinLimits: true, warnings: [], critical: [] };
  }

  const warnings: string[] = [];
  const critical: string[] = [];

  // Check Vercel limits
  if (metrics.bandwidth > FREE_TIER_LIMITS.vercel.bandwidth * 0.8) {
    warnings.push('Approaching Vercel bandwidth limit');
  }
  if (metrics.bandwidth > FREE_TIER_LIMITS.vercel.bandwidth) {
    critical.push('Exceeded Vercel bandwidth limit');
  }

  if (metrics.requests > FREE_TIER_LIMITS.vercel.requests * 0.8) {
    warnings.push('Approaching Vercel request limit');
  }
  if (metrics.requests > FREE_TIER_LIMITS.vercel.requests) {
    critical.push('Exceeded Vercel request limit');
  }

  // Check Supabase limits
  if (metrics.storage > FREE_TIER_LIMITS.supabase.storage * 0.8) {
    warnings.push('Approaching Supabase storage limit');
  }
  if (metrics.storage > FREE_TIER_LIMITS.supabase.storage) {
    critical.push('Exceeded Supabase storage limit');
  }

  return {
    withinLimits: critical.length === 0,
    warnings,
    critical,
  };
}

export function getUsagePercentage(userId: string): {
  vercel: {
    bandwidth: number;
    requests: number;
  };
  supabase: {
    storage: number;
    requests: number;
  };
} {
  const metrics = getUsageMetrics(userId);
  if (!metrics) {
    return {
      vercel: { bandwidth: 0, requests: 0 },
      supabase: { storage: 0, requests: 0 },
    };
  }

  return {
    vercel: {
      bandwidth: (metrics.bandwidth / FREE_TIER_LIMITS.vercel.bandwidth) * 100,
      requests: (metrics.requests / FREE_TIER_LIMITS.vercel.requests) * 100,
    },
    supabase: {
      storage: (metrics.storage / FREE_TIER_LIMITS.supabase.storage) * 100,
      requests: (metrics.requests / FREE_TIER_LIMITS.supabase.requests) * 100,
    },
  };
}

// Clean up old usage data
setInterval(() => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  for (const [key, metrics] of usageStore.entries()) {
    if (metrics.lastUpdated < oneDayAgo) {
      usageStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Usage monitoring middleware
export function withUsageMonitoring(
  handler: (req: NextRequest, ...args: any[]) => Promise<Response>
) {
  return async (req: NextRequest, ...args: any[]): Promise<Response> => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req, ...args);
      
      // Track usage
      const userId = req.headers.get('x-user-id') || 'anonymous';
      const responseSize = parseInt(response.headers.get('content-length') || '0');
      trackUsage(userId, req, responseSize);
      
      // Add usage headers
      const usage = getUsagePercentage(userId);
      response.headers.set('X-Usage-Vercel-Bandwidth', usage.vercel.bandwidth.toFixed(2));
      response.headers.set('X-Usage-Vercel-Requests', usage.vercel.requests.toFixed(2));
      response.headers.set('X-Usage-Supabase-Storage', usage.supabase.storage.toFixed(2));
      response.headers.set('X-Usage-Supabase-Requests', usage.supabase.requests.toFixed(2));
      
      return response;
    } catch (error) {
      console.error('Usage monitoring error:', error);
      throw error;
    }
  };
}
