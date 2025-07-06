'use client'

import React, { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProjectGrid } from '@/components/projects/ProjectGrid'
import { ProjectFilters } from '@/components/projects/ProjectFilters'
import { CreateProjectWizard } from '@/components/projects/CreateProjectWizard'
import { ErrorState } from '@/components/design-system/empty-states'
import { useProjects } from '@/hooks/useProjects'
import type { Project } from '@/types/project'

export default function ProjectsPage() {
  const { data: projects = [], isLoading, error } = useProjects()
  
  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilters, setStatusFilters] = useState<Project['status'][]>([])
  const [writingModeFilters, setWritingModeFilters] = useState<Project['writingMode'][]>([])
  const [sortBy, setSortBy] = useState<'title' | 'updatedAt' | 'createdAt' | 'wordCount'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateWizard, setShowCreateWizard] = useState(false)

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.genre.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply status filters
    if (statusFilters.length > 0) {
      filtered = filtered.filter(project => statusFilters.includes(project.status))
    }

    // Apply writing mode filters
    if (writingModeFilters.length > 0) {
      filtered = filtered.filter(project => writingModeFilters.includes(project.writingMode))
    }

    // Sort projects
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'wordCount':
          aValue = a.wordCount
          bValue = b.wordCount
          break
        case 'updatedAt':
        default:
          aValue = new Date(a.updatedAt).getTime()
          bValue = new Date(b.updatedAt).getTime()
          break
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [projects, searchQuery, statusFilters, writingModeFilters, sortBy, sortOrder])

  const handleCreateProject = () => {
    setShowCreateWizard(true)
  }

  const handleEditProject = (project: Project) => {
    // This will be implemented when we create the project editing flow
    console.log('Edit project:', project.id)
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorState
          title="Failed to load projects"
          description="There was an error loading your projects. Please try again."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your writing projects and track your progress
          </p>
        </div>
        <Button onClick={handleCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-8">
        <ProjectFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
          writingModeFilters={writingModeFilters}
          onWritingModeFiltersChange={setWritingModeFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={projects.length}
          filteredCount={filteredAndSortedProjects.length}
        />
      </div>

      {/* Projects Grid/List */}
      <ProjectGrid
        projects={filteredAndSortedProjects}
        isLoading={isLoading}
        viewMode={viewMode}
        onCreateProject={handleCreateProject}
        onEditProject={handleEditProject}
      />

      {/* Create Project Wizard */}
      <CreateProjectWizard
        open={showCreateWizard}
        onOpenChange={setShowCreateWizard}
      />
    </div>
  )
}