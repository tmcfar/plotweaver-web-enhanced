import axios from 'axios';

const BFF_BASE_URL = process.env.NEXT_PUBLIC_BFF_URL || 'http://localhost:8000';

const bffClient = axios.create({
  baseURL: BFF_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

// Add auth interceptor
bffClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for BFF endpoints
export interface PreviewUpdate {
  html: string;
  screenshot?: string | null;
  metadata?: Record<string, any>;
}

export interface ComponentLock {
  id: string;
  componentId: string;
  level: 'soft' | 'hard' | 'frozen';
  type: 'personal' | 'editorial' | 'collaborative';
  reason: string;
  lockedBy: string;
  lockedAt: string;
  sharedWith: string[];
  canOverride: boolean;
}

export interface BulkLockOperation {
  type: 'lock' | 'unlock' | 'change_level';
  componentIds: string[];
  lockLevel?: 'soft' | 'hard' | 'frozen';
  reason: string;
}

export interface LockConflict {
  id: string;
  componentId: string;
  type: string;
  description: string;
  currentState: any;
  conflictingState: any;
  priority: string;
  affectedUsers: string[];
  createdAt: string;
}

export interface ConflictResolution {
  type: string;
  reason: string;
  customState?: any;
}

export const bffApi = {
  // Preview endpoints
  preview: {
    update: async (data: PreviewUpdate) => {
      const response = await bffClient.post('/api/preview/update', data);
      return response.data;
    },
    getCurrent: async () => {
      const response = await bffClient.get('/api/preview/current');
      return response.data;
    },
    getScreenshot: async () => {
      const response = await bffClient.get('/api/preview/screenshot');
      return response.data;
    },
  },

  // Enhanced lock endpoints
  locks: {
    getProjectLocks: async (projectId: string) => {
      const response = await bffClient.get(`/api/projects/${projectId}/locks`);
      return response.data;
    },
    updateComponentLock: async (projectId: string, componentId: string, lock: ComponentLock) => {
      const response = await bffClient.put(`/api/projects/${projectId}/locks/${componentId}`, lock);
      return response.data;
    },
    bulkUpdate: async (projectId: string, operations: BulkLockOperation[]) => {
      const response = await bffClient.post(`/api/projects/${projectId}/locks/bulk`, { operations });
      return response.data;
    },
    getAuditTrail: async (projectId: string) => {
      const response = await bffClient.get(`/api/projects/${projectId}/locks/audit`);
      return response.data;
    },
  },

  // Conflict resolution endpoints
  conflicts: {
    getProjectConflicts: async (projectId: string) => {
      const response = await bffClient.get(`/api/projects/${projectId}/conflicts`);
      return response.data;
    },
    resolveConflict: async (projectId: string, conflictId: string, resolution: ConflictResolution) => {
      const response = await bffClient.post(`/api/projects/${projectId}/conflicts/${conflictId}/resolve`, resolution);
      return response.data;
    },
  },

  // Mode set endpoints
  modeSet: {
    getUserModeSet: async () => {
      const response = await bffClient.get('/api/user/mode-set');
      return response.data;
    },
    setUserModeSet: async (modeSetId: string) => {
      const response = await bffClient.post('/api/user/mode-set', { modeSetId });
      return response.data;
    },
  },

  // Git integration endpoints - Read operations (BFF handles these)
  git: {
    // File operations
    getFileContent: async (projectId: string, filePath: string) => {
      const response = await bffClient.get(`/api/git/content/${projectId}/${filePath}`);
      return response.data;
    },
    getProjectTree: async (projectId: string, path?: string) => {
      const url = `/api/git/tree/${projectId}`;
      const response = await bffClient.get(url, {
        params: path ? { path } : {}
      });
      return response.data;
    },
    getFileHistory: async (projectId: string, filePath: string, limit?: number) => {
      const url = `/api/git/history/${projectId}/${filePath}`;
      const response = await bffClient.get(url, {
        params: limit ? { limit } : {}
      });
      return response.data;
    },
    getDiff: async (projectId: string, baseRef?: string, headRef: string = 'HEAD') => {
      const url = baseRef 
        ? `/api/git/diff/${projectId}?base_ref=${baseRef}&head_ref=${headRef}`
        : `/api/git/diff/${projectId}?head_ref=${headRef}`;
      const response = await bffClient.get(url);
      return response.data;
    },
    
    // Specialized PlotWeaver content
    getCharacters: async (projectId: string) => {
      const response = await bffClient.get(`/api/git/characters/${projectId}`);
      return response.data;
    },
    getScenes: async (projectId: string, chapter?: string) => {
      const url = `/api/git/scenes/${projectId}`;
      const response = await bffClient.get(url, {
        params: chapter ? { chapter } : {}
      });
      return response.data;
    },
    getWorldbuilding: async (projectId: string) => {
      const response = await bffClient.get(`/api/git/worldbuilding/${projectId}`);
      return response.data;
    },
    
    // Write operations (proxied to backend)
    commit: async (projectId: string, data: { message: string; files?: string[] }) => {
      const response = await bffClient.post(`/api/git/commit/${projectId}`, data);
      return response.data;
    },
    push: async (projectId: string, data?: { branch?: string; force?: boolean }) => {
      const response = await bffClient.post(`/api/git/push/${projectId}`, data || {});
      return response.data;
    },
    createBranch: async (projectId: string, data: { name: string; source_branch?: string }) => {
      const response = await bffClient.post(`/api/git/branch/${projectId}`, data);
      return response.data;
    },
    switchBranch: async (projectId: string, data: { branch_name: string; create_if_missing?: boolean }) => {
      const response = await bffClient.put(`/api/git/branch/${projectId}/switch`, data);
      return response.data;
    },
    createFile: async (projectId: string, data: { path: string; content: string; encoding?: string }) => {
      const response = await bffClient.post(`/api/git/files/${projectId}`, data);
      return response.data;
    },
    updateFile: async (projectId: string, filePath: string, data: { content: string; encoding?: string }) => {
      const response = await bffClient.put(`/api/git/files/${projectId}/${filePath}`, data);
      return response.data;
    },
    deleteFile: async (projectId: string, filePath: string) => {
      const response = await bffClient.delete(`/api/git/files/${projectId}/${filePath}`);
      return response.data;
    },
  },

  // Health check
  health: async () => {
    const response = await bffClient.get('/api/health');
    return response.data;
  },
};

export default bffApi;
