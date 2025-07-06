import { EventEmitter } from 'events'
import { WebSocketClient, WebSocketMessage } from './websocket-client'

export interface UserPresence {
  userId: string
  username: string
  avatar?: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: Date
  currentLocation?: {
    projectId?: string
    chapterId?: string
    sceneId?: string
    position?: {
      line: number
      column: number
    }
  }
  cursor?: {
    x: number
    y: number
    selection?: {
      start: number
      end: number
    }
  }
  metadata?: Record<string, any>
}

export interface PresenceUpdate {
  type: 'join' | 'leave' | 'update'
  user: UserPresence
  timestamp: Date
}

export interface CursorPosition {
  userId: string
  x: number
  y: number
  selection?: {
    start: number
    end: number
  }
}

export class PresenceManager extends EventEmitter {
  private wsClient: WebSocketClient
  private currentUser: UserPresence | null = null
  private users: Map<string, UserPresence> = new Map()
  private presenceTimer?: NodeJS.Timeout
  private cursorTimer?: NodeJS.Timeout
  private readonly PRESENCE_INTERVAL = 15000 // 15 seconds
  private readonly CURSOR_THROTTLE = 100 // 100ms

  constructor(wsClient: WebSocketClient) {
    super()
    this.wsClient = wsClient

    // Listen for WebSocket messages
    this.wsClient.on('presence_update', this.handlePresenceUpdate.bind(this))
    this.wsClient.on('cursor_update', this.handleCursorUpdate.bind(this))
    this.wsClient.on('user_joined', this.handleUserJoined.bind(this))
    this.wsClient.on('user_left', this.handleUserLeft.bind(this))
    this.wsClient.on('connected', this.handleConnected.bind(this))
    this.wsClient.on('disconnected', this.handleDisconnected.bind(this))
  }

  initialize(user: Omit<UserPresence, 'lastSeen' | 'status'>): void {
    this.currentUser = {
      ...user,
      status: 'online',
      lastSeen: new Date()
    }

    if (this.wsClient.getState().isConnected) {
      this.announcePresence()
    }
  }

  updatePresence(updates: Partial<UserPresence>): void {
    if (!this.currentUser) return

    this.currentUser = {
      ...this.currentUser,
      ...updates,
      lastSeen: new Date()
    }

    this.broadcastPresence()
  }

  updateLocation(location: UserPresence['currentLocation']): void {
    this.updatePresence({ currentLocation: location })
  }

  updateCursor(cursor: UserPresence['cursor']): void {
    if (!this.currentUser) return

    this.currentUser.cursor = cursor
    this.throttledCursorUpdate()
  }

  updateStatus(status: UserPresence['status']): void {
    this.updatePresence({ status })
  }

  getUsers(): UserPresence[] {
    return Array.from(this.users.values())
  }

  getUser(userId: string): UserPresence | undefined {
    return this.users.get(userId)
  }

  getCurrentUser(): UserPresence | null {
    return this.currentUser
  }

  getUsersInLocation(location: UserPresence['currentLocation']): UserPresence[] {
    return this.getUsers().filter(user => {
      if (!user.currentLocation || !location) return false
      
      return (
        user.currentLocation.projectId === location.projectId &&
        user.currentLocation.chapterId === location.chapterId &&
        user.currentLocation.sceneId === location.sceneId
      )
    })
  }

  startPresenceUpdates(): void {
    this.stopPresenceUpdates()
    
    this.presenceTimer = setInterval(() => {
      if (this.currentUser) {
        this.broadcastPresence()
      }
    }, this.PRESENCE_INTERVAL)
  }

  stopPresenceUpdates(): void {
    if (this.presenceTimer) {
      clearInterval(this.presenceTimer)
      this.presenceTimer = undefined
    }
  }

  destroy(): void {
    this.stopPresenceUpdates()
    
    if (this.cursorTimer) {
      clearTimeout(this.cursorTimer)
    }

    // Announce that we're leaving
    if (this.currentUser) {
      this.wsClient.send('user_leaving', {
        userId: this.currentUser.userId
      })
    }

    this.users.clear()
    this.currentUser = null
    this.removeAllListeners()
  }

  private handleConnected(): void {
    if (this.currentUser) {
      this.announcePresence()
      this.startPresenceUpdates()
    }
  }

  private handleDisconnected(): void {
    this.stopPresenceUpdates()
    // Mark all users as potentially offline
    this.users.forEach(user => {
      user.status = 'offline'
    })
    this.emit('users_updated', this.getUsers())
  }

  private handlePresenceUpdate(data: any): void {
    const presence: UserPresence = {
      ...data,
      lastSeen: new Date(data.lastSeen)
    }

    // Don't update our own presence from the server
    if (presence.userId === this.currentUser?.userId) return

    const wasOnline = this.users.has(presence.userId)
    this.users.set(presence.userId, presence)

    const update: PresenceUpdate = {
      type: wasOnline ? 'update' : 'join',
      user: presence,
      timestamp: new Date()
    }

    this.emit('presence_update', update)
    this.emit('users_updated', this.getUsers())
  }

  private handleCursorUpdate(data: CursorPosition): void {
    const user = this.users.get(data.userId)
    if (!user) return

    user.cursor = {
      x: data.x,
      y: data.y,
      selection: data.selection
    }

    this.emit('cursor_update', data)
  }

  private handleUserJoined(data: any): void {
    const user: UserPresence = {
      ...data,
      status: 'online',
      lastSeen: new Date()
    }

    this.users.set(user.userId, user)

    const update: PresenceUpdate = {
      type: 'join',
      user,
      timestamp: new Date()
    }

    this.emit('presence_update', update)
    this.emit('user_joined', user)
    this.emit('users_updated', this.getUsers())
  }

  private handleUserLeft(data: { userId: string }): void {
    const user = this.users.get(data.userId)
    if (!user) return

    this.users.delete(data.userId)

    const update: PresenceUpdate = {
      type: 'leave',
      user,
      timestamp: new Date()
    }

    this.emit('presence_update', update)
    this.emit('user_left', user)
    this.emit('users_updated', this.getUsers())
  }

  private announcePresence(): void {
    if (!this.currentUser) return

    this.wsClient.send('user_presence', {
      ...this.currentUser,
      type: 'join'
    })
  }

  private broadcastPresence(): void {
    if (!this.currentUser) return

    this.wsClient.send('presence_update', {
      ...this.currentUser,
      lastSeen: new Date().toISOString()
    })
  }

  private throttledCursorUpdate = (() => {
    let timeoutId: NodeJS.Timeout | null = null
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        if (this.currentUser?.cursor) {
          this.wsClient.send('cursor_update', {
            userId: this.currentUser.userId,
            x: this.currentUser.cursor.x,
            y: this.currentUser.cursor.y,
            selection: this.currentUser.cursor.selection
          })
        }
      }, this.CURSOR_THROTTLE)
    }
  })()
}

// Factory function for creating presence manager
export function createPresenceManager(wsClient: WebSocketClient): PresenceManager {
  return new PresenceManager(wsClient)
}