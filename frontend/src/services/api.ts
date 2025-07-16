/**
 * API client for PlotWeaver with scene generation support
 */

import axios from 'axios';
import type {
  ConceptAnalysisRequest,
  ConceptAnalysisResponse,
  SetupProgress,
  WorldbuildingStatus,
  SetupPath,
  SetupStepCompleteRequest,
  AssumptionOverrideRequest,
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Subscription,
  Usage,
  CostBreakdown,
} from '@/types';
import { worldbuildingApi } from './worldbuildingApi';
import { bffApi } from './bffApi';

// Use the BFF URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('API Base URL:', API_BASE_URL); // Debug logging

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable session cookies
  timeout: 30000, // 30 second timeout (increased from 10s)
});

// Add request interceptor for auth token and debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.baseURL + config.url); // Debug logging
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response?.status, error.config?.url, error.message);
    return Promise.reject(error);
  }
);

// Types
export interface Project {
  id: number;
  name: string;
  description?: string;
  git_repo_url: string;
  git_repo_path?: string;
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

  // Worldbuilding endpoints
  worldbuilding: worldbuildingApi,

  // Auth endpoints
  auth: {
    register: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await apiClient.post('/api/v1/auth/register', data);
      return response.data;
    },
    login: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await apiClient.post('/api/v1/auth/login', data);
      return response.data;
    },
    logout: async () => {
      const response = await apiClient.post('/api/v1/auth/logout');
      return response.data;
    },
    refresh: async () => {
      const response = await apiClient.post('/api/v1/auth/refresh');
      return response.data;
    },
    getUser: async (): Promise<User> => {
      const response = await apiClient.get('/api/v1/auth/user');
      return response.data;
    },
    updateUser: async (data: Partial<User>): Promise<User> => {
      const response = await apiClient.patch('/api/v1/auth/user', data);
      return response.data;
    },
  },

  // User profile endpoints
  profile: {
    get: async (): Promise<User> => {
      const response = await apiClient.get('/api/v1/user/profile');
      return response.data;
    },
    update: async (data: Partial<User>): Promise<User> => {
      const response = await apiClient.patch('/api/v1/user/profile', data);
      return response.data;
    },
    delete: async (data: { confirmation: string; password: string }) => {
      const response = await apiClient.delete('/api/v1/user/profile', { data });
      return response.data;
    },
  },

  // Billing endpoints
  billing: {
    getSubscription: async (): Promise<Subscription> => {
      const response = await apiClient.get('/api/v1/billing/subscription');
      return response.data;
    },
    getUsage: async (params?: { start_date?: string; end_date?: string }): Promise<Usage & { cost_breakdown: CostBreakdown }> => {
      const response = await apiClient.get('/api/v1/billing/usage', { params });
      return response.data;
    },
    updatePaymentMethod: async (data: { stripe_payment_method_id: string; set_as_default?: boolean }) => {
      const response = await apiClient.post('/api/v1/billing/payment-method', data);
      return response.data;
    },
  },

  // Project secrets endpoints
  secrets: {
    list: async (projectId: string) => {
      const response = await apiClient.get(`/api/v1/projects/${projectId}/secrets`);
      return response.data;
    },
    add: async (projectId: string, data: { key: string; value: string; description?: string }) => {
      const response = await apiClient.post(`/api/v1/projects/${projectId}/secrets`, data);
      return response.data;
    },
    delete: async (projectId: string, key: string) => {
      const response = await apiClient.delete(`/api/v1/projects/${projectId}/secrets/${key}`);
      return response.data;
    },
  },

  // BFF endpoints (preview, git, enhanced locks, conflicts)
  bff: bffApi,
};

export default api;
