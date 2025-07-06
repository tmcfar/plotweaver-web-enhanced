'use client'

import React, { useState } from 'react'
import { 
  Users, 
  Crown, 
  Shield, 
  User, 
  MoreHorizontal,
  MessageCircle,
  Eye,
  EyeOff,
  Settings,
  UserPlus,
  Search,
  Filter,
  Clock
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { UserPresence } from '@/lib/realtime/presence-manager'

export type CollaboratorRole = 'owner' | 'editor' | 'reviewer' | 'viewer'
export type CollaboratorPermission = 'read' | 'comment' | 'edit' | 'admin'

export interface Collaborator extends UserPresence {
  role: CollaboratorRole
  permissions: CollaboratorPermission[]
  joinedAt: Date
  lastActiveAt: Date
  isInvited?: boolean
  invitedBy?: string
}

interface CollaboratorListProps {
  collaborators: Collaborator[]
  currentUserId?: string
  projectRole?: CollaboratorRole
  onInvite?: () => void
  onRemove?: (userId: string) => void
  onChangeRole?: (userId: string, role: CollaboratorRole) => void
  onMessage?: (userId: string) => void
  className?: string
}

const roleConfig: Record<CollaboratorRole, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  description: string
}> = {
  owner: {
    label: 'Owner',
    icon: Crown,
    color: 'text-yellow-600',
    description: 'Full access and control'
  },
  editor: {
    label: 'Editor',
    icon: User,
    color: 'text-blue-600',
    description: 'Can edit and comment'
  },
  reviewer: {
    label: 'Reviewer',
    icon: Shield,
    color: 'text-green-600',
    description: 'Can comment and suggest'
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    color: 'text-gray-600',
    description: 'Read-only access'
  }
}

export function CollaboratorList({
  collaborators,
  currentUserId,
  projectRole = 'viewer',
  onInvite,
  onRemove,
  onChangeRole,
  onMessage,
  className
}: CollaboratorListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  const canManageUsers = projectRole === 'owner' || projectRole === 'editor'

  const filteredCollaborators = collaborators.filter(collaborator => {
    const matchesSearch = collaborator.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'online' && collaborator.status === 'online') ||
      (statusFilter === 'offline' && collaborator.status === 'offline')
    const matchesRole = roleFilter === 'all' || collaborator.role === roleFilter

    return matchesSearch && matchesStatus && matchesRole
  })

  const groupedCollaborators = filteredCollaborators.reduce((acc, collaborator) => {
    if (!acc[collaborator.role]) {
      acc[collaborator.role] = []
    }
    acc[collaborator.role].push(collaborator)
    return acc
  }, {} as Record<CollaboratorRole, Collaborator[]>)

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Active now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborators ({collaborators.length})
            </CardTitle>
            <CardDescription>
              Manage project access and permissions
            </CardDescription>
          </div>
          
          {canManageUsers && onInvite && (
            <Button onClick={onInvite} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 pt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search collaborators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owners</SelectItem>
              <SelectItem value="editor">Editors</SelectItem>
              <SelectItem value="reviewer">Reviewers</SelectItem>
              <SelectItem value="viewer">Viewers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredCollaborators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No collaborators found</p>
            {searchQuery && (
              <p className="text-xs">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <div className="space-y-6">
              {Object.entries(groupedCollaborators).map(([role, roleCollaborators]) => {
                const config = roleConfig[role as CollaboratorRole]
                const RoleIcon = config.icon

                return (
                  <div key={role}>
                    <div className="flex items-center gap-2 mb-3">
                      <RoleIcon className={cn('h-4 w-4', config.color)} />
                      <h3 className="font-medium text-sm">
                        {config.label}s ({roleCollaborators.length})
                      </h3>
                    </div>

                    <div className="space-y-2 ml-6">
                      {roleCollaborators.map((collaborator) => (
                        <CollaboratorRow
                          key={collaborator.userId}
                          collaborator={collaborator}
                          isCurrentUser={collaborator.userId === currentUserId}
                          canManage={canManageUsers && collaborator.userId !== currentUserId}
                          onRemove={onRemove}
                          onChangeRole={onChangeRole}
                          onMessage={onMessage}
                        />
                      ))}
                    </div>

                    <Separator className="mt-4" />
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

interface CollaboratorRowProps {
  collaborator: Collaborator
  isCurrentUser: boolean
  canManage: boolean
  onRemove?: (userId: string) => void
  onChangeRole?: (userId: string, role: CollaboratorRole) => void
  onMessage?: (userId: string) => void
}

function CollaboratorRow({
  collaborator,
  isCurrentUser,
  canManage,
  onRemove,
  onChangeRole,
  onMessage
}: CollaboratorRowProps) {
  const [showDetails, setShowDetails] = useState(false)
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatLastActive = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'Active now'
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const statusColor = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="w-10 h-10">
          <AvatarImage src={collaborator.avatar} alt={collaborator.username} />
          <AvatarFallback className="text-sm">
            {getInitials(collaborator.username)}
          </AvatarFallback>
        </Avatar>
        <div 
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
            statusColor[collaborator.status]
          )} 
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            {collaborator.username}
            {isCurrentUser && (
              <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
            )}
          </span>
          {collaborator.isInvited && (
            <Badge variant="outline" className="text-xs">Invited</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatLastActive(collaborator.lastActiveAt)}</span>
          {collaborator.currentLocation && (
            <>
              <span>•</span>
              <span className="truncate">
                {collaborator.currentLocation.chapterId || 'Browsing'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onMessage && !isCurrentUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMessage(collaborator.userId)}
            className="h-8 w-8 p-0"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        )}

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Manage {collaborator.username}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {onChangeRole && (
                <>
                  <DropdownMenuItem onClick={() => onChangeRole(collaborator.userId, 'editor')}>
                    <User className="h-4 w-4 mr-2" />
                    Make Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeRole(collaborator.userId, 'reviewer')}>
                    <Shield className="h-4 w-4 mr-2" />
                    Make Reviewer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onChangeRole(collaborator.userId, 'viewer')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Make Viewer
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              <DropdownMenuItem onClick={() => setShowDetails(true)}>
                <Settings className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              
              {onRemove && (
                <DropdownMenuItem 
                  onClick={() => onRemove(collaborator.userId)}
                  className="text-destructive"
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  Remove Access
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={collaborator.avatar} alt={collaborator.username} />
                <AvatarFallback className="text-xs">
                  {getInitials(collaborator.username)}
                </AvatarFallback>
              </Avatar>
              {collaborator.username}
            </DialogTitle>
            <DialogDescription>
              Collaboration details and activity history
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Role</label>
                <div className="flex items-center gap-2 mt-1">
                  {React.createElement(roleConfig[collaborator.role].icon, {
                    className: cn('h-4 w-4', roleConfig[collaborator.role].color)
                  })}
                  <span className="text-sm">{roleConfig[collaborator.role].label}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className={cn('w-2 h-2 rounded-full', statusColor[collaborator.status])} />
                  <span className="text-sm capitalize">{collaborator.status}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Joined</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(collaborator.joinedAt)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Last Active</label>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatLastActive(collaborator.lastActiveAt)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Permissions</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {collaborator.permissions.map(permission => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>

            {collaborator.currentLocation && (
              <div>
                <label className="text-sm font-medium">Current Location</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {collaborator.currentLocation.chapterId} → {collaborator.currentLocation.sceneId}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}