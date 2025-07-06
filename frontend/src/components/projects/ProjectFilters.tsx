'use client'

import React from 'react'
import { Search, Filter, Grid, List } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Project } from '@/types/project'

interface ProjectFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilters: Project['status'][]
  onStatusFiltersChange: (statuses: Project['status'][]) => void
  writingModeFilters: Project['writingMode'][]
  onWritingModeFiltersChange: (modes: Project['writingMode'][]) => void
  sortBy: 'title' | 'updatedAt' | 'createdAt' | 'wordCount'
  onSortChange: (sort: 'title' | 'updatedAt' | 'createdAt' | 'wordCount') => void
  sortOrder: 'asc' | 'desc'
  onSortOrderChange: (order: 'asc' | 'desc') => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  totalCount: number
  filteredCount: number
}

const statusOptions: { value: Project['status']; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
]

const writingModeOptions: { value: Project['writingMode']; label: string }[] = [
  { value: 'professional-writer', label: 'Professional Writer' },
  { value: 'ai-first', label: 'AI-First' },
  { value: 'editor', label: 'Editor' },
  { value: 'hobbyist', label: 'Hobbyist' },
]

const sortOptions = [
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'title', label: 'Title' },
  { value: 'wordCount', label: 'Word Count' },
]

export function ProjectFilters({
  searchQuery,
  onSearchChange,
  statusFilters,
  onStatusFiltersChange,
  writingModeFilters,
  onWritingModeFiltersChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
}: ProjectFiltersProps) {
  const activeFiltersCount = statusFilters.length + writingModeFilters.length

  const handleStatusToggle = (status: Project['status']) => {
    if (statusFilters.includes(status)) {
      onStatusFiltersChange(statusFilters.filter(s => s !== status))
    } else {
      onStatusFiltersChange([...statusFilters, status])
    }
  }

  const handleWritingModeToggle = (mode: Project['writingMode']) => {
    if (writingModeFilters.includes(mode)) {
      onWritingModeFiltersChange(writingModeFilters.filter(m => m !== mode))
    } else {
      onWritingModeFiltersChange([...writingModeFilters, mode])
    }
  }

  const clearAllFilters = () => {
    onStatusFiltersChange([])
    onWritingModeFiltersChange([])
    onSearchChange('')
  }

  return (
    <div className="space-y-4">
      {/* Search and Primary Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                {activeFiltersCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
                  >
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={statusFilters.includes(option.value)}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel>Writing Mode</DropdownMenuLabel>
              {writingModeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={writingModeFilters.includes(option.value)}
                  onCheckedChange={() => handleWritingModeToggle(option.value)}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
            const [sort, order] = value.split('-') as [typeof sortBy, typeof sortOrder]
            onSortChange(sort)
            onSortOrderChange(order)
          }}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <React.Fragment key={option.value}>
                  <SelectItem value={`${option.value}-desc`}>
                    {option.label} (Latest)
                  </SelectItem>
                  <SelectItem value={`${option.value}-asc`}>
                    {option.label} (Oldest)
                  </SelectItem>
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters and Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {(activeFiltersCount > 0 || searchQuery) && (
            <>
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">
                  Search: "{searchQuery}"
                </Badge>
              )}
              {statusFilters.map((status) => (
                <Badge key={status} variant="secondary">
                  Status: {status.replace('-', ' ')}
                </Badge>
              ))}
              {writingModeFilters.map((mode) => (
                <Badge key={mode} variant="secondary">
                  Mode: {mode.replace('-', ' ')}
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </>
          )}
        </div>
        
        <span className="text-sm text-muted-foreground">
          {filteredCount === totalCount 
            ? `${totalCount} projects`
            : `${filteredCount} of ${totalCount} projects`
          }
        </span>
      </div>
    </div>
  )
}