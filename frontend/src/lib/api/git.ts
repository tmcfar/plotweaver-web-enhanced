import axios from 'axios';
import { 
  FileContent, 
  DirectoryTree, 
  FileHistory, 
  GitDiff, 
  RepositoryStatus, 
  ProjectBranches, 
  PushOptions, 
  PushResult 
} from '@/types/git';
import { gitCache, GitCache } from '@/lib/git/GitCache';

const API_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class GitApiClient {
  private baseURL: string;
  private cache: GitCache;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.cache = gitCache;
  }

  private getAuthToken(): string | null {
    // Follow existing auth pattern: localStorage -> sessionStorage -> cookies
    let token = localStorage.getItem('auth_token');
    
    if (!token) {
      token = sessionStorage.getItem('auth_token');
    }
    
    if (!token) {
      // Check cookies as fallback
      const cookies = document.cookie.split('; ');
      const authCookie = cookies.find(cookie => cookie.startsWith('auth_token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    return token;
  }

  private getSessionId(): string | null {
    // Include session ID following existing pattern
    return sessionStorage.getItem('plotweaver_session_id') || localStorage.getItem('plotweaver_session_id');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();
    const sessionId = this.getSessionId();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add auth header if token available
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add session header if available
    if (sessionId) {
      headers['X-Session-ID'] = sessionId;
    }

    const response = await fetch(url, { ...options, headers });
    
    // Handle 401 Unauthorized - token might be expired
    if (response.status === 401 && token) {
      // Clear potentially invalid token
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      
      // In a real app, you might want to trigger token refresh here
      // For now, throw a more specific error
      throw new Error('Authentication failed - please sign in again');
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getFileContent(projectId: string, filePath: string): Promise<FileContent> {
    // Check cache first
    const cached = this.cache.get<FileContent>(projectId, 'file_content', filePath);
    if (cached) {
      return cached;
    }

    const result = await this.request<FileContent>(`/api/git/content/${projectId}/${filePath}`);
    
    // Cache the result
    this.cache.set(projectId, 'file_content', result, GitCache.TTL.FILE_CONTENT, filePath);
    
    return result;
  }

  async getProjectTree(projectId: string, path: string = ''): Promise<DirectoryTree> {
    // Check cache first
    const cached = this.cache.get<DirectoryTree>(projectId, 'project_tree', path);
    if (cached) {
      return cached;
    }

    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    const result = await this.request<DirectoryTree>(`/api/git/tree/${projectId}${params}`);
    
    // Cache the result
    this.cache.set(projectId, 'project_tree', result, GitCache.TTL.DIRECTORY_TREE, path);
    
    return result;
  }

  async getFileHistory(
    projectId: string,
    filePath: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<FileHistory> {
    // Check cache first
    const cached = this.cache.get<FileHistory>(projectId, 'file_history', filePath, options);
    if (cached) {
      return cached;
    }

    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.skip) params.append('skip', options.skip.toString());
    
    const result = await this.request<FileHistory>(
      `/api/git/history/${projectId}/${filePath}?${params}`
    );
    
    // Cache the result
    this.cache.set(projectId, 'file_history', result, GitCache.TTL.FILE_HISTORY, filePath, options);
    
    return result;
  }

  async getGitDiff(projectId: string, baseRef: string, headRef: string): Promise<GitDiff> {
    // Check cache first
    const cached = this.cache.get<GitDiff>(projectId, 'git_diff', baseRef, headRef);
    if (cached) {
      return cached;
    }

    const result = await this.request<GitDiff>(`/api/git/diff/${projectId}/${baseRef}/${headRef}`);
    
    // Cache the result
    this.cache.set(projectId, 'git_diff', result, GitCache.TTL.DIFF, baseRef, headRef);
    
    return result;
  }

  async getRepositoryStatus(projectId: string): Promise<RepositoryStatus> {
    // Check cache first
    const cached = this.cache.get<RepositoryStatus>(projectId, 'repository_status');
    if (cached) {
      return cached;
    }

    const result = await this.request<RepositoryStatus>(`/api/git/status/${projectId}`);
    
    // Cache the result with shorter TTL since status changes frequently
    this.cache.set(projectId, 'repository_status', result, GitCache.TTL.REPOSITORY_STATUS);
    
    return result;
  }

  async getProjectBranches(projectId: string): Promise<ProjectBranches> {
    // Check cache first
    const cached = this.cache.get<ProjectBranches>(projectId, 'project_branches');
    if (cached) {
      return cached;
    }

    const result = await this.request<ProjectBranches>(`/api/git/branches/${projectId}`);
    
    // Cache the result
    this.cache.set(projectId, 'project_branches', result, GitCache.TTL.BRANCHES);
    
    return result;
  }

  // Write operations - these go through the BFF proxy to backend
  async commitChanges(projectId: string, data: { message: string; files?: string[] }): Promise<any> {
    const result = await this.request<any>(`/api/git/commit/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Invalidate caches after commit
    this.cache.invalidate(projectId, 'repository_status');
    this.cache.invalidatePattern(projectId);
    
    return result;
  }

  async pushChanges(projectId: string, options: PushOptions): Promise<PushResult> {
    const result = await this.request<PushResult>(`/api/git/push/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
    
    // Invalidate relevant caches after push
    this.cache.invalidate(projectId, 'repository_status');
    this.cache.invalidate(projectId, 'project_branches');
    // Invalidate file content and tree caches as they might have changed
    this.cache.invalidatePattern(projectId);
    
    return result;
  }

  async createBranch(projectId: string, data: { name: string; source_branch?: string }): Promise<any> {
    const result = await this.request<any>(`/api/git/branch/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Invalidate branch cache
    this.cache.invalidate(projectId, 'project_branches');
    
    return result;
  }

  async switchBranch(projectId: string, data: { branch_name: string; create_if_missing?: boolean }): Promise<any> {
    const result = await this.request<any>(`/api/git/branch/${projectId}/switch`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    // Invalidate caches after branch switch
    this.cache.invalidatePattern(projectId);
    
    return result;
  }

  async createFile(projectId: string, data: { path: string; content: string; encoding?: string }): Promise<any> {
    const result = await this.request<any>(`/api/git/files/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Invalidate tree and status caches
    this.cache.invalidate(projectId, 'project_tree');
    this.cache.invalidate(projectId, 'repository_status');
    
    return result;
  }

  async updateFile(projectId: string, filePath: string, data: { content: string; encoding?: string }): Promise<any> {
    const result = await this.request<any>(`/api/git/files/${projectId}/${filePath}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    
    // Invalidate file and status caches
    this.invalidateFileCache(projectId, filePath);
    this.cache.invalidate(projectId, 'repository_status');
    
    return result;
  }

  async deleteFile(projectId: string, filePath: string): Promise<any> {
    const result = await this.request<any>(`/api/git/files/${projectId}/${filePath}`, {
      method: 'DELETE',
    });
    
    // Invalidate caches
    this.invalidateFileCache(projectId, filePath);
    this.cache.invalidate(projectId, 'project_tree');
    this.cache.invalidate(projectId, 'repository_status');
    
    return result;
  }

  async stageFiles(projectId: string, files: string[]): Promise<any> {
    const result = await this.request<any>(`/api/git/stage/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
    
    // Invalidate status cache
    this.cache.invalidate(projectId, 'repository_status');
    
    return result;
  }

  async unstageFiles(projectId: string, files: string[]): Promise<any> {
    const result = await this.request<any>(`/api/git/unstage/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ files }),
    });
    
    // Invalidate status cache
    this.cache.invalidate(projectId, 'repository_status');
    
    return result;
  }

  // Cache management methods
  clearCache(projectId?: string): void {
    if (projectId) {
      this.cache.invalidate(projectId);
    } else {
      this.cache.clear();
    }
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  invalidateFileCache(projectId: string, filePath: string): void {
    this.cache.invalidate(projectId, 'file_content', filePath);
    this.cache.invalidate(projectId, 'file_history', filePath);
  }

  invalidateTreeCache(projectId: string, path?: string): void {
    if (path) {
      this.cache.invalidate(projectId, 'project_tree', path);
    } else {
      this.cache.invalidatePattern(`${projectId}:project_tree`);
    }
  }
}

// Legacy interfaces for backward compatibility
export interface GitFileContent {
  content: string;
  path: string;
  last_commit?: {
    sha: string;
    message: string;
    author: string;
    timestamp: string;
  };
}

export interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  email: string;
  timestamp: string;
  short_sha: string;
}

// Legacy API object for backward compatibility
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const gitApi = {
  getContent: async (projectId: string, path: string): Promise<GitFileContent> => {
    const response = await apiClient.get(`/api/git/content/${projectId}/${path}`);
    return response.data;
  },
  
  getTree: async (projectId: string, path: string = ''): Promise<TreeItem[]> => {
    const response = await apiClient.get(`/api/git/tree/${projectId}`, {
      params: { path }
    });
    return response.data;
  },
  
  getDiff: async (projectId: string, baseRef: string, headRef: string = 'HEAD'): Promise<GitDiff> => {
    const response = await apiClient.get(`/api/git/diff/${projectId}/${baseRef}/${headRef}`);
    return response.data;
  },
  
  getHistory: async (projectId: string, path: string, limit: number = 10): Promise<GitCommit[]> => {
    const response = await apiClient.get(`/api/git/history/${projectId}/${path}`, {
      params: { limit }
    });
    return response.data;
  }
};

export default GitApiClient;