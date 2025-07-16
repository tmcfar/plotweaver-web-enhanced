import { api } from '@/services/api'
import type { 
  Project, 
  ProjectTemplate, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectStats 
} from '@/types/project'

// Adapter to convert between backend API format and frontend Project type
const convertApiProjectToFrontend = (apiProject: any): Project => {
  return {
    id: apiProject.id.toString(),
    title: apiProject.name,
    description: apiProject.description || '',
    genre: 'fiction', // Default genre, update based on settings
    targetWordCount: 80000, // Default target
    wordCount: apiProject.statistics?.total_words || 0,
    // Chapter and scene tracking removed as not part of Project interface
    status: 'draft' as const,
    writingMode: apiProject.mode_set || 'discovery',
    tags: [],
    createdAt: apiProject.created_at,
    updatedAt: apiProject.updated_at,
    lastAccessedAt: apiProject.last_accessed,
    collaborators: [],
    settings: {
      autoSave: true,
      spellCheck: true,
      grammarCheck: true,
      targetWordsPerDay: 1000,
      writingSchedule: null,
      exportFormat: 'docx',
      fontFamily: 'serif',
      fontSize: 14,
      lineHeight: 2,
      theme: 'light'
    },
    metadata: {
      totalCost: apiProject.statistics?.total_cost || 0,
      totalSavings: apiProject.statistics?.total_savings || 0,
      gitRepoUrl: apiProject.git_repo_url,
      gitInitialized: apiProject.git_initialized,
      gitBranch: apiProject.git_branch
    }
  }
}

class ProjectAPI {
  async getProjects(): Promise<Project[]> {
    const response = await api.listProjects()
    return response.projects.map(convertApiProjectToFrontend)
  }

  async getProject(id: string): Promise<Project> {
    const apiProject = await api.getProject(parseInt(id))
    return convertApiProjectToFrontend(apiProject)
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const apiProject = await api.createProject({
      name: data.title,
      description: data.description,
      mode_set: data.writingMode,
      create_github_repo: false // TODO: Add GitHub integration option
    })
    return convertApiProjectToFrontend(apiProject)
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    // TODO: Implement update endpoint in backend
    // For now, just get the project again
    const apiProject = await api.getProject(parseInt(id))
    return convertApiProjectToFrontend(apiProject)
  }

  async deleteProject(id: string): Promise<void> {
    await api.deleteProject(parseInt(id))
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    // TODO: Implement templates in backend
    return [
      {
        id: '1',
        name: 'Fantasy Novel',
        description: 'Epic fantasy adventure template',
        genre: 'fantasy',
        estimatedLength: 100000,
        difficulty: 'intermediate' as const,
        icon: '🏰',
        structure: {
          chapters: 30,
          scenesPerChapter: 4,
          charactersCount: 8,
          locationsCount: 5
        },
        settings: {}
      },
      {
        id: '2',
        name: 'Mystery Novel',
        description: 'Classic whodunit mystery',
        genre: 'mystery',
        estimatedLength: 80000,
        difficulty: 'beginner' as const,
        icon: '🕵️',
        structure: {
          chapters: 24,
          scenesPerChapter: 3,
          charactersCount: 6,
          locationsCount: 4
        },
        settings: {}
      }
    ]
  }

  async getProjectStats(): Promise<ProjectStats> {
    const response = await api.listProjects()
    const projects = response.projects
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => !p.git_repo_url || p.git_initialized).length,
      completedProjects: 0, // TODO: Track completed projects in backend
      totalWordCount: projects.reduce((sum, p) => sum + (p.statistics?.total_words || 0), 0),
      averageWordsPerDay: 0, // TODO: Calculate based on project creation dates
      currentStreak: 0 // TODO: Track writing streaks
    }
  }

  async duplicateProject(id: string, title: string): Promise<Project> {
    // TODO: Implement duplicate in backend
    // For now, create a new project with same settings
    const original = await api.getProject(parseInt(id))
    const newProject = await api.createProject({
      name: title,
      description: `Copy of ${original.description || original.name}`,
      mode_set: original.mode_set
    })
    return convertApiProjectToFrontend(newProject)
  }

  async archiveProject(id: string): Promise<void> {
    // TODO: Implement archive status in backend
    console.warn('Archive not yet implemented in backend')
  }

  async restoreProject(id: string): Promise<void> {
    // TODO: Implement restore in backend
    console.warn('Restore not yet implemented in backend')
  }
}

export const projectAPI = new ProjectAPI()