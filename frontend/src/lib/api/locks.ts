// Lock-related types and API client
export type LockLevel = 'soft' | 'hard' | 'frozen';
export type LockType = 'personal' | 'editorial' | 'collaborative';

export interface ComponentLock {
  id: string;
  componentId: string;
  level: LockLevel;
  type: LockType;
  reason: string;
  lockedBy: string;
  lockedAt: Date;
  sharedWith?: string[];
  canOverride?: boolean;
}

export interface LockConflict {
  id: string;
  componentId: string;
  type: 'lock_override' | 'concurrent_edit' | 'permission_change' | 'merge_conflict';
  description: string;
  currentState: any;
  conflictingState: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  affectedUsers: string[];
  createdAt: Date;
}

export interface ConflictResolution {
  type: 'keep_current' | 'accept_new' | 'merge' | 'skip' | 'custom';
  reason: string;
  customState?: any;
}

export interface BulkLockOperation {
  type: 'lock' | 'unlock' | 'change_level';
  componentIds: string[];
  lockLevel?: LockLevel;
  reason: string;
}

export interface LockState {
  locks: Record<string, ComponentLock>;
  conflicts: LockConflict[];
}

export interface ConflictCheck {
  hasConflicts: boolean;
  conflicts: LockConflict[];
  canProceed: boolean;
}

class LockAPIService {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const requestKey = `${options.method || 'GET'}-${url}`;
    
    // Prevent duplicate requests
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }

    const requestPromise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      return response.json();
    }).finally(() => {
      this.pendingRequests.delete(requestKey);
    });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  async getLocks(projectId: string): Promise<Record<string, ComponentLock>> {
    const cacheKey = `locks-${projectId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const locks = await this.request<Record<string, ComponentLock>>(
        `/projects/${projectId}/locks`
      );
      
      this.cache.set(cacheKey, locks);
      return locks;
    } catch (error) {
      console.error('Failed to fetch locks:', error);
      return {};
    }
  }

  async updateLock(
    projectId: string, 
    componentId: string, 
    lock: ComponentLock
  ): Promise<void> {
    try {
      await this.request(`/projects/${projectId}/locks/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify(lock),
      });
      
      // Invalidate cache
      this.cache.delete(`locks-${projectId}`);
    } catch (error) {
      console.error('Failed to update lock:', error);
      throw error;
    }
  }

  async bulkUpdateLocks(
    projectId: string, 
    operations: BulkLockOperation[]
  ): Promise<void> {
    try {
      await this.request(`/projects/${projectId}/locks/bulk`, {
        method: 'POST',
        body: JSON.stringify({ operations }),
      });
      
      // Invalidate cache
      this.cache.delete(`locks-${projectId}`);
    } catch (error) {
      console.error('Failed to bulk update locks:', error);
      throw error;
    }
  }

  async checkConflicts(
    projectId: string, 
    operation: any
  ): Promise<ConflictCheck> {
    try {
      return this.request<ConflictCheck>(
        `/projects/${projectId}/locks/check-conflicts`, {
          method: 'POST',
          body: JSON.stringify(operation),
        }
      );
    } catch (error) {
      console.error('Failed to check conflicts:', error);
      return {
        hasConflicts: false,
        conflicts: [],
        canProceed: true
      };
    }
  }

  async resolveConflict(
    projectId: string, 
    conflictId: string, 
    resolution: ConflictResolution
  ): Promise<void> {
    try {
      await this.request(`/projects/${projectId}/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(resolution),
      });
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  async getAuditTrail(projectId: string): Promise<any[]> {
    try {
      return this.request<any[]>(`/projects/${projectId}/locks/audit`);
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
      return [];
    }
  }
}

export const lockAPI = new LockAPIService();