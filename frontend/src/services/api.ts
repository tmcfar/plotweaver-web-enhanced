/**
 * API client for PlotWeaver with scene generation support
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable session cookies
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  git_repo_url: string;
  git_initialized: boolean;
  mode_set: string;
  statistics: {
    total_words: number;
    total_scenes: number;
    total_chapters: number;
    total_cost: number;
    total_savings: number;
  };
  created_at: string;
  updated_at: string;
  last_accessed: string;
}

export interface ProjectListResponse {
  projects: Project[];
  count: number;
  active_project_id?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  mode_set?: string;
  create_github_repo?: boolean;
  github_token?: string;
  private?: boolean;
}

export interface SceneGenerationRequest {
  project_id: string;
  project_name?: string;
  characters?: Record<string, any>;
  plot_outline?: Record<string, any>;
  previous_results?: any[];
}

export interface SceneGenerationResponse {
  success: boolean;
  task_id?: string;
  content?: string;
  metadata?: {
    word_count: number;
    dh_enabled: boolean;
    dh_savings: number;
  };
  cost_estimate?: number;
  dh_savings?: number;
  error?: any;
}

export interface ChapterGenerationRequest extends SceneGenerationRequest {
  scenes_count: number;
}

export interface ChapterGenerationResponse {
  success: boolean;
  chapter: number;
  scenes: SceneGenerationResponse[];
  total_words: number;
  total_dh_savings: number;
}

export interface GenerationStatus {
  task_id: string;
  status: 'running' | 'completed' | 'failed' | 'not_found';
  started_at?: string;
}

// API methods
export const api = {
  // Project management endpoints
  listProjects: async (): Promise<ProjectListResponse> => {
    const response = await apiClient.get('/api/v1/projects');
    return response.data;
  },

  createProject: async (data: CreateProjectRequest): Promise<Project> => {
    const response = await apiClient.post('/api/v1/projects', data);
    return response.data;
  },

  getProject: async (projectId: number): Promise<Project> => {
    const response = await apiClient.get(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  activateProject: async (projectId: number): Promise<{ message: string; project_id: number; project: Project }> => {
    const response = await apiClient.post(`/api/v1/projects/${projectId}/activate`);
    return response.data;
  },

  deleteProject: async (projectId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/v1/projects/${projectId}`);
    return response.data;
  },

  getActiveProject: async (): Promise<{ active_project: Project | null }> => {
    const response = await apiClient.get('/api/v1/projects/active');
    return response.data;
  },

  // Scene generation endpoints
  generateScene: async (
    chapter: number,
    scene: number,
    data: SceneGenerationRequest
  ): Promise<SceneGenerationResponse> => {
    const response = await apiClient.post(
      `/api/generate/scene/${chapter}/${scene}`,
      data
    );
    return response.data;
  },

  generateChapter: async (
    chapter: number,
    data: ChapterGenerationRequest
  ): Promise<ChapterGenerationResponse> => {
    const response = await apiClient.post(
      `/api/generate/chapter/${chapter}`,
      data
    );
    return response.data;
  },

  getGenerationStatus: async (taskId: string): Promise<GenerationStatus> => {
    const response = await apiClient.get(`/api/generate/status/${taskId}`);
    return response.data;
  },

  testGeneration: async () => {
    const response = await apiClient.get('/api/generate/test');
    return response.data;
  },

  // Context endpoints (existing)
  getProjectContext: async (projectId: string) => {
    const response = await apiClient.get(`/api/context/${projectId}`);
    return response.data;
  },

  updateProjectContext: async (projectId: string, context: any) => {
    const response = await apiClient.put(`/api/context/${projectId}`, context);
    return response.data;
  },

  // Mode-set endpoints (existing)
  getModeSet: async (modeSetName: string) => {
    const response = await apiClient.get(`/api/mode-sets/${modeSetName}`);
    return response.data;
  },

  getModeSets: async () => {
    const response = await apiClient.get('/api/mode-sets');
    return response.data;
  },

  // Lock endpoints (existing)
  acquireLock: async (projectId: string, component: string) => {
    const response = await apiClient.post('/api/locks/acquire', {
      project_id: projectId,
      component,
    });
    return response.data;
  },

  releaseLock: async (projectId: string, component: string) => {
    const response = await apiClient.post('/api/locks/release', {
      project_id: projectId,
      component,
    });
    return response.data;
  },

  checkLock: async (projectId: string, component: string) => {
    const response = await apiClient.get('/api/locks/check', {
      params: { project_id: projectId, component },
    });
    return response.data;
  },

  // Progress endpoints (existing)
  trackProgress: async (projectId: string, progress: any) => {
    const response = await apiClient.post('/api/progress/track', {
      project_id: projectId,
      progress,
    });
    return response.data;
  },

  getProgress: async (projectId: string) => {
    const response = await apiClient.get(`/api/progress/${projectId}`);
    return response.data;
  },
};

export default api;
