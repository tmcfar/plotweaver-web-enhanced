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

  // Git integration endpoints
  git: {
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
    getDiff: async (projectId: string, baseRef: string, headRef: string) => {
      const response = await bffClient.get(`/api/git/diff/${projectId}/${baseRef}/${headRef}`);
      return response.data;
    },
    // Backend endpoints now implemented
    getRepositoryStatus: async (projectId: string) => {
      const response = await bffClient.get(`/api/git/status/${projectId}`);
      return response.data;
    },
    getBranches: async (projectId: string) => {
      const response = await bffClient.get(`/api/git/branches/${projectId}`);
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
