// src/hooks/performance/useOptimisticUpdates.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLockStore } from '../useLockStore';
import { useNotifications } from '../../components/notifications/NotificationProvider';

interface OptimisticOperation {
  id: string;
  type: 'lock' | 'unlock' | 'update';
  componentId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  promise?: Promise<any>;
}

interface OptimisticUpdatesConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  enableBatching: boolean;
  batchDelay: number;
}

const DEFAULT_CONFIG: OptimisticUpdatesConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 10000,
  enableBatching: true,
  batchDelay: 100
};

export interface UseOptimisticUpdatesReturn {
  pendingOperations: OptimisticOperation[];
  performOptimisticUpdate: (operation: Omit<OptimisticOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  rollbackOperation: (operationId: string) => void;
  clearPendingOperations: () => void;
  isOperationPending: (componentId: string) => boolean;
  getOperationById: (operationId: string) => OptimisticOperation | undefined;
}

export const useOptimisticUpdates = (
  projectId: string,
  config: Partial<OptimisticUpdatesConfig> = {}
): UseOptimisticUpdatesReturn => {
  const [pendingOperations, setPendingOperations] = useState<OptimisticOperation[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout>();
  const batchedOperations = useRef<OptimisticOperation[]>([]);
  
  const { updateLock, removeLock, locks } = useLockStore(projectId);
  const { addNotification } = useNotifications();
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  const generateOperationId = useCallback(() => {
    return `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const rollbackOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => {
      const operation = prev.find(op => op.id === operationId);
      if (!operation) return prev;

      // Rollback the optimistic change
      switch (operation.type) {
        case 'lock':
        case 'update':
          // Remove the optimistically added/updated lock
          removeLock(operation.componentId);
          break;
        case 'unlock':
          // Restore the lock that was optimistically removed
          if (operation.data) {
            updateLock(operation.componentId, operation.data);
          }
          break;
      }

      return prev.filter(op => op.id !== operationId);
    });
  }, [updateLock, removeLock]);

  const executeServerOperation = useCallback(async (operation: OptimisticOperation): Promise<void> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), finalConfig.timeout);

    try {
      let response: Response;
      const endpoint = `/api/projects/${projectId}/locks/${operation.componentId}`;

      switch (operation.type) {
        case 'lock':
        case 'update':
          response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(operation.data),
            signal: controller.signal
          });
          break;
        case 'unlock':
          response = await fetch(endpoint, {
            method: 'DELETE',
            signal: controller.signal
          });
          break;
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Operation succeeded, remove from pending
      setPendingOperations(prev => prev.filter(op => op.id !== operation.id));

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Operation timed out');
      }
      
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }, [projectId, finalConfig.timeout]);

  const retryOperation = useCallback(async (operation: OptimisticOperation): Promise<void> => {
    if (operation.retryCount >= finalConfig.maxRetries) {
      rollbackOperation(operation.id);
      
      addNotification({
        type: 'error',
        title: 'Operation Failed',
        message: `Failed to ${operation.type} component after ${finalConfig.maxRetries} attempts`,
        actions: [
          {
            label: 'Retry',
            action: () => {
              // Reset retry count and try again
              setPendingOperations(prev => 
                prev.map(op => 
                  op.id === operation.id 
                    ? { ...op, retryCount: 0 }
                    : op
                )
              );
            }
          }
        ]
      });
      return;
    }

    // Exponential backoff
    const delay = finalConfig.retryDelay * Math.pow(2, operation.retryCount);
    
    setTimeout(async () => {
      try {
        setPendingOperations(prev => 
          prev.map(op => 
            op.id === operation.id 
              ? { ...op, retryCount: op.retryCount + 1 }
              : op
          )
        );
        
        await executeServerOperation(operation);
      } catch (error) {
        console.error(`Retry ${operation.retryCount + 1} failed:`, error);
        await retryOperation({
          ...operation,
          retryCount: operation.retryCount + 1
        });
      }
    }, delay);
  }, [finalConfig.maxRetries, finalConfig.retryDelay, executeServerOperation, rollbackOperation, addNotification]);

  const processBatch = useCallback(async () => {
    if (batchedOperations.current.length === 0) return;

    const batch = [...batchedOperations.current];
    batchedOperations.current = [];

    // Group operations by type for potential batch API calls
    const groupedOps = batch.reduce((groups, op) => {
      const key = op.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(op);
      return groups;
    }, {} as Record<string, OptimisticOperation[]>);

    // Process each group
    for (const [type, operations] of Object.entries(groupedOps)) {
      if (operations.length === 1) {
        // Single operation
        const operation = operations[0];
        try {
          await executeServerOperation(operation);
        } catch (error) {
          console.error(`Operation failed:`, error);
          await retryOperation(operation);
        }
      } else {
        // Multiple operations - could implement batch API call here
        // For now, process individually
        for (const operation of operations) {
          try {
            await executeServerOperation(operation);
          } catch (error) {
            console.error(`Batch operation failed:`, error);
            await retryOperation(operation);
          }
        }
      }
    }
  }, [executeServerOperation, retryOperation]);

  const scheduleOperation = useCallback((operation: OptimisticOperation) => {
    if (finalConfig.enableBatching) {
      batchedOperations.current.push(operation);
      
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      
      batchTimeoutRef.current = setTimeout(processBatch, finalConfig.batchDelay);
    } else {
      // Execute immediately
      executeServerOperation(operation).catch(error => {
        console.error('Immediate operation failed:', error);
        retryOperation(operation);
      });
    }
  }, [finalConfig.enableBatching, finalConfig.batchDelay, processBatch, executeServerOperation, retryOperation]);

  const performOptimisticUpdate = useCallback(async (
    operationData: Omit<OptimisticOperation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> => {
    const operation: OptimisticOperation = {
      ...operationData,
      id: generateOperationId(),
      timestamp: Date.now(),
      retryCount: 0
    };

    // Apply optimistic update immediately
    switch (operation.type) {
      case 'lock':
      case 'update':
        updateLock(operation.componentId, operation.data);
        break;
      case 'unlock':
        // Store current lock state for potential rollback
        operation.data = locks[operation.componentId];
        removeLock(operation.componentId);
        break;
    }

    // Add to pending operations
    setPendingOperations(prev => [...prev, operation]);

    // Schedule server operation
    scheduleOperation(operation);

    // Add success notification for immediate feedback
    addNotification({
      type: 'info',
      title: 'Updating...',
      message: `${operation.type === 'lock' ? 'Locking' : operation.type === 'unlock' ? 'Unlocking' : 'Updating'} component`,
      autoHide: true,
      duration: 2000
    });

  }, [generateOperationId, updateLock, removeLock, locks, scheduleOperation, addNotification]);

  const clearPendingOperations = useCallback(() => {
    setPendingOperations([]);
    batchedOperations.current = [];
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }
  }, []);

  const isOperationPending = useCallback((componentId: string): boolean => {
    return pendingOperations.some(op => op.componentId === componentId);
  }, [pendingOperations]);

  const getOperationById = useCallback((operationId: string): OptimisticOperation | undefined => {
    return pendingOperations.find(op => op.id === operationId);
  }, [pendingOperations]);

  return {
    pendingOperations,
    performOptimisticUpdate,
    rollbackOperation,
    clearPendingOperations,
    isOperationPending,
    getOperationById
  };
};