export interface Project {
  id: string
  title: string
  description: string
  genre: string
  status: 'draft' | 'in-progress' | 'completed' | 'archived'
  wordCount: number
  targetWordCount?: number
  createdAt: string
  updatedAt: string
  coverImage?: string
  tags: string[]
  writingMode: 'professional-writer' | 'ai-first' | 'editor' | 'hobbyist'
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  genre: string
  structure: ProjectStructure
  estimatedLength: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  icon: string
}

export interface ProjectStructure {
  chapters: number
  scenesPerChapter: number
  charactersCount: number
  locationsCount: number
}

export interface CreateProjectRequest {
  title: string
  description?: string
  genre: string
  writingMode: Project['writingMode']
  templateId?: string
  targetWordCount?: number
  tags?: string[]
}

export interface UpdateProjectRequest {
  title?: string
  description?: string
  genre?: string
  status?: Project['status']
  targetWordCount?: number
  tags?: string[]
  coverImage?: string
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalWordCount: number
  averageWordsPerDay: number
  currentStreak: number
}