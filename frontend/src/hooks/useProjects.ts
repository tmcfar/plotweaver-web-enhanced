'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { projectAPI } from '@/lib/api/projects'
import { useToast } from '@/components/ui/use-toast'
import type { 
  Project, 
  CreateProjectRequest, 
  UpdateProjectRequest 
} from '@/types/project'

const QUERY_KEYS = {
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  templates: ['project-templates'] as const,
  stats: ['project-stats'] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: projectAPI.getProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.project(id),
    queryFn: () => projectAPI.getProject(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useProjectTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.templates,
    queryFn: projectAPI.getProjectTemplates,
    staleTime: 30 * 60 * 1000, // 30 minutes - templates change rarely
  })
}

export function useProjectStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats,
    queryFn: projectAPI.getProjectStats,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectAPI.createProject(data),
    onSuccess: (newProject: Project) => {
      // Update projects list
      queryClient.setQueryData<Project[]>(QUERY_KEYS.projects, (old) => {
        return old ? [newProject, ...old] : [newProject]
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Project created',
        description: `"${newProject.title}" has been created successfully.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create project',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ 
      id, 
      data 
    }: { 
      id: string
      data: UpdateProjectRequest 
    }) => projectAPI.updateProject(id, data),
    onSuccess: (updatedProject: Project) => {
      // Update specific project
      queryClient.setQueryData(
        QUERY_KEYS.project(updatedProject.id), 
        updatedProject
      )
      
      // Update projects list
      queryClient.setQueryData<Project[]>(QUERY_KEYS.projects, (old) => {
        return old?.map(p => p.id === updatedProject.id ? updatedProject : p) || []
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Project updated',
        description: `"${updatedProject.title}" has been updated.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update project',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: projectAPI.deleteProject,
    onSuccess: (_, deletedId) => {
      // Remove from projects list
      queryClient.setQueryData<Project[]>(QUERY_KEYS.projects, (old) => {
        return old?.filter(p => p.id !== deletedId) || []
      })
      
      // Remove specific project query
      queryClient.removeQueries({ queryKey: QUERY_KEYS.project(deletedId) })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Project deleted',
        description: 'The project has been permanently deleted.',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete project',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useDuplicateProject() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ 
      id, 
      title 
    }: { 
      id: string
      title: string 
    }) => projectAPI.duplicateProject(id, title),
    onSuccess: (duplicatedProject: Project) => {
      // Add to projects list
      queryClient.setQueryData<Project[]>(QUERY_KEYS.projects, (old) => {
        return old ? [duplicatedProject, ...old] : [duplicatedProject]
      })
      
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
      
      toast({
        title: 'Project duplicated',
        description: `"${duplicatedProject.title}" has been created.`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to duplicate project',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

export function useArchiveProject() {
  const { mutate: updateProject, ...rest } = useUpdateProject()

  const archiveProject = (id: string) => {
    updateProject({ id, data: { status: 'archived' } })
  }

  return {
    mutate: archiveProject,
    ...rest,
  }
}