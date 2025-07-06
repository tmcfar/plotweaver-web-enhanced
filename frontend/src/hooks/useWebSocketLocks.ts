import { useEffect, useCallback, useRef } from 'react';
import { useEnhancedWebSocket } from './useWebSocket';
import { useLockStore } from '../lib/store/lockStore';
import { ComponentLock, LockConflict } from '../lib/api/locks';

interface WebSocketLockMessage {
  channel: string;
  data: {
    componentId: string;
    lock: ComponentLock | null;
    timestamp: string;
    userId?: string;
  };
}

interface WebSocketConflictMessage {
  channel: string;
  data: LockConflict;
}

interface WebSocketSyncMessage {
  channel: string;
  data: {
    locks: Record<string, ComponentLock>;
    conflicts: LockConflict[];
    timestamp: string;
  };
}

export const useWebSocketLocks = (projectId: string) => {
  const { connectionStatus, subscribe, unsubscribe, send } = useEnhancedWebSocket(projectId);
  const {
    updateLock,
    removeLock,
    addConflict,
    removeConflict,
    setLocks,
    setWebsocketStatus,
    updateLastSync,
    addError,
    optimisticOperations,
  } = useLockStore();

  const lastSyncRef = useRef<Date | null>(null);
  const reconnectCountRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle connection status changes
  useEffect(() => {
    setWebsocketStatus(connectionStatus);

    if (connectionStatus === 'connected') {
      reconnectCountRef.current = 0;
      // Request full sync after reconnection
      requestFullSync();
    } else if (connectionStatus === 'reconnecting') {
      reconnectCountRef.current++;
      if (reconnectCountRef.current > 3) {
        addError({
          message: 'Multiple reconnection attempts failed',
          type: 'network',
        });
      }
    }
  }, [connectionStatus, setWebsocketStatus, addError]);

  // Request full synchronization with server
  const requestFullSync = useCallback(() => {
    if (connectionStatus === 'connected') {
      send(`sync-request:${projectId}`, {
        lastSync: lastSyncRef.current?.toISOString(),
        pendingOperations: optimisticOperations.length,
      });

      // Set timeout for sync response
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        addError({
          message: 'Sync timeout - server may be unavailable',
          type: 'network',
        });
      }, 10000);
    }
  }, [connectionStatus, projectId, send, optimisticOperations.length, addError]);

  // Handle lock updates from other clients
  const handleLockUpdate = useCallback((message: WebSocketLockMessage) => {
    const { componentId, lock, userId } = message.data;
    
    // Skip updates from our own optimistic operations
    const isOwnOperation = optimisticOperations.some(op =>
      op.componentIds.includes(componentId) &&
      new Date().getTime() - op.timestamp.getTime() < 5000 // Within 5 seconds
    );

    if (isOwnOperation) {
      return;
    }

    if (lock) {
      updateLock(componentId, lock);
    } else {
      removeLock(componentId);
    }

    // Show notification for external changes
    if (userId && userId !== 'current-user') { // TODO: Get actual current user ID
      // Could dispatch a notification here
      console.log(`Lock updated by ${userId}: ${componentId}`);
    }
  }, [updateLock, removeLock, optimisticOperations]);

  // Handle conflict notifications
  const handleConflictNotification = useCallback((message: WebSocketConflictMessage) => {
    const conflict = message.data;
    addConflict(conflict);
    
    // Show urgent notification for conflicts
    addError({
      message: `Lock conflict detected on ${conflict.componentId}`,
      componentId: conflict.componentId,
      type: 'conflict',
    });
  }, [addConflict, addError]);

  // Handle conflict resolutions
  const handleConflictResolution = useCallback((message: any) => {
    const { conflictId, resolution } = message.data;
    removeConflict(conflictId);
    
    console.log(`Conflict ${conflictId} resolved:`, resolution);
  }, [removeConflict]);

  // Handle full sync response
  const handleSyncResponse = useCallback((message: WebSocketSyncMessage) => {
    const { locks, conflicts, timestamp } = message.data;
    
    // Clear sync timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    // Update state with server data
    setLocks(locks);
    
    // Clear existing conflicts and add new ones
    // Note: This is a simplification - in a real app you'd merge more carefully
    conflicts.forEach(conflict => addConflict(conflict));
    
    lastSyncRef.current = new Date(timestamp);
    updateLastSync();
    
    console.log(`Synchronized ${Object.keys(locks).length} locks and ${conflicts.length} conflicts`);
  }, [setLocks, addConflict, updateLastSync]);

  // Handle user presence updates
  const handlePresenceUpdate = useCallback((message: any) => {
    const { users, activeComponents } = message.data;
    
    // Could update a presence store here
    console.log('Active users:', users, 'Active components:', activeComponents);
  }, []);

  // Handle permission changes
  const handlePermissionChange = useCallback((message: any) => {
    const { componentId, permissions, userId } = message.data;
    
    // Update local permissions
    console.log(`Permissions changed for ${componentId} by ${userId}:`, permissions);
    
    // Could trigger a re-evaluation of lock capabilities
    requestFullSync();
  }, [requestFullSync]);

  // Set up WebSocket subscriptions
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const channels = {
      [`locks:${projectId}`]: handleLockUpdate,
      [`conflicts:${projectId}`]: handleConflictNotification,
      [`conflict-resolutions:${projectId}`]: handleConflictResolution,
      [`sync-response:${projectId}`]: handleSyncResponse,
      [`presence:${projectId}`]: handlePresenceUpdate,
      [`permissions:${projectId}`]: handlePermissionChange,
    };

    // Subscribe to all channels
    Object.entries(channels).forEach(([channel, handler]) => {
      subscribe(channel, handler);
    });

    // Send initial subscription message
    send(`subscribe:${projectId}`, {
      channels: Object.keys(channels),
      timestamp: new Date().toISOString(),
    });

    // Set up periodic sync
    const syncInterval = setInterval(() => {
      // Only sync if we have no pending operations
      if (optimisticOperations.length === 0) {
        requestFullSync();
      }
    }, 30000); // Every 30 seconds

    return () => {
      // Unsubscribe from all channels
      Object.keys(channels).forEach(channel => {
        unsubscribe(channel);
      });
      
      clearInterval(syncInterval);
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    connectionStatus,
    projectId,
    subscribe,
    unsubscribe,
    send,
    handleLockUpdate,
    handleConflictNotification,
    handleConflictResolution,
    handleSyncResponse,
    handlePresenceUpdate,
    handlePermissionChange,
    optimisticOperations.length,
    requestFullSync,
  ]);

  // Broadcast local changes to other clients
  const broadcastLockUpdate = useCallback((componentId: string, lock: ComponentLock | null) => {
    if (connectionStatus === 'connected') {
      send(`lock-update:${projectId}`, {
        componentId,
        lock,
        timestamp: new Date().toISOString(),
        userId: 'current-user', // TODO: Get actual user ID
      });
    }
  }, [connectionStatus, projectId, send]);

  const broadcastConflictResolution = useCallback((conflictId: string, resolution: any) => {
    if (connectionStatus === 'connected') {
      send(`conflict-resolution:${projectId}`, {
        conflictId,
        resolution,
        timestamp: new Date().toISOString(),
        userId: 'current-user', // TODO: Get actual user ID
      });
    }
  }, [connectionStatus, projectId, send]);

  // Handle page visibility changes for efficient syncing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && connectionStatus === 'connected') {
        // Page became visible, sync with server
        requestFullSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectionStatus, requestFullSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionStatus,
    broadcastLockUpdate,
    broadcastConflictResolution,
    requestFullSync,
    isOnline: connectionStatus === 'connected',
    reconnectCount: reconnectCountRef.current,
  };
};