import type { 
  Project, 
  ProjectTemplate, 
  CreateProjectRequest, 
  UpdateProjectRequest,
  ProjectStats 
} from '@/types/project'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ProjectAPI {
  async getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE}/api/projects`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch projects')
    }
    
    return response.json()
  }

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch project')
    }
    
    return response.json()
  }

  async createProject(data: CreateProjectRequest): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create project')
    }
    
    return response.json()
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update project')
    }
    
    return response.json()
  }

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/projects/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete project')
    }
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    const response = await fetch(`${API_BASE}/api/project-templates`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch project templates')
    }
    
    return response.json()
  }

  async getProjectStats(): Promise<ProjectStats> {
    const response = await fetch(`${API_BASE}/api/projects/stats`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch project stats')
    }
    
    return response.json()
  }

  async duplicateProject(id: string, title: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/api/projects/${id}/duplicate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to duplicate project')
    }
    
    return response.json()
  }

  async archiveProject(id: string): Promise<void> {
    await this.updateProject(id, { status: 'archived' })
  }

  async restoreProject(id: string): Promise<void> {
    await this.updateProject(id, { status: 'draft' })
  }
}

export const projectAPI = new ProjectAPI()