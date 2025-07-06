import { useCallback, useRef } from 'react';
import { useLockStore, OptimisticOperation } from '../store/lockStore';
import { lockAPI, ComponentLock, BulkLockOperation } from '../api/locks';

interface OptimisticLockHook {
  updateLock: (componentId: string, lock: ComponentLock) => Promise<void>;
  removeLock: (componentId: string) => Promise<void>;
  bulkUpdateLocks: (operations: BulkLockOperation[]) => Promise<void>;
  isUpdating: boolean;
  hasErrors: boolean;
  retryFailedOperations: () => Promise<void>;
}

export const useOptimisticLocks = (projectId: string): OptimisticLockHook => {
  const {
    locks,
    updateLock: updateLockInStore,
    removeLock: removeLockFromStore,
    bulkUpdateLocks: bulkUpdateLocksInStore,
    addOptimisticOperation,
    confirmOptimisticOperation,
    rollbackOptimisticOperation,
    setLoading,
    addError,
    globalLoading,
    hasErrors,
    optimisticOperations,
  } = useLockStore();

  const operationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique operation ID
  const generateOperationId = () => `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Cleanup operation timeout
  const clearOperationTimeout = (operationId: string) => {
    const timeout = operationTimeouts.current.get(operationId);
    if (timeout) {
      clearTimeout(timeout);
      operationTimeouts.current.delete(operationId);
    }
  };

  // Set operation timeout for automatic rollback
  const setOperationTimeout = (operationId: string, timeoutMs: number = 10000) => {
    const timeout = setTimeout(() => {
      addError({
        message: 'Operation timed out',
        componentId: operationId,
        type: 'network',
      });
      rollbackOptimisticOperation(operationId);
      clearOperationTimeout(operationId);
    }, timeoutMs);
    
    operationTimeouts.current.set(operationId, timeout);
  };

  const updateLock = useCallback(
    async (componentId: string, lock: ComponentLock) => {
      const operationId = generateOperationId();
      const originalLock = locks[componentId] || null;

      try {
        // Create optimistic operation
        const operation: OptimisticOperation = {
          id: operationId,
          type: 'lock',
          componentIds: [componentId],
          timestamp: new Date(),
          originalState: { [componentId]: originalLock },
        };

        // Apply optimistic update
        addOptimisticOperation(operation);
        updateLockInStore(componentId, lock);
        setLoading(componentId, true);
        setOperationTimeout(operationId);

        // Make API call
        await lockAPI.updateLock(projectId, componentId, lock);

        // Confirm operation on success
        confirmOptimisticOperation(operationId);
        clearOperationTimeout(operationId);
      } catch (error) {
        // Rollback on error
        rollbackOptimisticOperation(operationId);
        clearOperationTimeout(operationId);
        
        addError({
          message: error instanceof Error ? error.message : 'Failed to update lock',
          componentId,
          type: 'network',
        });
        
        throw error;
      } finally {
        setLoading(componentId, false);
      }
    },
    [
      projectId,
      locks,
      updateLockInStore,
      addOptimisticOperation,
      confirmOptimisticOperation,
      rollbackOptimisticOperation,
      setLoading,
      addError,
    ]
  );

  const removeLock = useCallback(
    async (componentId: string) => {
      const operationId = generateOperationId();
      const originalLock = locks[componentId] || null;

      if (!originalLock) {
        // Nothing to remove
        return;
      }

      try {
        // Create optimistic operation
        const operation: OptimisticOperation = {
          id: operationId,
          type: 'unlock',
          componentIds: [componentId],
          timestamp: new Date(),
          originalState: { [componentId]: originalLock },
        };

        // Apply optimistic update
        addOptimisticOperation(operation);
        removeLockFromStore(componentId);
        setLoading(componentId, true);
        setOperationTimeout(operationId);

        // Make API call to remove lock
        await lockAPI.updateLock(projectId, componentId, {
          ...originalLock,
          level: null as any, // Signal removal
        });

        // Confirm operation on success
        confirmOptimisticOperation(operationId);
        clearOperationTimeout(operationId);
      } catch (error) {
        // Rollback on error
        rollbackOptimisticOperation(operationId);
        clearOperationTimeout(operationId);
        
        addError({
          message: error instanceof Error ? error.message : 'Failed to remove lock',
          componentId,
          type: 'network',
        });
        
        throw error;
      } finally {
        setLoading(componentId, false);
      }
    },
    [
      projectId,
      locks,
      removeLockFromStore,
      addOptimisticOperation,
      confirmOptimisticOperation,
      rollbackOptimisticOperation,
      setLoading,
      addError,
    ]
  );

  const bulkUpdateLocks = useCallback(
    async (operations: BulkLockOperation[]) => {
      const operationId = generateOperationId();
      const affectedComponentIds = operations.flatMap(op => op.componentIds);
      const originalState: Record<string, ComponentLock | null> = {};

      // Capture original state
      affectedComponentIds.forEach(componentId => {
        originalState[componentId] = locks[componentId] || null;
      });

      try {
        // Create optimistic operation
        const optimisticOp: OptimisticOperation = {
          id: operationId,
          type: 'bulk',
          componentIds: affectedComponentIds,
          timestamp: new Date(),
          originalState,
        };

        // Apply optimistic update
        addOptimisticOperation(optimisticOp);
        bulkUpdateLocksInStore(operations);
        
        // Set loading for all affected components
        affectedComponentIds.forEach(componentId => {
          setLoading(componentId, true);
        });
        
        setOperationTimeout(operationId, 15000); // Longer timeout for bulk operations

        // Make API call
        await lockAPI.bulkUpdateLocks(projectId, operations);

        // Confirm operation on success
        confirmOptimisticOperation(operationId);
        clearOperationTimeout(operationId);
      } catch (error) {
        // Rollback on error
        rollbackOptimisticOperation(operationId);
        clearOperationTimeout(operationId);
        
        addError({
          message: error instanceof Error ? error.message : 'Failed to bulk update locks',
          type: 'network',
        });
        
        throw error;
      } finally {
        // Clear loading for all affected components
        affectedComponentIds.forEach(componentId => {
          setLoading(componentId, false);
        });
      }
    },
    [
      projectId,
      locks,
      bulkUpdateLocksInStore,
      addOptimisticOperation,
      confirmOptimisticOperation,
      rollbackOptimisticOperation,
      setLoading,
      addError,
    ]
  );

  const retryFailedOperations = useCallback(async () => {
    // Retry operations that have been pending too long
    const now = new Date();
    const staleOperations = optimisticOperations.filter(
      op => now.getTime() - op.timestamp.getTime() > 30000 // 30 seconds
    );

    for (const operation of staleOperations) {
      console.warn(`Retrying stale operation: ${operation.id}`);
      
      try {
        if (operation.type === 'lock' && operation.componentIds.length === 1) {
          const componentId = operation.componentIds[0];
          const currentLock = locks[componentId];
          if (currentLock) {
            await lockAPI.updateLock(projectId, componentId, currentLock);
          }
        } else if (operation.type === 'bulk') {
          // For bulk operations, we'd need to reconstruct the original operations
          // This is complex, so for now we'll just rollback
          rollbackOptimisticOperation(operation.id);
        }
        
        confirmOptimisticOperation(operation.id);
      } catch (error) {
        rollbackOptimisticOperation(operation.id);
        addError({
          message: 'Failed to retry operation',
          type: 'network',
        });
      }
    }
  }, [optimisticOperations, locks, projectId, rollbackOptimisticOperation, confirmOptimisticOperation, addError]);

  const isUpdating = globalLoading || optimisticOperations.length > 0;

  return {
    updateLock,
    removeLock,
    bulkUpdateLocks,
    isUpdating,
    hasErrors: hasErrors(),
    retryFailedOperations,
  };
};