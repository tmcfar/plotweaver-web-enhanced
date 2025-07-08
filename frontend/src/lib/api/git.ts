import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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

export interface GitDiff {
  diff: string;
  changed_files: string[];
  base_ref: string;
  head_ref: string;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  email: string;
  timestamp: string;
  short_sha: string;
}

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