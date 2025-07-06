import { useDeferredValue, useTransition, useMemo, useCallback } from 'react';
import { useWebSocketConcurrent } from './useWebSocketConcurrent';

interface OptimizedWebSocketState<T = any> {
  data: T;
  loading: boolean;
  error: string | null;
  lastUpdate: number;
}

interface StateUpdateOptions {
  merge?: boolean;
  debounceMs?: number;
  priority?: 'high' | 'normal' | 'low';
}

export function useOptimizedWebSocketState<T>(
  channel: string,
  initialData: T,
  options: {
    url: string;
    token?: string;
    enableConcurrency?: boolean;
    updateOptions?: StateUpdateOptions;
  }
) {
  const {
    messages,
    connectionStatus,
    sendMessage,
    isConnected,
    isProcessing,
    getMessagesByChannel,
    getLatestMessage
  } = useWebSocketConcurrent({
    url: options.url,
    token: options.token,
    enableDeferredUpdates: options.enableConcurrency !== false,
  });

  const [isPending, startTransition] = useTransition();

  // Get channel-specific messages with deferred processing
  const channelMessages = useMemo(() => {
    return getMessagesByChannel(channel);
  }, [getMessagesByChannel, channel]);

  // Process state updates with concurrent features
  const currentState = useMemo<OptimizedWebSocketState<T>>(() => {
    const latestMessage = getLatestMessage(channel);
    
    if (!latestMessage) {
      return {
        data: initialData,
        loading: !isConnected,
        error: connectionStatus === 'error' ? 'Connection failed' : null,
        lastUpdate: 0,
      };
    }

    return {
      data: latestMessage.data as T,
      loading: false,
      error: null,
      lastUpdate: latestMessage.timestamp,
    };
  }, [channel, initialData, isConnected, connectionStatus, getLatestMessage]);

  // Use deferred value for non-critical UI updates
  const deferredState = useDeferredValue(currentState);

  // Optimized state update function
  const updateState = useCallback((
    newData: Partial<T> | T,
    updateOptions: StateUpdateOptions = {}
  ) => {
    const { priority = 'normal', merge = true } = updateOptions;
    
    const finalData = merge && typeof newData === 'object' && typeof currentState.data === 'object'
      ? { ...currentState.data, ...newData }
      : newData;

    const message = {
      channel,
      data: finalData,
      timestamp: Date.now(),
    };

    if (priority === 'high') {
      // High priority updates bypass concurrent features
      sendMessage(channel, finalData, true);
    } else {
      // Normal/low priority updates use transitions
      startTransition(() => {
        sendMessage(channel, finalData, false);
      });
    }
  }, [channel, currentState.data, sendMessage]);

  // Optimized subscription to specific data updates
  const subscribeToUpdates = useCallback((
    callback: (data: T) => void,
    filter?: (data: T) => boolean
  ) => {
    const latestMessage = getLatestMessage(channel);
    if (!latestMessage) return;

    const data = latestMessage.data as T;
    
    if (!filter || filter(data)) {
      // Use transition for callback execution to avoid blocking
      startTransition(() => {
        callback(data);
      });
    }
  }, [channel, getLatestMessage]);

  // Memoized derived state
  const derivedState = useMemo(() => {
    const state = options.enableConcurrency ? deferredState : currentState;
    
    return {
      ...state,
      // Additional computed properties
      hasData: state.data !== initialData,
      isStale: Date.now() - state.lastUpdate > 30000, // 30 seconds
      messageCount: channelMessages.length,
    };
  }, [currentState, deferredState, options.enableConcurrency, initialData, channelMessages.length]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    isPending,
    isProcessing,
    isDeferred: options.enableConcurrency && isPending,
    channelMessageCount: channelMessages.length,
    connectionStatus,
  }), [isPending, isProcessing, options.enableConcurrency, channelMessages.length, connectionStatus]);

  return {
    // Primary state
    ...derivedState,
    
    // Actions
    updateState,
    subscribeToUpdates,
    
    // Connection info
    isConnected,
    connectionStatus,
    
    // Performance
    ...performanceMetrics,
    
    // Raw data access
    rawMessages: channelMessages,
    latestMessage: getLatestMessage(channel),
  };
}

// Specialized hook for lock state management
export function useLockStateOptimized(projectId: string, options: {
  url: string;
  token?: string;
}) {
  return useOptimizedWebSocketState(
    `locks:${projectId}`,
    {},
    {
      ...options,
      enableConcurrency: true,
      updateOptions: {
        merge: true,
        priority: 'normal',
      }
    }
  );
}

// Specialized hook for real-time collaboration
export function useCollaborationStateOptimized(projectId: string, options: {
  url: string;
  token?: string;
}) {
  return useOptimizedWebSocketState(
    `collaboration:${projectId}`,
    {
      activeUsers: [],
      currentEditors: {},
      recentChanges: [],
    },
    {
      ...options,
      enableConcurrency: true,
      updateOptions: {
        merge: false, // Replace entire collaboration state
        priority: 'high', // Collaboration needs immediate updates
      }
    }
  );
}