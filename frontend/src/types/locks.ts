export type LockLevel = 'soft' | 'hard' | 'frozen';

export interface ComponentLock {
  componentId: string;
  componentType: string;
  level: LockLevel;
  lockedBy: string;
  lockedAt: string;
  reason?: string;
  expiresAt?: string;
}

export interface LockConflict {
  id: string;
  componentId: string;
  requestedBy: string;
  currentLock: ComponentLock;
  conflictType: 'write' | 'delete' | 'move';
  timestamp: string;
}

export interface CreateLockRequest {
  componentId: string;
  componentType: string;
  level: LockLevel;
  reason?: string;
  expiresAt?: string;
}

export interface Resolution {
  cancelled?: boolean;
  modifiedPayload?: Record<string, unknown>;
}