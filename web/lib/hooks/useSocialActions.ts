'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ProblemSetStats, UserSocialState } from '@/lib/types';

interface UseSocialActionsProps {
  problemSetId: string;
  initialStats?: ProblemSetStats | null;
  initialSocialState?: UserSocialState | null;
  isAuthenticated: boolean;
  trackView?: boolean;
}

interface UseSocialActionsReturn {
  stats: ProblemSetStats;
  liked: boolean;
  favourited: boolean;
  toggleLike: () => Promise<void>;
  toggleFavourite: () => Promise<void>;
  likeLoading: boolean;
  favouriteLoading: boolean;
}

const defaultStats: ProblemSetStats = {
  view_count: 0,
  unique_view_count: 0,
  like_count: 0,
  copy_count: 0,
  problem_count: 0,
  ranking_score: 0,
};

export function useSocialActions({
  problemSetId,
  initialStats,
  initialSocialState,
  isAuthenticated,
  trackView = false,
}: UseSocialActionsProps): UseSocialActionsReturn {
  const [stats, setStats] = useState<ProblemSetStats>(
    initialStats || defaultStats
  );
  const [liked, setLiked] = useState(initialSocialState?.liked ?? false);
  const [favourited, setFavourited] = useState(
    initialSocialState?.favourited ?? false
  );
  const [likeLoading, setLikeLoading] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);
  const likeInFlight = useRef(false);
  const favouriteInFlight = useRef(false);
  const viewTracked = useRef(false);
  const statsFetched = useRef(false);

  // Fetch stats from API if not provided by server (e.g. limited sets, cache miss)
  useEffect(() => {
    if (initialStats || statsFetched.current) return;
    statsFetched.current = true;

    fetch(`/api/problem-sets/${problemSetId}/stats`)
      .then(res => res.json())
      .then(json => {
        if (json.data?.stats) {
          setStats(json.data.stats);
        }
        if (json.data?.social_state) {
          setLiked(json.data.social_state.liked);
          setFavourited(json.data.social_state.favourited);
        }
      })
      .catch(() => {});
  }, [problemSetId, initialStats]);

  // Track view after 3-second delay
  useEffect(() => {
    if (!trackView || viewTracked.current) return;

    const timer = setTimeout(() => {
      viewTracked.current = true;
      fetch(`/api/problem-sets/${problemSetId}/view`, {
        method: 'POST',
      }).catch(() => {});
    }, 3000);

    return () => clearTimeout(timer);
  }, [problemSetId, trackView]);

  const toggleLike = useCallback(async () => {
    if (!isAuthenticated || likeInFlight.current) return;
    likeInFlight.current = true;

    // Optimistic update (clamp at 0 to handle stale/missing stats)
    const prevLiked = liked;
    const prevCount = stats.like_count;
    setLiked(!liked);
    setStats(prev => ({
      ...prev,
      like_count: liked
        ? Math.max(0, prev.like_count - 1)
        : prev.like_count + 1,
    }));
    setLikeLoading(true);

    try {
      const res = await fetch(`/api/problem-sets/${problemSetId}/like`, {
        method: 'POST',
      });
      const json = await res.json();

      if (res.ok && json.data) {
        setLiked(json.data.liked);
        setStats(prev => ({ ...prev, like_count: json.data.like_count }));
      } else {
        // Rollback
        setLiked(prevLiked);
        setStats(prev => ({ ...prev, like_count: prevCount }));
      }
    } catch {
      // Rollback
      setLiked(prevLiked);
      setStats(prev => ({ ...prev, like_count: prevCount }));
    } finally {
      likeInFlight.current = false;
      setLikeLoading(false);
    }
  }, [problemSetId, liked, stats.like_count, isAuthenticated]);

  const toggleFavourite = useCallback(async () => {
    if (!isAuthenticated || favouriteInFlight.current) return;
    favouriteInFlight.current = true;

    // Optimistic update
    const prevFavourited = favourited;
    setFavourited(!favourited);
    setFavouriteLoading(true);

    try {
      const res = await fetch(`/api/problem-sets/${problemSetId}/favourite`, {
        method: 'POST',
      });
      const json = await res.json();

      if (res.ok && json.data) {
        setFavourited(json.data.favourited);
      } else {
        setFavourited(prevFavourited);
      }
    } catch {
      setFavourited(prevFavourited);
    } finally {
      favouriteInFlight.current = false;
      setFavouriteLoading(false);
    }
  }, [problemSetId, favourited, isAuthenticated]);

  return {
    stats,
    liked,
    favourited,
    toggleLike,
    toggleFavourite,
    likeLoading,
    favouriteLoading,
  };
}
