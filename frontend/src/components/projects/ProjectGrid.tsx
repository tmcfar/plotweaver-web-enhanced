'use client'

import React from 'react'
import { ProjectCard } from './ProjectCard'
import { ProjectList } from './ProjectList'
import { NoProjectsState } from '@/components/design-system/empty-states'
import { SkeletonCard } from '@/components/design-system/loading-states'
import { useDeleteProject, useDuplicateProject, useArchiveProject } from '@/hooks/useProjects'
import type { Project } from '@/types/project'

interface ProjectGridProps {
  projects: Project[]
  isLoading: boolean
  viewMode: 'grid' | 'list'
  onCreateProject: () => void
  onEditProject: (project: Project) => void
  className?: string
}

export function ProjectGrid({ 
  projects, 
  isLoading, 
  viewMode,
  onCreateProject, 
  onEditProject,
  className 
}: ProjectGridProps) {
  const deleteProject = useDeleteProject()
  const duplicateProject = useDuplicateProject()
  const archiveProject = useArchiveProject()

  const handleDuplicate = (project: Project) => {
    const newTitle = `${project.title} (Copy)`
    duplicateProject.mutate({ id: project.id, title: newTitle })
  }

  const handleArchive = (project: Project) => {
    archiveProject.mutate(project.id)
  }

  const handleDelete = (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
      deleteProject.mutate(project.id)
    }
  }

  if (isLoading) {
    return viewMode === 'list' ? (
      <div className="space-y-4">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    ) : (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <NoProjectsState onCreateProject={onCreateProject} />
    )
  }

  if (viewMode === 'list') {
    return (
      <ProjectList
        projects={projects}
        onEdit={onEditProject}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onDelete={handleDelete}
        className={className}
      />
    )
  }

  return (
    <div className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onEdit={() => onEditProject(project)}
          onDuplicate={() => handleDuplicate(project)}
          onArchive={() => handleArchive(project)}
          onDelete={() => handleDelete(project)}
        />
      ))}
    </div>
  )
}