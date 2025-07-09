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

const API_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000';

class GitApiClient {
  private baseURL: string;
  private authToken: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.authToken = localStorage.getItem('authToken') || '';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async getFileContent(projectId: string, filePath: string): Promise<FileContent> {
    return this.request<FileContent>(`/api/git/content/${projectId}/${filePath}`);
  }

  async getProjectTree(projectId: string, path: string = ''): Promise<DirectoryTree> {
    const params = path ? `?path=${encodeURIComponent(path)}` : '';
    return this.request<DirectoryTree>(`/api/git/tree/${projectId}${params}`);
  }

  async getFileHistory(
    projectId: string,
    filePath: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<FileHistory> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.skip) params.append('skip', options.skip.toString());
    
    return this.request<FileHistory>(
      `/api/git/history/${projectId}/${filePath}?${params}`
    );
  }

  async getGitDiff(projectId: string, baseRef: string, headRef: string): Promise<GitDiff> {
    return this.request<GitDiff>(`/api/git/diff/${projectId}/${baseRef}/${headRef}`);
  }

  async getRepositoryStatus(projectId: string): Promise<RepositoryStatus> {
    return this.request<RepositoryStatus>(`/api/git/status/${projectId}`);
  }

  async getProjectBranches(projectId: string): Promise<ProjectBranches> {
    return this.request<ProjectBranches>(`/api/git/branches/${projectId}`);
  }

  async pushChanges(projectId: string, options: PushOptions): Promise<PushResult> {
    return this.request<PushResult>(`/api/git/push/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
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