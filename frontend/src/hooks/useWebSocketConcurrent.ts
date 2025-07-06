import { useCallback, useDeferredValue, useTransition, useState, useEffect, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

interface WebSocketMessage {
  channel: string;
  data: any;
  timestamp: number;
}

interface ConcurrentWebSocketState {
  messages: WebSocketMessage[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: string | null;
  isProcessing: boolean;
}

interface ConcurrentWebSocketOptions {
  url: string;
  token?: string;
  reconnectAttempts?: number;
  enableDeferredUpdates?: boolean;
  updateBatchSize?: number;
  updateBatchDelay?: number;
}

export function useWebSocketConcurrent(options: ConcurrentWebSocketOptions) {
  const [state, setState] = useState<ConcurrentWebSocketState>({
    messages: [],
    connectionStatus: 'disconnected',
    lastError: null,
    isProcessing: false,
  });

  const [isPending, startTransition] = useTransition();
  const pendingUpdatesRef = useRef<WebSocketMessage[]>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use deferred value for non-critical UI updates
  const deferredMessages = useDeferredValue(state.messages);
  const deferredConnectionStatus = useDeferredValue(state.connectionStatus);

  // Batch message updates to avoid blocking the UI
  const batchedUpdateMessages = useCallback((newMessages: WebSocketMessage[]) => {
    if (!options.enableDeferredUpdates) {
      // Immediate update
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, ...newMessages],
        isProcessing: false,
      }));
      return;
    }

    // Add to pending updates
    pendingUpdatesRef.current.push(...newMessages);

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout for batch processing
    batchTimeoutRef.current = setTimeout(() => {
      const pendingMessages = [...pendingUpdatesRef.current];
      pendingUpdatesRef.current = [];

      startTransition(() => {
        setState(prev => {
          const allMessages = [...prev.messages, ...pendingMessages];
          
          // Keep only the most recent messages to prevent memory issues
          const maxMessages = 1000;
          const recentMessages = allMessages.slice(-maxMessages);

          return {
            ...prev,
            messages: recentMessages,
            isProcessing: false,
          };
        });
      });
    }, options.updateBatchDelay || 100);
  }, [options.enableDeferredUpdates, options.updateBatchDelay]);

  // WebSocket connection with enhanced message handling
  const { 
    connectionState, 
    sendMessage, 
    disconnect,
    isConnected 
  } = useWebSocket({
    url: options.url,
    onMessage: (message) => {
      try {
        const parsedMessage: WebSocketMessage = {
          channel: message.channel || 'default',
          data: message.data || message,
          timestamp: Date.now(),
        };

        // Use transition for non-urgent updates
        if (parsedMessage.channel === 'heartbeat' || parsedMessage.channel === 'status') {
          startTransition(() => {
            batchedUpdateMessages([parsedMessage]);
          });
        } else {
          // Urgent updates (user actions, errors) - immediate
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, parsedMessage],
            isProcessing: false,
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    },
    onConnectionChange: (status) => {
      startTransition(() => {
        setState(prev => ({
          ...prev,
          connectionStatus: status,
          lastError: status === 'error' ? 'Connection failed' : null,
        }));
      });
    },
    token: options.token,
    reconnectAttempts: options.reconnectAttempts || 5,
  });

  // Enhanced send function with transition support
  const sendMessageConcurrent = useCallback((channel: string, data: any, isUrgent = false) => {
    const message = { channel, data };
    
    if (isUrgent) {
      // Send immediately for urgent messages
      sendMessage(message);
    } else {
      // Use transition for non-urgent messages
      startTransition(() => {
        sendMessage(message);
      });
    }
  }, [sendMessage]);

  // Optimized message filtering with deferred processing
  const getMessagesByChannel = useCallback((channel: string) => {
    // Use deferred messages for filtering to avoid blocking UI
    return deferredMessages.filter(msg => msg.channel === channel);
  }, [deferredMessages]);

  // Get latest message from a channel
  const getLatestMessage = useCallback((channel: string) => {
    const channelMessages = getMessagesByChannel(channel);
    return channelMessages[channelMessages.length - 1] || null;
  }, [getMessagesByChannel]);

  // Clear old messages periodically
  useEffect(() => {
    const interval = setInterval(() => {
      startTransition(() => {
        setState(prev => {
          const oneHourAgo = Date.now() - (60 * 60 * 1000);
          const recentMessages = prev.messages.filter(
            msg => msg.timestamp > oneHourAgo
          );
          
          return {
            ...prev,
            messages: recentMessages,
          };
        });
      });
    }, 5 * 60 * 1000); // Clean every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Cleanup batch timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Deferred state for non-critical UI
    messages: deferredMessages,
    connectionStatus: deferredConnectionStatus,
    lastError: state.lastError,
    
    // Immediate state for critical UI
    isConnected,
    isProcessing: state.isProcessing || isPending,
    
    // Actions
    sendMessage: sendMessageConcurrent,
    disconnect,
    
    // Utilities
    getMessagesByChannel,
    getLatestMessage,
    
    // Performance metrics
    isPending,
    messageCount: state.messages.length,
    deferredMessageCount: deferredMessages.length,
  };
}