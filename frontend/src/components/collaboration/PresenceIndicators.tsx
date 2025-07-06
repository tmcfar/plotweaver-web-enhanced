'use client'

import React, { useState, useEffect } from 'react'
import { 
  User, 
  Circle, 
  Eye, 
  Edit, 
  MessageSquare,
  Clock,
  MapPin
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { UserPresence } from '@/lib/realtime/presence-manager'

interface PresenceIndicatorsProps {
  users: UserPresence[]
  currentUserId?: string
  showDetails?: boolean
  maxVisible?: number
  className?: string
}

const statusConfig = {
  online: { color: 'bg-green-500', label: 'Online' },
  away: { color: 'bg-yellow-500', label: 'Away' },
  busy: { color: 'bg-red-500', label: 'Busy' },
  offline: { color: 'bg-gray-400', label: 'Offline' }
}

export function PresenceIndicators({ 
  users, 
  currentUserId, 
  showDetails = false,
  maxVisible = 5,
  className 
}: PresenceIndicatorsProps) {
  const onlineUsers = users.filter(user => user.status !== 'offline' && user.userId !== currentUserId)
  const visibleUsers = onlineUsers.slice(0, maxVisible)
  const extraCount = Math.max(0, onlineUsers.length - maxVisible)

  if (onlineUsers.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
        <Circle className="h-3 w-3 fill-gray-400" />
        <span className="text-sm">Working alone</span>
      </div>
    )
  }

  if (showDetails) {
    return <DetailedPresenceView users={onlineUsers} className={className} />
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        {visibleUsers.map((user) => (
          <UserAvatar key={user.userId} user={user} size="sm" />
        ))}
        
        {extraCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center text-xs font-medium">
                +{extraCount}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {onlineUsers.slice(maxVisible).map(user => (
                  <div key={user.userId} className="text-sm">
                    {user.username}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
        
        <span className="text-sm text-muted-foreground ml-2">
          {onlineUsers.length} online
        </span>
      </div>
    </TooltipProvider>
  )
}

interface UserAvatarProps {
  user: UserPresence
  size?: 'sm' | 'md' | 'lg'
  showStatus?: boolean
  onClick?: () => void
}

export function UserAvatar({ user, size = 'md', showStatus = true, onClick }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const statusSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3 h-3'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'relative cursor-pointer',
              onClick && 'hover:scale-105 transition-transform'
            )}
            onClick={onClick}
          >
            <Avatar className={sizeClasses[size]}>
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-xs font-medium">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            
            {showStatus && (
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-background',
                statusSize[size],
                statusConfig[user.status].color
              )} />
            )}
          </div>
        </TooltipTrigger>
        
        <TooltipContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">{user.username}</span>
              <Badge variant="secondary" className="text-xs">
                {statusConfig[user.status].label}
              </Badge>
            </div>
            
            {user.currentLocation && (
              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {user.currentLocation.chapterId && (
                    <span>{user.currentLocation.chapterId}</span>
                  )}
                  {user.currentLocation.sceneId && (
                    <span> → {user.currentLocation.sceneId}</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {user.status === 'online' ? 'Active now' : formatLastSeen(user.lastSeen)}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DetailedPresenceViewProps {
  users: UserPresence[]
  className?: string
}

function DetailedPresenceView({ users, className }: DetailedPresenceViewProps) {
  const [selectedUser, setSelectedUser] = useState<UserPresence | null>(null)
  
  const groupedUsers = users.reduce((acc, user) => {
    if (!acc[user.status]) {
      acc[user.status] = []
    }
    acc[user.status].push(user)
    return acc
  }, {} as Record<string, UserPresence[]>)

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Collaborators ({users.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Circle className="h-2 w-2 fill-green-500" />
            <span className="text-sm text-muted-foreground">
              {users.filter(u => u.status === 'online').length} active
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(groupedUsers).map(([status, statusUsers]) => (
          <div key={status}>
            <div className="flex items-center gap-2 mb-2">
              <Circle className={cn('h-2 w-2', statusConfig[status as keyof typeof statusConfig].color)} />
              <span className="text-sm font-medium">
                {statusConfig[status as keyof typeof statusConfig].label} ({statusUsers.length})
              </span>
            </div>
            
            <div className="space-y-2 ml-4">
              {statusUsers.map((user) => (
                <UserRow 
                  key={user.userId} 
                  user={user}
                  isSelected={selectedUser?.userId === user.userId}
                  onClick={() => setSelectedUser(user)}
                />
              ))}
            </div>
            
            <Separator className="mt-3" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

interface UserRowProps {
  user: UserPresence
  isSelected: boolean
  onClick: () => void
}

function UserRow({ user, isSelected, onClick }: UserRowProps) {
  const getActivityIcon = (user: UserPresence) => {
    if (user.currentLocation) {
      return <Edit className="h-3 w-3" />
    }
    return <Eye className="h-3 w-3" />
  }

  const formatLocation = (location: UserPresence['currentLocation']) => {
    if (!location) return 'Browsing'
    
    const parts = []
    if (location.chapterId) parts.push(location.chapterId)
    if (location.sceneId) parts.push(location.sceneId)
    
    return parts.length > 0 ? parts.join(' → ') : 'In project'
  }

  const formatLastSeen = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h`
    
    const days = Math.floor(hours / 24)
    return `${days}d`
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-accent' : 'hover:bg-muted/50'
      )}
      onClick={onClick}
    >
      <UserAvatar user={user} size="sm" showStatus={false} />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{user.username}</span>
          {getActivityIcon(user)}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {formatLocation(user.currentLocation)}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {user.status === 'online' ? 'now' : formatLastSeen(user.lastSeen)}
      </div>
    </div>
  )
}

// Hook for managing presence data
export function usePresence() {
  const [users, setUsers] = useState<UserPresence[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - would be replaced with real presence manager
    const mockUsers: UserPresence[] = [
      {
        userId: '1',
        username: 'Sarah Chen',
        avatar: '/avatars/sarah.jpg',
        status: 'online',
        lastSeen: new Date(),
        currentLocation: {
          projectId: 'elderbrook',
          chapterId: 'Chapter 3',
          sceneId: 'Scene 2',
          position: { line: 42, column: 15 }
        }
      },
      {
        userId: '2',
        username: 'Mike Rodriguez',
        avatar: '/avatars/mike.jpg',
        status: 'away',
        lastSeen: new Date(Date.now() - 15 * 60 * 1000),
        currentLocation: {
          projectId: 'elderbrook',
          chapterId: 'Chapter 1',
          sceneId: 'Scene 1'
        }
      },
      {
        userId: '3',
        username: 'Emma Thompson',
        status: 'online',
        lastSeen: new Date(),
        currentLocation: {
          projectId: 'elderbrook',
          chapterId: 'Chapter 2',
          sceneId: 'Scene 3'
        }
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setIsLoading(false)
    }, 1000)
  }, [])

  return { users, isLoading }
}