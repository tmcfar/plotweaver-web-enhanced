/**
 * WebSocket service for real-time updates
 */

import { EventEmitter } from 'events';

export interface ProgressUpdate {
  task_id: string;
  status: 'started' | 'processing' | 'completed' | 'failed' | 'error';
  stage?: string;
  message: string;
  timestamp: string;
  data?: any;
  error?: any;
}

export class WebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private url: string;
  private isReconnecting = false;

  constructor(url?: string) {
    super();
    this.url = url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
  }

  connect(token?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = token ? `${this.url}?token=${token}` : this.url;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.isReconnecting = false;
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        this.emit('disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;

    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
    }, this.reconnectDelay);
  }

  private handleMessage(data: any): void {
    // Handle different message types
    if (data.channel) {
      // Channel-based messages
      this.emit(data.channel, data.data);
      
      // Also emit specific events for agent progress
      if (data.channel.startsWith('agent_progress:')) {
        this.emit('agent_progress', data.data);
      }
    } else if (data.type) {
      // Type-based messages
      this.emit(data.type, data);
    }
  }

  subscribeToProject(projectId: string): void {
    this.send({
      type: 'subscribe',
      channel: `agent_progress:${projectId}`,
    });
  }

  unsubscribeFromProject(projectId: string): void {
    this.send({
      type: 'unsubscribe',
      channel: `agent_progress:${projectId}`,
    });
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not connected, queuing message');
      // You could implement a queue here
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let wsInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsInstance) {
    wsInstance = new WebSocketService();
  }
  return wsInstance;
};

export default WebSocketService;
