import { SSEOptions } from '../../types/sse';

export class SSEConnectionManager {
  private connections = new Map<string, EventSource>();
  private reconnectAttempts = new Map<string, number>();
  
  connect(jobId: string, options: SSEOptions = {}): EventSource {
    // Clean up existing connection
    this.disconnect(jobId);
    
    const url = `/api/agents/progress/${jobId}`;
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log(`SSE connected for job ${jobId}`);
      this.reconnectAttempts.set(jobId, 0);
      options.onOpen?.();
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        options.onMessage?.(data);
      } catch (error) {
        console.error('SSE parse error:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error(`SSE error for job ${jobId}:`, error);
      
      if (eventSource.readyState === EventSource.CLOSED) {
        this.handleReconnect(jobId, options);
      }
      
      options.onError?.(error);
    };
    
    this.connections.set(jobId, eventSource);
    return eventSource;
  }
  
  disconnect(jobId: string) {
    const connection = this.connections.get(jobId);
    if (connection) {
      connection.close();
      this.connections.delete(jobId);
      this.reconnectAttempts.delete(jobId);
    }
  }
  
  disconnectAll() {
    this.connections.forEach((connection, jobId) => {
      this.disconnect(jobId);
    });
  }
  
  private handleReconnect(jobId: string, options: SSEOptions) {
    const attempts = this.reconnectAttempts.get(jobId) || 0;
    const maxAttempts = options.maxReconnectAttempts || 5;
    
    if (attempts >= maxAttempts) {
      console.error(`Max reconnect attempts reached for job ${jobId}`);
      options.onMaxReconnectAttemptsReached?.();
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
    console.log(`Reconnecting SSE for job ${jobId} in ${delay}ms (attempt ${attempts + 1})`);
    
    this.reconnectAttempts.set(jobId, attempts + 1);
    
    setTimeout(() => {
      if (!this.connections.has(jobId)) {
        this.connect(jobId, options);
      }
    }, delay);
  }
}

// Global instance
export const sseManager = new SSEConnectionManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    sseManager.disconnectAll();
  });
}