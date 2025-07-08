import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { ComponentLock, LockConflict, ConflictResolution, BulkLockOperation } from '../api/locks';

export interface LockError {
  id: string;
  message: string;
  componentId?: string;
  timestamp: Date;
  type: 'network' | 'validation' | 'permission' | 'conflict';
}

export interface OptimisticOperation {
  id: string;
  type: 'lock' | 'unlock' | 'bulk';
  componentIds: string[];
  timestamp: Date;
  originalState: Record<string, ComponentLock | null>;
}

export interface LockState {
  // Core state
  locks: Record<string, ComponentLock>;
  conflicts: LockConflict[];
  
  // Loading states
  loadingStates: Record<string, boolean>;
  globalLoading: boolean;
  
  // Error handling
  errors: LockError[];
  
  // Optimistic updates
  optimisticOperations: OptimisticOperation[];
  
  // WebSocket state
  websocketStatus: 'connected' | 'disconnected' | 'reconnecting';
  lastSync: Date | null;
  
  // Cache metadata
  cacheTimestamp: Date | null;
  invalidationKeys: Set<string>;
}

export interface LockActions {
  // Lock management
  setLocks: (locks: Record<string, ComponentLock>) => void;
  updateLock: (componentId: string, lock: ComponentLock) => void;
  removeLock: (componentId: string) => void;
  bulkUpdateLocks: (operations: BulkLockOperation[]) => void;
  
  // Optimistic operations
  addOptimisticOperation: (operation: OptimisticOperation) => void;
  confirmOptimisticOperation: (operationId: string) => void;
  rollbackOptimisticOperation: (operationId: string) => void;
  clearOptimisticOperations: () => void;
  
  // Conflict management
  addConflict: (conflict: LockConflict) => void;
  resolveConflict: (conflictId: string, resolution: ConflictResolution) => void;
  removeConflict: (conflictId: string) => void;
  clearConflicts: () => void;
  
  // Loading states
  setLoading: (componentId: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  clearLoading: () => void;
  
  // Error handling
  addError: (error: Omit<LockError, 'id' | 'timestamp'>) => void;
  removeError: (errorId: string) => void;
  clearErrors: () => void;
  
  // WebSocket management
  setWebsocketStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  updateLastSync: () => void;
  
  // Cache management
  invalidateCache: (key?: string) => void;
  updateCacheTimestamp: () => void;
  
  // Computed selectors
  getLocksForComponent: (componentId: string) => ComponentLock | null;
  getConflictsForComponent: (componentId: string) => LockConflict[];
  isComponentLoading: (componentId: string) => boolean;
  hasErrors: () => boolean;
  getErrorsForComponent: (componentId: string) => LockError[];
  isOptimisticOperationPending: (componentId: string) => boolean;
  
  // Batch operations
  batchUpdate: (updates: Array<() => void>) => void;
  reset: () => void;
}

const initialState: LockState = {
  locks: {},
  conflicts: [],
  loadingStates: {},
  globalLoading: false,
  errors: [],
  optimisticOperations: [],
  websocketStatus: 'disconnected',
  lastSync: null,
  cacheTimestamp: null,
  invalidationKeys: new Set(),
};

export const useLockStore = create<LockState & LockActions>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        ...initialState,

        // Lock management
        setLocks: (locks) => 
          set({ locks, cacheTimestamp: new Date() }, false, 'setLocks'),

        updateLock: (componentId, lock) =>
          set(
            (state) => ({
              locks: { ...state.locks, [componentId]: lock },
              cacheTimestamp: new Date(),
            }),
            false,
            'updateLock'
          ),

        removeLock: (componentId) =>
          set(
            (state) => {
              const { [componentId]: removed, ...remaining } = state.locks;
              return {
                locks: remaining,
                cacheTimestamp: new Date(),
              };
            },
            false,
            'removeLock'
          ),

        bulkUpdateLocks: (operations) => {
          const state = get();
          const newLocks = { ...state.locks };
          
          operations.forEach((op) => {
            op.componentIds.forEach((componentId) => {
              if (op.type === 'lock' && op.lockLevel) {
                newLocks[componentId] = {
                  id: `lock-${Date.now()}-${componentId}`,
                  componentId,
                  componentType: 'component',
                  level: op.lockLevel,
                  type: 'personal',
                  reason: op.reason,
                  lockedBy: 'current-user', // TODO: Get from auth
                  lockedAt: new Date().toISOString(),
                  canOverride: true,
                };
              } else if (op.type === 'unlock') {
                delete newLocks[componentId];
              }
            });
          });
          
          set({ locks: newLocks, cacheTimestamp: new Date() }, false, 'bulkUpdateLocks');
        },

        // Optimistic operations
        addOptimisticOperation: (operation) =>
          set(
            (state) => ({
              optimisticOperations: [...state.optimisticOperations, operation],
            }),
            false,
            'addOptimisticOperation'
          ),

        confirmOptimisticOperation: (operationId) =>
          set(
            (state) => ({
              optimisticOperations: state.optimisticOperations.filter(
                (op) => op.id !== operationId
              ),
            }),
            false,
            'confirmOptimisticOperation'
          ),

        rollbackOptimisticOperation: (operationId) => {
          const state = get();
          const operation = state.optimisticOperations.find(op => op.id === operationId);
          
          if (operation) {
            set(
              (state) => ({
                locks: { ...state.locks, ...operation.originalState },
                optimisticOperations: state.optimisticOperations.filter(
                  (op) => op.id !== operationId
                ),
                cacheTimestamp: new Date(),
              }),
              false,
              'rollbackOptimisticOperation'
            );
          }
        },

        clearOptimisticOperations: () =>
          set({ optimisticOperations: [] }, false, 'clearOptimisticOperations'),

        // Conflict management
        addConflict: (conflict) =>
          set(
            (state) => ({
              conflicts: [...state.conflicts, conflict],
            }),
            false,
            'addConflict'
          ),

        resolveConflict: (conflictId, resolution) =>
          set(
            (state) => ({
              conflicts: state.conflicts.filter((c) => c.id !== conflictId),
            }),
            false,
            'resolveConflict'
          ),

        removeConflict: (conflictId) =>
          set(
            (state) => ({
              conflicts: state.conflicts.filter((c) => c.id !== conflictId),
            }),
            false,
            'removeConflict'
          ),

        clearConflicts: () =>
          set({ conflicts: [] }, false, 'clearConflicts'),

        // Loading states
        setLoading: (componentId, loading) =>
          set(
            (state) => ({
              loadingStates: { ...state.loadingStates, [componentId]: loading },
            }),
            false,
            'setLoading'
          ),

        setGlobalLoading: (globalLoading) =>
          set({ globalLoading }, false, 'setGlobalLoading'),

        clearLoading: () =>
          set({ loadingStates: {}, globalLoading: false }, false, 'clearLoading'),

        // Error handling
        addError: (error) =>
          set(
            (state) => ({
              errors: [
                ...state.errors,
                {
                  ...error,
                  id: `error-${Date.now()}-${Math.random()}`,
                  timestamp: new Date(),
                },
              ],
            }),
            false,
            'addError'
          ),

        removeError: (errorId) =>
          set(
            (state) => ({
              errors: state.errors.filter((e) => e.id !== errorId),
            }),
            false,
            'removeError'
          ),

        clearErrors: () =>
          set({ errors: [] }, false, 'clearErrors'),

        // WebSocket management
        setWebsocketStatus: (websocketStatus) =>
          set({ websocketStatus }, false, 'setWebsocketStatus'),

        updateLastSync: () =>
          set({ lastSync: new Date() }, false, 'updateLastSync'),

        // Cache management
        invalidateCache: (key) => {
          if (key) {
            set(
              (state) => ({
                invalidationKeys: new Set([...state.invalidationKeys, key]),
              }),
              false,
              'invalidateCache'
            );
          } else {
            set(
              {
                cacheTimestamp: null,
                invalidationKeys: new Set(),
              },
              false,
              'invalidateCacheAll'
            );
          }
        },

        updateCacheTimestamp: () =>
          set({ cacheTimestamp: new Date() }, false, 'updateCacheTimestamp'),

        // Computed selectors
        getLocksForComponent: (componentId) => {
          const state = get();
          return state.locks[componentId] || null;
        },

        getConflictsForComponent: (componentId) => {
          const state = get();
          return state.conflicts.filter((c) => c.componentId === componentId);
        },

        isComponentLoading: (componentId) => {
          const state = get();
          return Boolean(state.loadingStates[componentId]);
        },

        hasErrors: () => {
          const state = get();
          return state.errors.length > 0;
        },

        getErrorsForComponent: (componentId) => {
          const state = get();
          return state.errors.filter((e) => e.componentId === componentId);
        },

        isOptimisticOperationPending: (componentId) => {
          const state = get();
          return state.optimisticOperations.some((op) =>
            op.componentIds.includes(componentId)
          );
        },

        // Batch operations
        batchUpdate: (updates) => {
          updates.forEach((update) => update());
        },

        reset: () =>
          set(initialState, false, 'reset'),
      }),
      {
        name: 'plotweaver-lock-store',
        serialize: {
          options: {
            // Don't serialize functions and Date objects
            replacer: (key, value) => {
              if (value instanceof Date) {
                return { __type: 'Date', value: value.toISOString() };
              }
              if (value instanceof Set) {
                return { __type: 'Set', value: Array.from(value) };
              }
              return value;
            },
            reviver: (key, value) => {
              if (value && value.__type === 'Date') {
                return new Date(value.value);
              }
              if (value && value.__type === 'Set') {
                return new Set(value.value);
              }
              return value;
            },
          },
        },
      }
    )
  )
);

// Selector hooks for optimized re-renders
export const useLockStoreSelectors = () => ({
  // Component-specific selectors
  useComponentLock: (componentId: string) =>
    useLockStore((state) => state.locks[componentId]),
  
  useComponentLoading: (componentId: string) =>
    useLockStore((state) => state.loadingStates[componentId] || false),
  
  useComponentConflicts: (componentId: string) =>
    useLockStore((state) => state.conflicts.filter((c) => c.componentId === componentId)),
  
  useComponentErrors: (componentId: string) =>
    useLockStore((state) => state.errors.filter((e) => e.componentId === componentId)),
  
  // Global selectors
  useAllLocks: () => useLockStore((state) => state.locks),
  useAllConflicts: () => useLockStore((state) => state.conflicts),
  useGlobalLoading: () => useLockStore((state) => state.globalLoading),
  useWebsocketStatus: () => useLockStore((state) => state.websocketStatus),
  useHasErrors: () => useLockStore((state) => state.errors.length > 0),
  
  // Computed selectors
  useLockStats: () =>
    useLockStore((state) => {
      const locks = Object.values(state.locks);
      return {
        total: locks.length,
        soft: locks.filter((l) => l.level === 'soft').length,
        hard: locks.filter((l) => l.level === 'hard').length,
        frozen: locks.filter((l) => l.level === 'frozen').length,
        conflicts: state.conflicts.length,
      };
    }),
  
  useConflictsByPriority: () =>
    useLockStore((state) => {
      const conflicts = state.conflicts;
      return {
        critical: conflicts.filter((c) => c.priority === 'critical'),
        high: conflicts.filter((c) => c.priority === 'high'),
        medium: conflicts.filter((c) => c.priority === 'medium'),
        low: conflicts.filter((c) => c.priority === 'low'),
      };
    }),
});