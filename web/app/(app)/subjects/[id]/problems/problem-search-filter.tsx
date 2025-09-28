'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Search, Filter } from 'lucide-react';
import { ProblemType, PROBLEM_TYPE_VALUES } from '@/lib/schemas';

type Tag = { id: string; name: string };

interface SearchFilters {
  searchText: string;
  searchFields: {
    title: boolean;
    content: boolean;
  };
  problemTypes: ProblemType[];
  tagIds: string[];
}

interface ProblemSearchFilterProps {
  onSearch: (filters: SearchFilters) => void;
  availableTags: Tag[];
  subjectId: string;
}

const getProblemTypeDisplayName = (type: ProblemType): string => {
  switch (type) {
    case 'mcq':
      return 'Multiple Choice';
    case 'short':
      return 'Short Answer';
    case 'extended':
      return 'Extended Response';
    default:
      return type;
  }
};

export default function ProblemSearchFilter({
  onSearch,
  availableTags,
  subjectId,
}: ProblemSearchFilterProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    searchText: '',
    searchFields: {
      title: true,
      content: true,
    },
    problemTypes: [],
    tagIds: [],
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const updateSearchText = (text: string) => {
    setFilters(prev => ({ ...prev, searchText: text }));
  };

  const toggleSearchField = (field: 'title' | 'content') => {
    setFilters(prev => ({
      ...prev,
      searchFields: {
        ...prev.searchFields,
        [field]: !prev.searchFields[field],
      },
    }));
  };

  const toggleProblemType = (type: ProblemType) => {
    setFilters(prev => ({
      ...prev,
      problemTypes: prev.problemTypes.includes(type)
        ? prev.problemTypes.filter(t => t !== type)
        : [...prev.problemTypes, type],
    }));
  };

  const toggleTag = (tagId: string) => {
    setFilters(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId],
    }));
  };

  const clearFilters = () => {
    const clearedFilters = {
      searchText: '',
      searchFields: {
        title: true,
        content: true,
      },
      problemTypes: [],
      tagIds: [],
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters); // Trigger search with cleared filters
  };

  const hasActiveFilters = 
    filters.searchText.trim() !== '' ||
    filters.problemTypes.length > 0 ||
    filters.tagIds.length > 0 ||
    !filters.searchFields.title ||
    !filters.searchFields.content;

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.searchText.trim() !== '') count++;
    if (filters.problemTypes.length > 0) count++;
    if (filters.tagIds.length > 0) count++;
    if (!filters.searchFields.title) count++;
    if (!filters.searchFields.content) count++;
    return count;
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Search & Filter Problems</h3>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {getActiveFilterCount()} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {isExpanded ? 'Hide' : 'Show'} Filters
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="search-text">Search Text</Label>
        <div className="flex gap-2">
          <Input
            id="search-text"
            placeholder="Search problems..."
            value={filters.searchText}
            onChange={(e) => updateSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="flex-1"
          />
          <Button onClick={handleSearch} className="px-6">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button 
            variant="outline" 
            onClick={clearFilters}
            className="px-6"
          >
            Show All
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.searchFields.title}
              onCheckedChange={() => toggleSearchField('title')}
            />
            Search in titles
          </Label>
          <Label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.searchFields.content}
              onCheckedChange={() => toggleSearchField('content')}
            />
            Search in content & solutions
          </Label>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t">
          {/* Problem Types Filter */}
          <div className="space-y-2">
            <Label>Problem Types</Label>
            <div className="flex flex-wrap gap-2">
              {PROBLEM_TYPE_VALUES.map((type) => (
                <Button
                  key={type}
                  variant={filters.problemTypes.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleProblemType(type)}
                  className="text-xs"
                >
                  {getProblemTypeDisplayName(type)}
                </Button>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-2">
            <Label>Tags</Label>
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Button
                    key={tag.id}
                    variant={filters.tagIds.includes(tag.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                    className="text-xs"
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tags available. <a href={`/subjects/${subjectId}/tags`} className="text-primary underline">Create some tags</a> to filter by them.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.searchText.trim() !== '' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: "{filters.searchText}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateSearchText('')}
                />
              </Badge>
            )}
            {filters.problemTypes.map((type) => (
              <Badge key={type} variant="secondary" className="flex items-center gap-1">
                {getProblemTypeDisplayName(type)}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleProblemType(type)}
                />
              </Badge>
            ))}
            {filters.tagIds.map((tagId) => {
              const tag = availableTags.find(t => t.id === tagId);
              return tag ? (
                <Badge key={tagId} variant="secondary" className="flex items-center gap-1">
                  {tag.name}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => toggleTag(tagId)}
                  />
                </Badge>
              ) : null;
            })}
            {!filters.searchFields.title && (
              <Badge variant="secondary" className="flex items-center gap-1">
                No title search
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleSearchField('title')}
                />
              </Badge>
            )}
            {!filters.searchFields.content && (
              <Badge variant="secondary" className="flex items-center gap-1">
                No content & solutions search
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => toggleSearchField('content')}
                />
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
