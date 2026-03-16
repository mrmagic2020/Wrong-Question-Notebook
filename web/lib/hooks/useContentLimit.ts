'use client';

import { useCallback, useEffect, useState } from 'react';
import { CONTENT_LIMIT_CONSTANTS } from '@/lib/constants';
import type { ContentLimitResult } from '@/lib/content-limits';

const { WARNING_THRESHOLD } = CONTENT_LIMIT_CONSTANTS;

export function useContentLimit(resourceType: string, subjectId?: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContentLimitResult | null>(null);

  const fetchLimit = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subjectId) params.set('subject_id', subjectId);
      const qs = params.toString();
      const url = `/api/usage/${resourceType}${qs ? `?${qs}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch {
      // Fail open — don't block UI on network errors
    } finally {
      setLoading(false);
    }
  }, [resourceType, subjectId]);

  useEffect(() => {
    fetchLimit();
  }, [fetchLimit]);

  const ratio = data && data.limit > 0 ? data.current / data.limit : 0;
  const isWarning = ratio >= WARNING_THRESHOLD && ratio < 1;
  const isExhausted = data ? data.current >= data.limit : false;

  return {
    loading,
    data,
    refresh: fetchLimit,
    isWarning,
    isExhausted,
  };
}
