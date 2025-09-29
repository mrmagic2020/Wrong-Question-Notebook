'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, Plus, Settings, ChevronDown } from 'lucide-react';
import { ProblemType, PROBLEM_TYPE_VALUES } from '@/lib/schemas';
import { getProblemTypeDisplayName, getStatusDisplayName, getColumnDisplayName } from '@/lib/display-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
}: CompactSearchFilterProps) {
  const handleSearch = () => {
    onSearch({
      searchText,
      problemTypes: problemTypes as ProblemType[],
      tagIds,
      statuses,
    });
  };

  const clearFilters = () => {
    onSearchTextChange('');
    onProblemTypesChange([]);
    onTagIdsChange([]);
    onStatusesChange([]);
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

  const toggleProblemType = (type: ProblemType) => {
    const newTypes = problemTypes.includes(type)
      ? problemTypes.filter(t => t !== type)
      : [...problemTypes, type];
    onProblemTypesChange(newTypes);
  };

  const toggleTag = (tagId: string) => {
    const newTagIds = tagIds.includes(tagId)
      ? tagIds.filter(id => id !== tagId)
      : [...tagIds, tagId];
    onTagIdsChange(newTagIds);
  };

  const toggleStatus = (status: string) => {
    const newStatuses = statuses.includes(status)
      ? statuses.filter(s => s !== status)
      : [...statuses, status];
    onStatusesChange(newStatuses);
  };

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
                onSearchTextChange(e.target.value);
                // Auto-search as user types
                handleSearch();
              }}
              className="pl-10"
            />
          </div>

          {/* Filter Dropdowns */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Type
                {problemTypes.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {problemTypes.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {PROBLEM_TYPE_VALUES.map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={problemTypes.includes(type)}
                  onCheckedChange={() => toggleProblemType(type)}
                >
                  {getProblemTypeDisplayName(type)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Tags
                {tagIds.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {tagIds.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {availableTags.length > 0 ? (
                availableTags.map(tag => (
                  <DropdownMenuCheckboxItem
                    key={tag.id}
                    checked={tagIds.includes(tag.id)}
                    onCheckedChange={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </DropdownMenuCheckboxItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">
                  No tags available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Status
                {statuses.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {statuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {['wrong', 'needs_review', 'mastered'].map(status => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statuses.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                >
                  {getStatusDisplayName(status)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <DropdownMenu>
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

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchText.trim() !== '' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{searchText}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onSearchTextChange('')}
              />
            </Badge>
          )}
          {problemTypes.map(type => (
            <Badge
              key={type}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {getProblemTypeDisplayName(type as ProblemType)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleProblemType(type as ProblemType)}
              />
            </Badge>
          ))}
          {tagIds.map(tagId => {
            const tag = availableTags.find(t => t.id === tagId);
            return tag ? (
              <Badge
                key={tagId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {tag.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleTag(tagId)}
                />
              </Badge>
            ) : null;
          })}
          {statuses.map(status => (
            <Badge
              key={status}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {getStatusDisplayName(status)}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleStatus(status)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
