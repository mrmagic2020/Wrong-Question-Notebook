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
import { SearchFilters, SimpleTag } from '@/lib/types';

interface CompactSearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: SimpleTag[];
  searchText: string;
  onSearchTextChange: (text: string) => void;
  problemTypes: ProblemType[];
  onProblemTypesChange: (types: ProblemType[]) => void;
  tagIds: string[];
  onTagIdsChange: (tagIds: string[]) => void;
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = useCallback(
    (customFilters?: Partial<SearchFilters>) => {
      const filters: SearchFilters = {
        searchText: customFilters?.searchText ?? searchText,
        problemTypes: (customFilters?.problemTypes ??
          problemTypes) as ProblemType[],
        tagIds: customFilters?.tagIds ?? tagIds,
        statuses: customFilters?.statuses ?? statuses,
      };
      onSearch(filters);
    },
    [onSearch, searchText, problemTypes, tagIds, statuses]
  );

  // Debounced search for text input
  const debouncedSearch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 300);
  }, [handleSearch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const clearFilters = () => {
    onSearchTextChange('');
    onProblemTypesChange([]);
    onTagIdsChange([]);
    onStatusesChange([]);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    onSearch({
      searchText: '',
      problemTypes: [],
      tagIds: [],
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
    label: getProblemTypeDisplayName(type),
    value: type,
  }));

  const tagOptions = availableTags.map(tag => ({
    label: tag.name,
    value: tag.id,
  }));

  const statusOptions = [
    {
      label: getProblemStatusDisplayName('wrong'),
      value: 'wrong',
      icon: XCircle,
    },
    {
      label: getProblemStatusDisplayName('needs_review'),
      value: 'needs_review',
      icon: Clock,
    },
    {
      label: getProblemStatusDisplayName('mastered'),
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
        title="Type"
        options={problemTypeOptions}
        selectedValues={selectedProblemTypes}
        onSelectedValuesChange={values => {
          const newTypes = Array.from(values) as ProblemType[];
          onProblemTypesChange(newTypes);
          onSearch({ searchText, problemTypes: newTypes, tagIds, statuses });
        }}
      />
      <DataTableFacetedFilter
        title="Tags"
        options={tagOptions}
        selectedValues={selectedTagIds}
        onSelectedValuesChange={values => {
          const newTagIds = Array.from(values);
          onTagIdsChange(newTagIds);
          onSearch({
            searchText,
            problemTypes,
            tagIds: newTagIds,
            statuses,
          });
        }}
      />
      {!hideStatusFilter && (
        <DataTableFacetedFilter
          title="Status"
          options={statusOptions}
          selectedValues={selectedStatuses}
          onSelectedValuesChange={values => {
            const newStatuses = Array.from(values) as ProblemStatus[];
            onStatusesChange(newStatuses);
            onSearch({
              searchText,
              problemTypes,
              tagIds,
              statuses: newStatuses,
            });
          }}
        />
      )}
    </>
  );

  return (
    <div className="space-y-3">
      {/* Main layout */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search + filters */}
        <div className="flex items-center gap-2 flex-1">
          {/* Search input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchText}
              onChange={e => {
                const newValue = e.target.value;
                onSearchTextChange(newValue);

                if (newValue === '') {
                  if (debounceTimeoutRef.current) {
                    clearTimeout(debounceTimeoutRef.current);
                  }
                  handleSearch({
                    searchText: '',
                    problemTypes: problemTypes as ProblemType[],
                    tagIds,
                    statuses,
                  });
                } else {
                  debouncedSearch();
                }
              }}
              className="pl-10"
              disabled={isSearching}
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="w-4 h-4 border border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Desktop filter dropdowns */}
          <div className="hidden md:flex items-center gap-2">
            {filterElements}
          </div>

          {/* Mobile filters popover */}
          <div className="md:hidden">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only ml-1">Filters</span>
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
                {isAddToSetMode ? 'Add to Set' : 'Create Set'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkDelete?.(selectedProblemIds)}
                disabled={!onBulkDeleteEnabled}
                className="text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </div>
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}

          {/* View Options — hidden on mobile */}
          {table && (
            <div className="hidden md:block">
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    View
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <div className="p-2">
                    <div className="text-sm font-medium mb-2">
                      Toggle columns
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
                            {getColumnDisplayName(column.id)}
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
