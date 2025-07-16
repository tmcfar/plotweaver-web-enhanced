import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketHook {
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  subscribe: (channel: string, callback: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
  send: (channel: string, data: any) => void;
}

export const useEnhancedWebSocket = (projectId: string): WebSocketHook => {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const ws = useRef<WebSocket | null>(null);
  const subscriptions = useRef<Map<string, (data: any) => void>>(new Map());
  const messageQueue = useRef<Array<{channel: string, data: any}>>([]);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket('ws://localhost:8000/ws');
      
      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Send queued messages
        messageQueue.current.forEach(({channel, data}) => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            try {
              ws.current.send(JSON.stringify({ channel, data }));
            } catch (error) {
              ws.current.send(typeof data === 'string' ? data : JSON.stringify(data));
            }
          }
        });
        messageQueue.current = [];
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Handle different message formats
          if (message.channel && message.data) {
            // Channel-based message
            const callback = subscriptions.current.get(message.channel);
            if (callback) {
              callback(message.data);
            }
          } else if (message.type) {
            // Type-based message (existing format)
            const callback = subscriptions.current.get(message.type);
            if (callback) {
              callback(message);
            }
          } else {
            // Plain message (fallback for existing simple messages)
            const callback = subscriptions.current.get('message');
            if (callback) {
              callback(event.data);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          // Handle non-JSON messages (existing behavior)
          const callback = subscriptions.current.get('message');
          if (callback) {
            callback(event.data);
          }
        }
      };

      ws.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectAttempts.current++;
          
          setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttempts.current})`);
            setConnectionStatus('reconnecting');
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnectionStatus('disconnected');
    }
  }, []);

  const subscribe = useCallback((channel: string, callback: (data: any) => void) => {
    subscriptions.current.set(channel, callback);
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    subscriptions.current.delete(channel);
  }, []);

  const send = useCallback((channel: string, data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        // Try to send as structured message first
        ws.current.send(JSON.stringify({ channel, data }));
      } catch (error) {
        // Fallback to simple string message (existing behavior)
        ws.current.send(typeof data === 'string' ? data : JSON.stringify(data));
      }
    } else {
      // Queue message for later
      messageQueue.current.push({ channel, data });
    }
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  return { connectionStatus, subscribe, unsubscribe, send };
};

// Keep the original hook for backward compatibility
export const useWebSocket = (url: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.current.onmessage = (event) => {
      setLastMessage(event.data);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const sendMessage = (message: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(message);
    }
  };

  return { isConnected, lastMessage, sendMessage };
};