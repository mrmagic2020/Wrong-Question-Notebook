'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DiscoveryCard } from '@/components/discovery-card';
import type { ProblemSetCard } from '@/lib/types';
import { cn } from '@/lib/utils';

type SortOption = 'ranking' | 'newest' | 'most_liked' | 'most_copied';

const SORT_LABELS: Record<SortOption, string> = {
  ranking: 'Trending',
  newest: 'Newest',
  most_liked: 'Most Liked',
  most_copied: 'Most Copied',
};

interface DiscoverPageClientProps {
  initialSets: ProblemSetCard[];
  initialSubjects: { name: string; count: number }[];
}

export default function DiscoverPageClient({
  initialSets,
  initialSubjects,
}: DiscoverPageClientProps) {
  const [sets, setSets] = useState<ProblemSetCard[]>(initialSets);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('ranking');
  const [loading, setLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [updateScrollState, initialSubjects]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch results when filters change
  const fetchSets = useCallback(
    async (cursor?: string | null) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set('q', debouncedSearch);
      if (subject) params.set('subject', subject);
      params.set('sort', sort);
      if (cursor) params.set('cursor', cursor);

      try {
        const res = await fetch(`/api/discover?${params.toString()}`);
        const json = await res.json();

        if (res.ok && json.data) {
          if (cursor) {
            setSets(prev => [...prev, ...json.data.data]);
          } else {
            setSets(json.data.data);
          }
          setNextCursor(json.data.next_cursor);
        }
      } catch (error) {
        console.error('Error fetching discovery data:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [debouncedSearch, subject, sort]
  );

  // Re-fetch when search/filter/sort changes
  useEffect(() => {
    if (!hasSearched && !debouncedSearch && !subject && sort === 'ranking') {
      return; // Use initial server data
    }
    setHasSearched(true);
    fetchSets();
  }, [debouncedSearch, subject, sort, fetchSets, hasSearched]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && nextCursor && !loadingRef.current) {
          fetchSets(nextCursor);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, fetchSets]);

  return (
    <div className="section-container">
      {/* Hero header */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 dark:bg-purple-500/20">
            <Globe className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="heading-lg">Discover</h1>
            <p className="text-body-sm text-muted-foreground">
              Browse problem sets shared by other students
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search problem sets..."
            className="pl-10 rounded-xl"
          />
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3">
          {/* Subject chips — horizontal scroll with conditional fade edges */}
          <div className="relative min-w-0 flex-1">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent transition-opacity"
              style={{ opacity: canScrollLeft ? 1 : 0 }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent transition-opacity"
              style={{ opacity: canScrollRight ? 1 : 0 }}
            />
            <div
              ref={chipsRef}
              onScroll={updateScrollState}
              className="flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide"
            >
              <button
                onClick={() => setSubject(null)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors',
                  !subject
                    ? 'bg-amber-600 text-white dark:bg-amber-500'
                    : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200/80 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                )}
              >
                All
              </button>
              {initialSubjects.map(s => (
                <button
                  key={s.name}
                  onClick={() => setSubject(s.name === subject ? null : s.name)}
                  className={cn(
                    'shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition-colors',
                    s.name === subject
                      ? 'bg-amber-600 text-white dark:bg-amber-500'
                      : 'bg-amber-100/80 text-amber-800 hover:bg-amber-200/80 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                  )}
                >
                  {s.name}
                  <span className="ml-1 opacity-60">({s.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort dropdown — pinned right */}
          <Select value={sort} onValueChange={v => setSort(v as SortOption)}>
            <SelectTrigger className="w-[160px] shrink-0 rounded-xl">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {sets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sets.map(set => (
            <DiscoveryCard key={set.id} set={set} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Globe className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <h3 className="mb-2 text-lg font-medium text-muted-foreground">
            No problem sets found
          </h3>
          <p className="text-sm text-muted-foreground/70">
            {debouncedSearch || subject
              ? 'Try adjusting your search or filters.'
              : 'Be the first to share a problem set!'}
          </p>
        </div>
      )}

      {/* Loading indicator — fixed at bottom center */}
      {loading && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/90 p-3 shadow-lg dark:bg-gray-800/90">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={observerRef} className="h-1" />
    </div>
  );
}
