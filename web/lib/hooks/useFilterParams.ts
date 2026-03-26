'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useRef } from 'react';
import {
  ProblemType,
  ProblemStatus,
  PROBLEM_TYPE_VALUES,
  PROBLEM_STATUS_VALUES,
} from '@/lib/schemas';
import { TagFilterMode } from '@/lib/types';

interface FilterState {
  searchText: string;
  problemTypes: ProblemType[];
  tagIds: string[];
  tagFilterMode: TagFilterMode;
  statuses: ProblemStatus[];
}

const PARAM_KEYS = {
  SEARCH: 'q',
  TYPES: 'types',
  TAGS: 'tags',
  TAG_MODE: 'tagMode',
  STATUSES: 'statuses',
} as const;

function parseFilterParams(searchParams: URLSearchParams): FilterState {
  const searchText = searchParams.get(PARAM_KEYS.SEARCH) || '';

  const problemTypes = (
    searchParams.get(PARAM_KEYS.TYPES)?.split(',').filter(Boolean) || []
  ).filter((t): t is ProblemType =>
    PROBLEM_TYPE_VALUES.includes(t as ProblemType)
  );

  const tagIds =
    searchParams.get(PARAM_KEYS.TAGS)?.split(',').filter(Boolean) || [];

  const tagFilterMode =
    searchParams.get(PARAM_KEYS.TAG_MODE) === 'all' ? 'all' : 'any';

  const statuses = (
    searchParams.get(PARAM_KEYS.STATUSES)?.split(',').filter(Boolean) || []
  ).filter((s): s is ProblemStatus =>
    PROBLEM_STATUS_VALUES.includes(s as ProblemStatus)
  );

  return { searchText, problemTypes, tagIds, tagFilterMode, statuses };
}

function buildFilterParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (state.searchText.trim()) {
    params.set(PARAM_KEYS.SEARCH, state.searchText.trim());
  }
  if (state.problemTypes.length > 0) {
    params.set(PARAM_KEYS.TYPES, state.problemTypes.join(','));
  }
  if (state.tagIds.length > 0) {
    params.set(PARAM_KEYS.TAGS, state.tagIds.join(','));
    if (state.tagFilterMode === 'all') {
      params.set(PARAM_KEYS.TAG_MODE, 'all');
    }
  }
  if (state.statuses.length > 0) {
    params.set(PARAM_KEYS.STATUSES, state.statuses.join(','));
  }

  return params;
}

export function useFilterParams() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialState = useRef(parseFilterParams(searchParams));

  const updateUrl = useCallback(
    (state: FilterState) => {
      const params = buildFilterParams(state);
      const query = params.toString();
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url, { scroll: false });
    },
    [router, pathname]
  );

  return {
    initialFilters: initialState.current,
    updateUrl,
  };
}
