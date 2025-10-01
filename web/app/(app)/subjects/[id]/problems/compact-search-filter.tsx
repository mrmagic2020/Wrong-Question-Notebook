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
} from 'lucide-react';
import { ProblemType, PROBLEM_TYPE_VALUES } from '@/lib/schemas';
import {
  getProblemTypeDisplayName,
  getStatusDisplayName,
  getColumnDisplayName,
} from '@/lib/display-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { useCallback, useEffect, useRef } from 'react';

type Tag = { id: string; name: string };

interface SearchFilters {
  searchText: string;
  problemTypes: ProblemType[];
  tagIds: string[];
  statuses: string[];
}

interface CompactSearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: Tag[];
  subjectId: string;
  searchText: string;
  onSearchTextChange: (text: string) => void;
  problemTypes: string[];
  onProblemTypesChange: (types: string[]) => void;
  tagIds: string[];
  onTagIdsChange: (tagIds: string[]) => void;
  statuses: string[];
  onStatusesChange: (statuses: string[]) => void;
  // View options props
  table?: any;
  columnVisibilityKey?: number;
  selectedProblemIds?: string[];
  onBulkEditTags?: (problemIds: string[]) => void;
  onBulkDelete?: (problemIds: string[]) => void;
  onBulkEditTagsEnabled?: boolean;
  onBulkDeleteEnabled?: boolean;
  isSearching?: boolean;
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
  onBulkEditTags,
  onBulkDelete,
  onBulkEditTagsEnabled = false,
  onBulkDeleteEnabled = false,
  isSearching = false,
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
    }, 300); // 300ms debounce
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
    // Clear any pending debounced search
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Immediately trigger search to clear filters
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
    { label: getStatusDisplayName('wrong'), value: 'wrong', icon: XCircle },
    {
      label: getStatusDisplayName('needs_review'),
      value: 'needs_review',
      icon: Clock,
    },
    {
      label: getStatusDisplayName('mastered'),
      value: 'mastered',
      icon: CheckCircle,
    },
  ];

  // Convert arrays to Sets for the faceted filter
  const selectedProblemTypes = new Set(problemTypes);
  const selectedTagIds = new Set(tagIds);
  const selectedStatuses = new Set(statuses);

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchText}
              onChange={e => {
                const newValue = e.target.value;
                onSearchTextChange(newValue);

                // If search box is cleared, trigger immediate search
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
                  // Debounced search as user types
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

          {/* Filter Dropdowns */}
          <DataTableFacetedFilter
            title="Type"
            options={problemTypeOptions}
            selectedValues={selectedProblemTypes}
            onSelectedValuesChange={values => {
              const newTypes = Array.from(values);
              onProblemTypesChange(newTypes);
              onSearch({
                searchText,
                problemTypes: newTypes as ProblemType[],
                tagIds,
                statuses,
              });
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
                problemTypes: problemTypes as ProblemType[],
                tagIds: newTagIds,
                statuses,
              });
            }}
          />

          <DataTableFacetedFilter
            title="Status"
            options={statusOptions}
            selectedValues={selectedStatuses}
            onSelectedValuesChange={values => {
              const newStatuses = Array.from(values);
              onStatusesChange(newStatuses);
              onSearch({
                searchText,
                problemTypes: problemTypes as ProblemType[],
                tagIds,
                statuses: newStatuses,
              });
            }}
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk Actions */}
          {selectedProblemIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                {selectedProblemIds.length} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBulkEditTags?.(selectedProblemIds)}
                disabled={!onBulkEditTagsEnabled}
              >
                Edit Tags
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

          {/* View Options */}
          {table && (
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
                  <div className="text-sm font-medium mb-2">Toggle columns</div>
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
          )}
        </div>
      </div>
    </div>
  );
}
