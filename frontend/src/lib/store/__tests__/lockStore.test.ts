import { useLockStore } from '../lockStore';
import { ComponentLock, LockConflict, ConflictResolution, BulkLockOperation } from '../../api/locks';

describe('lockStore', () => {
  // Reset store state before each test
  beforeEach(() => {
    useLockStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useLockStore.getState();
      
      expect(state.locks).toEqual({});
      expect(state.conflicts).toEqual([]);
      expect(state.loadingStates).toEqual({});
      expect(state.globalLoading).toBe(false);
      expect(state.errors).toEqual([]);
      expect(state.optimisticOperations).toEqual([]);
      expect(state.websocketStatus).toBe('disconnected');
      expect(state.lastSync).toBeNull();
      expect(state.cacheTimestamp).toBeNull();
      expect(state.invalidationKeys).toEqual(new Set());
    });
  });

  describe('Lock Management', () => {
    const mockLock: ComponentLock = {
      id: 'lock-1',
      componentId: 'comp-1',
      componentType: 'component',
      level: 'hard',
      type: 'personal',
      reason: 'Testing',
      lockedBy: 'user-1',
      lockedAt: new Date().toISOString(),
      canOverride: true
    };

    it('should set locks', () => {
      const { setLocks } = useLockStore.getState();
      const locks = { 'comp-1': mockLock };
      
      setLocks(locks);
      
      const state = useLockStore.getState();
      expect(state.locks).toEqual(locks);
      expect(state.cacheTimestamp).toBeInstanceOf(Date);
    });

    it('should update a single lock', () => {
      const { updateLock } = useLockStore.getState();
      
      updateLock('comp-1', mockLock);
      
      const state = useLockStore.getState();
      expect(state.locks['comp-1']).toEqual(mockLock);
      expect(state.cacheTimestamp).toBeInstanceOf(Date);
    });

    it('should remove a lock', () => {
      const { setLocks, removeLock } = useLockStore.getState();
      
      // First add some locks
      setLocks({
        'comp-1': mockLock,
        'comp-2': { ...mockLock, id: 'lock-2', componentId: 'comp-2' }
      });
      
      // Then remove one
      removeLock('comp-1');
      
      const state = useLockStore.getState();
      expect(state.locks['comp-1']).toBeUndefined();
      expect(state.locks['comp-2']).toBeDefined();
    });

    it('should handle bulk lock operations', () => {
      const { bulkUpdateLocks } = useLockStore.getState();
      
      const operations: BulkLockOperation[] = [
        {
          type: 'lock',
          componentIds: ['comp-1', 'comp-2'],
          lockLevel: 'soft',
          reason: 'Bulk lock test'
        },
        {
          type: 'unlock',
          componentIds: ['comp-3'],
          reason: 'Bulk unlock test'
        }
      ];
      
      // Add comp-3 first so we can unlock it
      useLockStore.setState({
        locks: { 'comp-3': mockLock }
      });
      
      bulkUpdateLocks(operations);
      
      const state = useLockStore.getState();
      expect(state.locks['comp-1']).toBeDefined();
      expect(state.locks['comp-1'].level).toBe('soft');
      expect(state.locks['comp-2']).toBeDefined();
      expect(state.locks['comp-3']).toBeUndefined();
    });
  });

  describe('Optimistic Operations', () => {
    it('should add optimistic operation', () => {
      const { addOptimisticOperation } = useLockStore.getState();
      
      const operation = {
        id: 'op-1',
        type: 'lock' as const,
        componentIds: ['comp-1'],
        timestamp: new Date(),
        originalState: {}
      };
      
      addOptimisticOperation(operation);
      
      const state = useLockStore.getState();
      expect(state.optimisticOperations).toHaveLength(1);
      expect(state.optimisticOperations[0]).toEqual(operation);
    });

    it('should confirm optimistic operation', () => {
      const { addOptimisticOperation, confirmOptimisticOperation } = useLockStore.getState();
      
      const operation = {
        id: 'op-1',
        type: 'lock' as const,
        componentIds: ['comp-1'],
        timestamp: new Date(),
        originalState: {}
      };
      
      addOptimisticOperation(operation);
      confirmOptimisticOperation('op-1');
      
      const state = useLockStore.getState();
      expect(state.optimisticOperations).toHaveLength(0);
    });

    it('should rollback optimistic operation', () => {
      const { addOptimisticOperation, rollbackOptimisticOperation, updateLock } = useLockStore.getState();
      
      const originalLock: ComponentLock = {
        id: 'lock-1',
        componentId: 'comp-1',
        componentType: 'component',
        level: 'soft',
        type: 'personal',
        reason: 'Original',
        lockedBy: 'user-1',
        lockedAt: new Date().toISOString()
      };
      
      // Set up initial state
      updateLock('comp-1', originalLock);
      
      const operation = {
        id: 'op-1',
        type: 'lock' as const,
        componentIds: ['comp-1'],
        timestamp: new Date(),
        originalState: { 'comp-1': originalLock }
      };
      
      // Add operation and change lock
      addOptimisticOperation(operation);
      updateLock('comp-1', { ...originalLock, level: 'hard' });
      
      // Rollback
      rollbackOptimisticOperation('op-1');
      
      const state = useLockStore.getState();
      expect(state.locks['comp-1'].level).toBe('soft');
      expect(state.optimisticOperations).toHaveLength(0);
    });
  });

  describe('Conflict Management', () => {
    const mockConflict: LockConflict = {
      id: 'conflict-1',
      componentId: 'comp-1',
      componentType: 'component',
      type: 'lock_override',
      description: 'Lock override conflict',
      currentState: {},
      conflictingState: {},
      priority: 'high',
      affectedUsers: ['user-1', 'user-2'],
      lockedBy: 'user-2',
      lockLevel: 'hard',
      createdAt: new Date().toISOString()
    };

    it('should add conflict', () => {
      const { addConflict } = useLockStore.getState();
      
      addConflict(mockConflict);
      
      const state = useLockStore.getState();
      expect(state.conflicts).toHaveLength(1);
      expect(state.conflicts[0]).toEqual(mockConflict);
    });

    it('should resolve conflict', () => {
      const { addConflict, resolveConflict } = useLockStore.getState();
      
      addConflict(mockConflict);
      
      const resolution: ConflictResolution = {
        type: 'keep_current',
        reason: 'Keeping current state'
      };
      
      resolveConflict('conflict-1', resolution);
      
      const state = useLockStore.getState();
      expect(state.conflicts).toHaveLength(0);
    });

    it('should remove conflict', () => {
      const { addConflict, removeConflict } = useLockStore.getState();
      
      addConflict(mockConflict);
      removeConflict('conflict-1');
      
      const state = useLockStore.getState();
      expect(state.conflicts).toHaveLength(0);
    });

    it('should clear all conflicts', () => {
      const { addConflict, clearConflicts } = useLockStore.getState();
      
      addConflict(mockConflict);
      addConflict({ ...mockConflict, id: 'conflict-2' });
      
      clearConflicts();
      
      const state = useLockStore.getState();
      expect(state.conflicts).toHaveLength(0);
    });
  });

  describe('Loading States', () => {
    it('should set component loading state', () => {
      const { setLoading } = useLockStore.getState();
      
      setLoading('comp-1', true);
      
      const state = useLockStore.getState();
      expect(state.loadingStates['comp-1']).toBe(true);
    });

    it('should set global loading state', () => {
      const { setGlobalLoading } = useLockStore.getState();
      
      setGlobalLoading(true);
      
      const state = useLockStore.getState();
      expect(state.globalLoading).toBe(true);
    });

    it('should clear all loading states', () => {
      const { setLoading, setGlobalLoading, clearLoading } = useLockStore.getState();
      
      setLoading('comp-1', true);
      setGlobalLoading(true);
      
      clearLoading();
      
      const state = useLockStore.getState();
      expect(state.loadingStates).toEqual({});
      expect(state.globalLoading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should add error', () => {
      const { addError } = useLockStore.getState();
      
      addError({
        message: 'Test error',
        type: 'network',
        componentId: 'comp-1'
      });
      
      const state = useLockStore.getState();
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0]).toMatchObject({
        message: 'Test error',
        type: 'network',
        componentId: 'comp-1',
        id: expect.stringMatching(/^error-/),
        timestamp: expect.any(Date)
      });
    });

    it('should remove error', () => {
      const { addError, removeError } = useLockStore.getState();
      
      addError({ message: 'Test error', type: 'network' });
      const { errors } = useLockStore.getState();
      const errorId = errors[0].id;
      
      removeError(errorId);
      
      const state = useLockStore.getState();
      expect(state.errors).toHaveLength(0);
    });

    it('should clear all errors', () => {
      const { addError, clearErrors } = useLockStore.getState();
      
      addError({ message: 'Error 1', type: 'network' });
      addError({ message: 'Error 2', type: 'validation' });
      
      clearErrors();
      
      const state = useLockStore.getState();
      expect(state.errors).toHaveLength(0);
    });
  });

  describe('WebSocket Management', () => {
    it('should set websocket status', () => {
      const { setWebsocketStatus } = useLockStore.getState();
      
      setWebsocketStatus('connected');
      
      const state = useLockStore.getState();
      expect(state.websocketStatus).toBe('connected');
    });

    it('should update last sync timestamp', () => {
      const { updateLastSync } = useLockStore.getState();
      
      updateLastSync();
      
      const state = useLockStore.getState();
      expect(state.lastSync).toBeInstanceOf(Date);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate specific cache key', () => {
      const { invalidateCache } = useLockStore.getState();
      
      invalidateCache('test-key');
      
      const state = useLockStore.getState();
      expect(state.invalidationKeys.has('test-key')).toBe(true);
    });

    it('should invalidate all cache', () => {
      const { invalidateCache, updateCacheTimestamp } = useLockStore.getState();
      
      updateCacheTimestamp();
      invalidateCache();
      
      const state = useLockStore.getState();
      expect(state.cacheTimestamp).toBeNull();
      expect(state.invalidationKeys.size).toBe(0);
    });

    it('should update cache timestamp', () => {
      const { updateCacheTimestamp } = useLockStore.getState();
      
      updateCacheTimestamp();
      
      const state = useLockStore.getState();
      expect(state.cacheTimestamp).toBeInstanceOf(Date);
    });
  });

  describe('Computed Selectors', () => {
    const mockLock: ComponentLock = {
      id: 'lock-1',
      componentId: 'comp-1',
      componentType: 'component',
      level: 'hard',
      type: 'personal',
      reason: 'Testing',
      lockedBy: 'user-1',
      lockedAt: new Date().toISOString()
    };

    it('should get lock for component', () => {
      const { updateLock, getLocksForComponent } = useLockStore.getState();
      
      updateLock('comp-1', mockLock);
      
      const lock = getLocksForComponent('comp-1');
      expect(lock).toEqual(mockLock);
      
      const noLock = getLocksForComponent('comp-2');
      expect(noLock).toBeNull();
    });

    it('should get conflicts for component', () => {
      const { addConflict, getConflictsForComponent } = useLockStore.getState();
      
      const conflict: LockConflict = {
        id: 'conflict-1',
        componentId: 'comp-1',
        componentType: 'component',
        type: 'lock_override',
        description: 'Test conflict',
        currentState: {},
        conflictingState: {},
        priority: 'high',
        affectedUsers: ['user-1'],
        lockedBy: 'user-1',
        lockLevel: 'hard',
        createdAt: new Date().toISOString()
      };
      
      addConflict(conflict);
      
      const conflicts = getConflictsForComponent('comp-1');
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toEqual(conflict);
    });

    it('should check if component is loading', () => {
      const { setLoading, isComponentLoading } = useLockStore.getState();
      
      setLoading('comp-1', true);
      
      expect(isComponentLoading('comp-1')).toBe(true);
      expect(isComponentLoading('comp-2')).toBe(false);
    });

    it('should check if store has errors', () => {
      const { addError, hasErrors } = useLockStore.getState();
      
      expect(hasErrors()).toBe(false);
      
      addError({ message: 'Test error', type: 'network' });
      
      expect(hasErrors()).toBe(true);
    });

    it('should get errors for component', () => {
      const { addError, getErrorsForComponent } = useLockStore.getState();
      
      addError({ message: 'Error 1', type: 'network', componentId: 'comp-1' });
      addError({ message: 'Error 2', type: 'validation', componentId: 'comp-2' });
      
      const errors = getErrorsForComponent('comp-1');
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Error 1');
    });

    it('should check if optimistic operation is pending', () => {
      const { addOptimisticOperation, isOptimisticOperationPending } = useLockStore.getState();
      
      const operation = {
        id: 'op-1',
        type: 'lock' as const,
        componentIds: ['comp-1', 'comp-2'],
        timestamp: new Date(),
        originalState: {}
      };
      
      addOptimisticOperation(operation);
      
      expect(isOptimisticOperationPending('comp-1')).toBe(true);
      expect(isOptimisticOperationPending('comp-3')).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    it('should batch multiple updates', () => {
      const { batchUpdate, updateLock, addError } = useLockStore.getState();
      
      const updates = [
        () => updateLock('comp-1', {
          id: 'lock-1',
          componentId: 'comp-1',
          componentType: 'component',
          level: 'hard',
          type: 'personal',
          reason: 'Batch test',
          lockedBy: 'user-1',
          lockedAt: new Date().toISOString()
        }),
        () => addError({ message: 'Batch error', type: 'network' })
      ];
      
      batchUpdate(updates);
      
      const state = useLockStore.getState();
      expect(state.locks['comp-1']).toBeDefined();
      expect(state.errors).toHaveLength(1);
    });

    it('should reset store to initial state', () => {
      const { updateLock, addError, addConflict, reset } = useLockStore.getState();
      
      // Add some data
      updateLock('comp-1', {
        id: 'lock-1',
        componentId: 'comp-1',
        componentType: 'component',
        level: 'hard',
        type: 'personal',
        reason: 'Test',
        lockedBy: 'user-1',
        lockedAt: new Date().toISOString()
      });
      addError({ message: 'Test error', type: 'network' });
      addConflict({
        id: 'conflict-1',
        componentId: 'comp-1',
        componentType: 'component',
        type: 'lock_override',
        description: 'Test conflict',
        currentState: {},
        conflictingState: {},
        priority: 'high',
        affectedUsers: ['user-1'],
        lockedBy: 'user-1',
        lockLevel: 'hard',
        createdAt: new Date().toISOString()
      });
      
      reset();
      
      const state = useLockStore.getState();
      expect(state.locks).toEqual({});
      expect(state.conflicts).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.websocketStatus).toBe('disconnected');
    });
  });
});