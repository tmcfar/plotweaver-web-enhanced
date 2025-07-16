import { useState, useEffect, useCallback } from 'react';
import localforage from 'localforage';
import { toast } from 'sonner';
import { useWebSocket } from './useWebSocket';

interface OfflineChange {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete';
  entity: 'lock' | 'component' | 'scene' | 'project';
  data: any;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'conflict';
}

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge';
  resolver?: (local: any, remote: any) => any;
}

// Initialize localforage instance
const offlineStore = localforage.createInstance({
  name: 'plotweaver-offline',
  storeName: 'changes',
});

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingChanges, setPendingChanges] = useState<OfflineChange[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<OfflineChange[]>([]);
  const { sendMessage } = useWebSocket();


  const handleConflict = (localChange: OfflineChange, remoteData: any) => {
    const conflictChange = {
      ...localChange,
      syncStatus: 'conflict' as const,
      remoteData,
    };
    
    setConflicts(prev => [...prev, conflictChange]);
    toast.error('Sync conflict detected', {
      action: {
        label: 'Resolve',
        onClick: () => {
          // Will be handled by ConflictResolver component
        },
      },
    });
  };

  // Define syncChange before using it
  const syncChange = useCallback(async (change: OfflineChange) => {
    try {
      const response = await fetch(`/api/sync/${change.entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change,
          clientTimestamp: change.timestamp,
        }),
      });

      if (response.status === 409) {
        // Conflict detected
        const conflictData = await response.json();
        handleConflict(change, conflictData);
        return;
      }

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      // Mark as synced
      await offlineStore.removeItem(change.id);
      setPendingChanges(prev => prev.filter(c => c.id !== change.id));
      
    } catch (error) {
      console.error('Failed to sync change:', error);
      // Will retry on next sync attempt
    }
  }, []);

  const syncPendingChanges = useCallback(async () => {
    if (!isOnline || isSyncing || pendingChanges.length === 0) {
      return;
    }

    setIsSyncing(true);
    const total = pendingChanges.length;
    let synced = 0;

    try {
      for (const change of pendingChanges) {
        await syncChange(change);
        synced++;
        
        // Update progress
        if (synced % 5 === 0) {
          toast.info(`Syncing... ${synced}/${total} changes`);
        }
      }

      if (synced > 0) {
        toast.success(`Successfully synced ${synced} changes`);
      }
    } finally {
      setIsSyncing(false);
      await loadPendingChanges(); // Reload to get current state
    }
  }, [isOnline, isSyncing, pendingChanges, syncChange]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing changes...');
      syncPendingChanges();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Working offline - changes will sync when reconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingChanges]);

  // Load pending changes on mount
  useEffect(() => {
    loadPendingChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // loadPendingChanges only needs to run once on mount

  const loadPendingChanges = async () => {
    try {
      const keys = await offlineStore.keys();
      const changes: OfflineChange[] = [];
      
      for (const key of keys) {
        const change = await offlineStore.getItem<OfflineChange>(key);
        if (change && change.syncStatus === 'pending') {
          changes.push(change);
        }
      }
      
      setPendingChanges(changes.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {
      console.error('Failed to load pending changes:', error);
    }
  };

  const queueChange = useCallback(async (change: Omit<OfflineChange, 'id' | 'timestamp' | 'syncStatus'>) => {
    const offlineChange: OfflineChange = {
      ...change,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      syncStatus: 'pending',
    };

    try {
      await offlineStore.setItem(offlineChange.id, offlineChange);
      setPendingChanges(prev => [...prev, offlineChange]);

      if (isOnline) {
        // Try to sync immediately if online
        syncChange(offlineChange);
      }
    } catch (error) {
      console.error('Failed to queue offline change:', error);
      toast.error('Failed to save offline change');
    }
  }, [isOnline, syncChange]); // Fixed dependency array


  const resolveConflict = async (
    changeId: string, 
    resolution: ConflictResolution
  ) => {
    const conflict = conflicts.find(c => c.id === changeId);
    if (!conflict) return;

    try {
      let resolvedData;
      
      switch (resolution.strategy) {
        case 'local':
          resolvedData = conflict.data;
          break;
        case 'remote':
          resolvedData = conflict.remoteData;
          break;
        case 'merge':
          resolvedData = resolution.resolver?.(conflict.data, conflict.remoteData) || conflict.data;
          break;
      }

      // Send resolved data
      const response = await fetch(`/api/sync/${conflict.entity}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeId: conflict.id,
          resolution: resolution.strategy,
          data: resolvedData,
        }),
      });

      if (response.ok) {
        await offlineStore.removeItem(conflict.id);
        setConflicts(prev => prev.filter(c => c.id !== changeId));
        setPendingChanges(prev => prev.filter(c => c.id !== changeId));
        toast.success('Conflict resolved');
      } else {
        throw new Error('Failed to resolve conflict');
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      toast.error('Failed to resolve conflict');
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && !isSyncing) {
      syncPendingChanges();
    }
  }, [isOnline, syncPendingChanges, isSyncing]);

  return {
    isOnline,
    pendingChanges,
    conflicts,
    isSyncing,
    queueChange,
    syncPendingChanges,
    resolveConflict,
    changeCount: pendingChanges.length,
  };
}
