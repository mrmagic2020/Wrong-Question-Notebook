'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Search,
  Settings,
  ChevronDown,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  SlidersHorizontal,
  CheckSquare,
} from 'lucide-react';
import { ProblemType, PROBLEM_TYPE_VALUES, ProblemStatus } from '@/lib/schemas';
import {
  getProblemTypeDisplayName,
  getProblemStatusDisplayName,
  getColumnDisplayName,
} from '@/lib/common-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCallback, useEffect, useRef } from 'react';
import { useLatestRef } from '@/lib/hooks/use-latest-ref';
import { Kbd } from '@/components/ui/kbd';
import { SearchFilters, SimpleTag, TagFilterMode } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface CompactSearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: SimpleTag[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  problemTypes: ProblemType[];
  onProblemTypesChange: (types: ProblemType[]) => void;
  tagIds: string[];
  onTagIdsChange: (tagIds: string[]) => void;
  tagFilterMode: TagFilterMode;
  onTagFilterModeChange: (mode: TagFilterMode) => void;
  statuses: ProblemStatus[];
  onStatusesChange: (statuses: ProblemStatus[]) => void;
  // View options props
  table?: any;
  columnVisibilityKey?: number;
  selectedProblemIds?: string[];
  onBulkDelete?: (problemIds: string[]) => void;
  onBulkDeleteEnabled?: boolean;
  onCreateSet?: (problemIds: string[]) => void;
  isSearching?: boolean;
  isAddToSetMode?: boolean;
  // Mobile select mode
  isSelectMode?: boolean;
  onSelectModeChange?: (mode: boolean) => void;
  // Hide status filter (for non-owner problem set views)
  hideStatusFilter?: boolean;
}

export default function CompactSearchFilter({
  onSearch,
  availableTags,
  searchText,
  onSearchTextChange,
  problemTypes,
  onProblemTypesChange,
  tagIds,
  onTagIdsChange,
  tagFilterMode,
  onTagFilterModeChange,
  statuses,
  onStatusesChange,
  table,
  columnVisibilityKey = 0,
  selectedProblemIds = [],
  onBulkDelete,
  onBulkDeleteEnabled = false,
  onCreateSet,
  isSearching = false,
  isAddToSetMode = false,
  isSelectMode = false,
  onSelectModeChange,
  hideStatusFilter = false,
}: CompactSearchFilterProps) {
  const t = useTranslations('CommonUtils');
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep refs to latest values so debounced callbacks never go stale
  const searchTextRef = useLatestRef(searchText);
  const filtersRef = useLatestRef({
    problemTypes,
    tagIds,
    tagFilterMode,
    statuses,
  });
  const onSearchRef = useLatestRef(onSearch);

  // Stable search trigger — always reads from refs
  const triggerSearch = useCallback(
    (overrides?: Partial<SearchFilters>) => {
      const current = filtersRef.current;
      onSearchRef.current({
        searchText: overrides?.searchText ?? searchTextRef.current,
        problemTypes: (overrides?.problemTypes ??
          current.problemTypes) as ProblemType[],
        tagIds: overrides?.tagIds ?? current.tagIds,
        tagFilterMode: overrides?.tagFilterMode ?? current.tagFilterMode,
        statuses: overrides?.statuses ?? current.statuses,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const cancelDebounce = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = undefined;
    }
  }, []);

  // Stable debounced search — always fires with latest values
  const debouncedSearch = useCallback(() => {
    cancelDebounce();
    debounceTimeoutRef.current = setTimeout(() => {
      triggerSearch();
    }, 500);
  }, [triggerSearch, cancelDebounce]);

  // Cleanup timeout on unmount
  useEffect(() => cancelDebounce, [cancelDebounce]);

  // Only refocus after search if the input was focused when the search started
  const searchFromInputRef = useRef(false);
  const prevIsSearchingRef = useRef(isSearching);
  useEffect(() => {
    if (prevIsSearchingRef.current && !isSearching) {
      if (searchFromInputRef.current) {
        inputRef.current?.focus();
      }
      searchFromInputRef.current = false;
    }
    prevIsSearchingRef.current = isSearching;
  }, [isSearching]);

  // "/" hotkey to focus search bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearFilters = () => {
    onSearchTextChange('');
    onProblemTypesChange([]);
    onTagIdsChange([]);
    onTagFilterModeChange('any');
    onStatusesChange([]);
    cancelDebounce();
    onSearch({
      searchText: '',
      problemTypes: [],
      tagIds: [],
      tagFilterMode: 'any',
      statuses: [],
    });
  };

  const hasActiveFilters =
    searchText.trim() !== '' ||
    problemTypes.length > 0 ||
    tagIds.length > 0 ||
    statuses.length > 0;

  const activeFilterCount =
    (problemTypes.length > 0 ? 1 : 0) +
    (tagIds.length > 0 ? 1 : 0) +
    (statuses.length > 0 ? 1 : 0);

  // Create options for faceted filters
  const problemTypeOptions = PROBLEM_TYPE_VALUES.map(type => ({
    label: t(getProblemTypeDisplayName(type)),
    value: type,
  }));

  const tagOptions = availableTags.map(tag => ({
    label: tag.name,
    value: tag.id,
  }));

  const statusOptions = [
    {
      label: t(getProblemStatusDisplayName('wrong')),
      value: 'wrong',
      icon: XCircle,
    },
    {
      label: t(getProblemStatusDisplayName('needs_review')),
      value: 'needs_review',
      icon: Clock,
    },
    {
      label: t(getProblemStatusDisplayName('mastered')),
      value: 'mastered',
      icon: CheckCircle,
    },
  ];

  // Convert arrays to Sets for the faceted filter
  const selectedProblemTypes = new Set(problemTypes);
  const selectedTagIds = new Set(tagIds);
  const selectedStatuses = new Set(statuses);

  const filterElements = (
    <>
      <DataTableFacetedFilter
        title={t('type')}
        options={problemTypeOptions}
        selectedValues={selectedProblemTypes}
        onSelectedValuesChange={values => {
          const newTypes = Array.from(values) as ProblemType[];
          onProblemTypesChange(newTypes);
          cancelDebounce();
          triggerSearch({ problemTypes: newTypes });
        }}
      />
      <DataTableFacetedFilter
        title={t('tags')}
        options={tagOptions}
        selectedValues={selectedTagIds}
        onSelectedValuesChange={values => {
          const newTagIds = Array.from(values);
          onTagIdsChange(newTagIds);
          cancelDebounce();
          triggerSearch({ tagIds: newTagIds });
        }}
      >
        {tagIds.length > 1 && (
          <div className="flex items-center justify-between border-t px-2 py-1.5">
            <span className="text-xs text-muted-foreground">{t('match')}</span>
            <div className="inline-flex rounded-full bg-muted p-0.5">
              {(['any', 'all'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={tagFilterMode === mode}
                  onClick={() => {
                    onTagFilterModeChange(mode);
                    cancelDebounce();
                    triggerSearch({ tagFilterMode: mode });
                  }}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    tagFilterMode === mode
                      ? 'bg-white text-foreground shadow-sm dark:bg-gray-700'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode === 'any' ? t('any') : t('all')}
                </button>
              ))}
            </div>
          </div>
        )}
      </DataTableFacetedFilter>
      {!hideStatusFilter && (
        <DataTableFacetedFilter
          title={t('status')}
          options={statusOptions}
          selectedValues={selectedStatuses}
          onSelectedValuesChange={values => {
            const newStatuses = Array.from(values) as ProblemStatus[];
            onStatusesChange(newStatuses);
            cancelDebounce();
            triggerSearch({ statuses: newStatuses });
          }}
        />
      )}
    </>
  );

  return (
    <div>
      {/* Search bar + filters + actions — single row */}
      <div className="flex items-center gap-2">
        {/* Search input */}
        <div className="relative min-w-0 flex-1 md:flex-none md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={t('searchPlaceholder')}
            value={searchText}
            onChange={e => {
              const newValue = e.target.value;
              onSearchTextChange(newValue);
              searchFromInputRef.current = true;

              if (newValue === '') {
                cancelDebounce();
                triggerSearch({ searchText: '' });
              } else {
                debouncedSearch();
              }
            }}
            className="pl-10 pr-10"
            disabled={isSearching}
          />
          {isSearching ? (
            <div className="absolute right-3 top-2.5">
              <div className="w-4 h-4 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            </div>
          ) : (
            !searchText && (
              <div className="absolute right-3 inset-y-0 my-auto hidden md:flex items-center">
                <Kbd>/</Kbd>
              </div>
            )
          )}
        </div>

        {/* Mobile filters popover */}
        <div className="md:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only md:not-sr-only ml-1">{t('filters')}</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 space-y-3" align="end">
              {filterElements}
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile select mode toggle */}
        {onSelectModeChange && (
          <div className="md:hidden">
            <Button
              variant={isSelectMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectModeChange(!isSelectMode)}
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Desktop filters — inline with search bar, scrolls when overflowing */}
        <div className="hidden md:flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {filterElements}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              {t('clear')}
            </Button>
          )}
        </div>

        {/* Right side: bulk actions, clear, view */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bulk Actions */}
          {selectedProblemIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedProblemIds.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateSet?.(selectedProblemIds)}
                className="text-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 mr-1" />
                {isAddToSetMode ? t('addToSet') : t('createSet')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete?.(selectedProblemIds)}
                disabled={!onBulkDeleteEnabled}
                className="text-destructive hover:bg-destructive/10"
              >
                {t('delete')}
              </Button>
            </div>
          )}

          {hasActiveFilters && (
            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {t('clear')}
              </Button>
            </div>
          )}

          {/* View Options — hidden on mobile */}
          {table && (
            <div className="hidden md:block">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    {t('view')}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2">
                    <div className="text-sm font-medium mb-2">
                      {t('toggleColumns')}
                    </div>
                    {table
                      .getAllColumns()
                      .filter((column: any) => column.getCanHide())
                      .map((column: any) => {
                        return (
                          <DropdownMenuCheckboxItem
                            key={`${column.id}-${columnVisibilityKey}`}
                            className="capitalize"
                            checked={column.getIsVisible()}
                            onCheckedChange={value =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {t(getColumnDisplayName(column.id))}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
