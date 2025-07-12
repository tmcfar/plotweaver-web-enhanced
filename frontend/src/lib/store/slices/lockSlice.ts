import { StateCreator } from '../../../types/store';
import { ComponentLock as APIComponentLock, LockConflict as APILockConflict } from '../../api/locks';
import { ComponentLock, LockLevel, LockConflict, CreateLockRequest } from '../../../types/locks';
import { lockService } from '../../api/locks';

export interface LockSlice {
  // State
  locks: Record<string, ComponentLock>;
  lockConflicts: LockConflict[];
  lockHistory: ComponentLock[];

  // Actions
  lockComponent: (componentId: string, level: LockLevel, reason?: string) => Promise<void>;
  unlockComponent: (componentId: string) => Promise<void>;
  updateLock: (componentId: string, updates: Partial<ComponentLock>) => void;
  addLockConflict: (conflict: LockConflict) => void;
  resolveLockConflict: (conflictId: string) => void;
  clearLockConflicts: () => void;

  // Selectors (computed)
  isLocked: (componentId: string) => boolean;
  getLock: (componentId: string) => ComponentLock | undefined;
  getLockedComponents: () => string[];
  hasConflicts: () => boolean;
}

export const createLockSlice: StateCreator<LockSlice> = (set, get) => ({
  // Initial state
  locks: {},
  lockConflicts: [],
  lockHistory: [],

  // Actions
  lockComponent: async (componentId, level, reason) => {
    try {
      const request: CreateLockRequest = {
        componentId,
        componentType: 'component', // In real app, this would be determined dynamically
        level,
        reason
      };

      const lock = await lockService.createLock(request);

      set((state) => ({
        locks: { ...state.locks, [componentId]: lock },
        lockHistory: [...state.lockHistory, lock]
      }));
    } catch (error) {
      console.error('Failed to lock component:', error);
      throw error;
    }
  },

  unlockComponent: async (componentId) => {
    try {
      await lockService.releaseLock(componentId);

      set((state) => {
        const { [componentId]: _, ...remainingLocks } = state.locks;
        return { locks: remainingLocks };
      });
    } catch (error) {
      console.error('Failed to unlock component:', error);
      throw error;
    }
  },

  updateLock: (componentId, updates) => set((state) => {
    const existingLock = state.locks[componentId];
    if (!existingLock) return state;

    return {
      locks: {
        ...state.locks,
        [componentId]: { ...existingLock, ...updates }
      }
    };
  }),

  addLockConflict: (conflict) => set((state) => ({
    lockConflicts: [...state.lockConflicts, conflict]
  })),

  resolveLockConflict: (conflictId) => set((state) => ({
    lockConflicts: state.lockConflicts.filter(c => c.id !== conflictId)
  })),

  clearLockConflicts: () => set(() => ({
    lockConflicts: []
  })),

  // Selectors
  isLocked: (componentId) => {
    const state = get();
    return !!state.locks[componentId];
  },

  getLock: (componentId) => {
    const state = get();
    return state.locks[componentId];
  },

  getLockedComponents: () => {
    const state = get();
    return Object.keys(state.locks);
  },

  hasConflicts: () => {
    const state = get();
    return state.lockConflicts.length > 0;
  }
});