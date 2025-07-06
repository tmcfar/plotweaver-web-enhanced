import { EventEmitter } from 'events'

export interface WebSocketMessage {
  type: string
  payload: any
  timestamp: number
  userId?: string
  sessionId?: string
}

export interface ConnectionState {
  isConnected: boolean
  isReconnecting: boolean
  lastConnected?: Date
  reconnectAttempts: number
  latency?: number
}

export interface WebSocketClientOptions {
  url: string
  protocols?: string[]
  maxReconnectAttempts?: number
  reconnectInterval?: number
  heartbeatInterval?: number
  autoReconnect?: boolean
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private options: Required<WebSocketClientOptions>
  private state: ConnectionState
  private heartbeatTimer?: NodeJS.Timeout
  private reconnectTimer?: NodeJS.Timeout
  private lastHeartbeat?: number
  private messageQueue: WebSocketMessage[] = []

  constructor(options: WebSocketClientOptions) {
    super()
    
    this.options = {
      protocols: [],
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      heartbeatInterval: 30000,
      autoReconnect: true,
      ...options
    }

    this.state = {
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0
    }
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.options.url, this.options.protocols)
        
        this.ws.onopen = (event) => {
          this.handleOpen(event)
          resolve()
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        this.ws.onclose = (event) => {
          this.handleClose(event)
        }

        this.ws.onerror = (event) => {
          this.handleError(event)
          reject(new Error('WebSocket connection failed'))
        }

        // Connection timeout
        setTimeout(() => {
          if (this.state.isConnected === false) {
            reject(new Error('WebSocket connection timeout'))
          }
        }, 10000)

      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect')
      this.ws = null
    }

    this.updateState({
      isConnected: false,
      isReconnecting: false,
      reconnectAttempts: 0
    })
  }

  send(type: string, payload: any): boolean {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now()
    }

    if (this.state.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message))
        return true
      } catch (error) {
        console.error('Failed to send message:', error)
        this.queueMessage(message)
        return false
      }
    } else {
      this.queueMessage(message)
      return false
    }
  }

  getState(): ConnectionState {
    return { ...this.state }
  }

  private handleOpen(event: Event): void {
    console.log('WebSocket connected')
    
    this.updateState({
      isConnected: true,
      isReconnecting: false,
      lastConnected: new Date(),
      reconnectAttempts: 0
    })

    this.startHeartbeat()
    this.flushMessageQueue()
    this.emit('connected', event)
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      
      // Handle special message types
      switch (message.type) {
        case 'heartbeat':
          this.handleHeartbeat(message)
          break
        case 'error':
          this.emit('error', message.payload)
          break
        default:
          this.emit('message', message)
          this.emit(message.type, message.payload)
          break
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error)
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason)
    
    this.updateState({
      isConnected: false
    })

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.emit('disconnected', event)

    // Auto-reconnect if enabled and not a clean close
    if (this.options.autoReconnect && event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private handleError(event: Event): void {
    console.error('WebSocket error:', event)
    this.emit('error', event)
  }

  private handleHeartbeat(message: WebSocketMessage): void {
    if (this.lastHeartbeat) {
      const latency = Date.now() - this.lastHeartbeat
      this.updateState({ latency })
    }

    // Send heartbeat response
    this.send('heartbeat_response', { timestamp: message.timestamp })
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.state.isConnected) {
        this.lastHeartbeat = Date.now()
        this.send('heartbeat', { timestamp: this.lastHeartbeat })
      }
    }, this.options.heartbeatInterval)
  }

  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached')
      this.emit('reconnect_failed')
      return
    }

    this.updateState({
      isReconnecting: true,
      reconnectAttempts: this.state.reconnectAttempts + 1
    })

    const delay = this.options.reconnectInterval * Math.pow(2, this.state.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.state.reconnectAttempts})`)
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect()
        this.emit('reconnected')
      } catch (error) {
        console.error('Reconnect failed:', error)
        this.scheduleReconnect()
      }
    }, delay)
  }

  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message)
    
    // Limit queue size to prevent memory issues
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state.isConnected) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message.type, message.payload)
      }
    }
  }

  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates }
    this.emit('state_change', this.state)
  }
}

// Singleton instance for app-wide usage
let wsClient: WebSocketClient | null = null

export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient {
  if (!wsClient && options) {
    wsClient = new WebSocketClient(options)
  }
  
  if (!wsClient) {
    throw new Error('WebSocket client not initialized. Provide options on first call.')
  }
  
  return wsClient
}

export function initializeWebSocket(options: WebSocketClientOptions): WebSocketClient {
  wsClient = new WebSocketClient(options)
  return wsClient
}