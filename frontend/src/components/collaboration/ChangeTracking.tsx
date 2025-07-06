'use client'

import React, { useState, useEffect } from 'react'
import { 
  GitBranch, 
  Plus, 
  Minus, 
  Edit, 
  Clock, 
  User,
  Check,
  X,
  Eye,
  EyeOff,
  Filter,
  RotateCcw,
  Download,
  FileText,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export interface DocumentChange {
  id: string
  type: 'insert' | 'delete' | 'replace' | 'move'
  authorId: string
  authorName: string
  authorAvatar?: string
  timestamp: Date
  position: {
    start: number
    end: number
    line?: number
    column?: number
  }
  content: string
  originalContent?: string
  description: string
  status: 'pending' | 'accepted' | 'rejected'
  metadata?: {
    wordCount?: number
    characterCount?: number
    suggestion?: boolean
    aiGenerated?: boolean
  }
}

export interface ChangeSession {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  startTime: Date
  endTime?: Date
  changes: DocumentChange[]
  summary: string
  wordCount: number
}

interface ChangeTrackingProps {
  changes: DocumentChange[]
  sessions?: ChangeSession[]
  currentUserId?: string
  showSuggestions?: boolean
  onAcceptChange?: (changeId: string) => void
  onRejectChange?: (changeId: string) => void
  onViewChange?: (changeId: string) => void
  onRevertToVersion?: (timestamp: Date) => void
  className?: string
}

const changeTypeConfig = {
  insert: { 
    icon: Plus, 
    color: 'text-green-600', 
    bgColor: 'bg-green-50',
    label: 'Added',
    borderColor: 'border-green-200'
  },
  delete: { 
    icon: Minus, 
    color: 'text-red-600', 
    bgColor: 'bg-red-50',
    label: 'Deleted',
    borderColor: 'border-red-200'
  },
  replace: { 
    icon: Edit, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50',
    label: 'Modified',
    borderColor: 'border-blue-200'
  },
  move: { 
    icon: GitBranch, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50',
    label: 'Moved',
    borderColor: 'border-purple-200'
  }
}

const statusConfig = {
  pending: { color: 'text-yellow-600', label: 'Pending', bgColor: 'bg-yellow-50' },
  accepted: { color: 'text-green-600', label: 'Accepted', bgColor: 'bg-green-50' },
  rejected: { color: 'text-red-600', label: 'Rejected', bgColor: 'bg-red-50' }
}

export function ChangeTracking({
  changes,
  sessions = [],
  currentUserId,
  showSuggestions = true,
  onAcceptChange,
  onRejectChange,
  onViewChange,
  onRevertToVersion,
  className
}: ChangeTrackingProps) {
  const [selectedTab, setSelectedTab] = useState('changes')
  const [filterType, setFilterType] = useState('all')
  const [filterAuthor, setFilterAuthor] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set())

  const filteredChanges = changes.filter(change => {
    const matchesType = filterType === 'all' || change.type === filterType
    const matchesAuthor = filterAuthor === 'all' || change.authorId === filterAuthor
    const matchesStatus = filterStatus === 'all' || change.status === filterStatus
    const matchesSearch = !searchQuery || 
      change.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      change.content.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesType && matchesAuthor && matchesStatus && matchesSearch
  })

  const groupedChanges = filteredChanges.reduce((acc, change) => {
    const dateKey = change.timestamp.toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(change)
    return acc
  }, {} as Record<string, DocumentChange[]>)

  const uniqueAuthors = Array.from(new Set(changes.map(c => c.authorId)))
    .map(id => changes.find(c => c.authorId === id)!)
    .filter(Boolean)

  const toggleSessionExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedSessions)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedSessions(newExpanded)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getChangeStats = () => {
    const stats = {
      total: changes.length,
      pending: changes.filter(c => c.status === 'pending').length,
      accepted: changes.filter(c => c.status === 'accepted').length,
      rejected: changes.filter(c => c.status === 'rejected').length,
      suggestions: changes.filter(c => c.metadata?.suggestion).length
    }
    return stats
  }

  const stats = getChangeStats()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Change Tracking
            </CardTitle>
            <CardDescription>
              Review and manage document changes and versions
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Changes
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Version History
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Changes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-xs text-muted-foreground">Accepted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.suggestions}</div>
            <div className="text-xs text-muted-foreground">Suggestions</div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="changes">Changes ({filteredChanges.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessions.length})</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mt-4 mb-6">
            <Input
              placeholder="Search changes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs"
            />
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="insert">Added</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="replace">Modified</SelectItem>
                <SelectItem value="move">Moved</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterAuthor} onValueChange={setFilterAuthor}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Authors</SelectItem>
                {uniqueAuthors.map(author => (
                  <SelectItem key={author.authorId} value={author.authorId}>
                    {author.authorName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TabsContent value="changes" className="space-y-4">
            {Object.keys(groupedChanges).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No changes found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-6">
                  {Object.entries(groupedChanges)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([date, dayChanges]) => (
                      <div key={date}>
                        <h3 className="font-medium text-sm mb-3 sticky top-0 bg-background py-1">
                          {formatDate(new Date(date))}
                        </h3>
                        
                        <div className="space-y-2">
                          {dayChanges
                            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                            .map(change => (
                              <ChangeItem
                                key={change.id}
                                change={change}
                                currentUserId={currentUserId}
                                onAccept={onAcceptChange}
                                onReject={onRejectChange}
                                onView={onViewChange}
                              />
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No writing sessions recorded</p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {sessions
                    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
                    .map(session => (
                      <SessionItem
                        key={session.id}
                        session={session}
                        isExpanded={expandedSessions.has(session.id)}
                        onToggleExpansion={() => toggleSessionExpansion(session.id)}
                        onRevertToVersion={onRevertToVersion}
                      />
                    ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface ChangeItemProps {
  change: DocumentChange
  currentUserId?: string
  onAccept?: (changeId: string) => void
  onReject?: (changeId: string) => void
  onView?: (changeId: string) => void
}

function ChangeItem({ change, currentUserId, onAccept, onReject, onView }: ChangeItemProps) {
  const config = changeTypeConfig[change.type]
  const statusConf = statusConfig[change.status]
  const ChangeIcon = config.icon
  const isOwnChange = change.authorId === currentUserId

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/50',
      config.borderColor
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
        config.bgColor
      )}>
        <ChangeIcon className={cn('h-4 w-4', config.color)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{change.description}</span>
          <Badge variant="outline" className={cn('text-xs', config.color)}>
            {config.label}
          </Badge>
          <Badge variant="outline" className={cn('text-xs', statusConf.color)}>
            {statusConf.label}
          </Badge>
          {change.metadata?.suggestion && (
            <Badge variant="secondary" className="text-xs">
              Suggestion
            </Badge>
          )}
          {change.metadata?.aiGenerated && (
            <Badge variant="secondary" className="text-xs">
              AI Generated
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Avatar className="w-5 h-5">
            <AvatarImage src={change.authorAvatar} alt={change.authorName} />
            <AvatarFallback className="text-xs">
              {getInitials(change.authorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">
            {change.authorName} • {formatTime(change.timestamp)}
          </span>
        </div>

        {/* Content preview */}
        <div className="bg-muted/30 rounded p-2 text-xs font-mono mb-2">
          {change.type === 'delete' && change.originalContent && (
            <div className="text-red-600 line-through">
              {change.originalContent}
            </div>
          )}
          {change.type === 'insert' && (
            <div className="text-green-600">
              + {change.content}
            </div>
          )}
          {change.type === 'replace' && (
            <div>
              {change.originalContent && (
                <div className="text-red-600 line-through">
                  - {change.originalContent}
                </div>
              )}
              <div className="text-green-600">
                + {change.content}
              </div>
            </div>
          )}
        </div>

        {change.metadata && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
            {change.metadata.wordCount !== undefined && (
              <span>{change.metadata.wordCount} words</span>
            )}
            {change.metadata.characterCount !== undefined && (
              <span>{change.metadata.characterCount} characters</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1">
        {onView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(change.id)}
            className="h-7 px-2"
          >
            <Eye className="h-3 w-3" />
          </Button>
        )}
        
        {change.status === 'pending' && !isOwnChange && (
          <>
            {onAccept && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAccept(change.id)}
                className="h-7 px-2 text-green-600 hover:text-green-700"
              >
                <Check className="h-3 w-3" />
              </Button>
            )}
            {onReject && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReject(change.id)}
                className="h-7 px-2 text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface SessionItemProps {
  session: ChangeSession
  isExpanded: boolean
  onToggleExpansion: () => void
  onRevertToVersion?: (timestamp: Date) => void
}

function SessionItem({ session, isExpanded, onToggleExpansion, onRevertToVersion }: SessionItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date()
    const diff = endTime.getTime() - start.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div 
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggleExpansion}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <Avatar className="w-8 h-8">
            <AvatarImage src={session.authorAvatar} alt={session.authorName} />
            <AvatarFallback className="text-sm">
              {getInitials(session.authorName)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{session.summary}</span>
            <Badge variant="secondary" className="text-xs">
              {session.changes.length} changes
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {session.authorName} • {formatTime(session.startTime)} • {formatDuration(session.startTime, session.endTime)} • {session.wordCount} words
          </div>
        </div>

        {onRevertToVersion && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onRevertToVersion(session.startTime)
            }}
            className="h-8"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Revert
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="border-t bg-muted/20 p-3">
          <div className="space-y-2">
            {session.changes.map(change => (
              <div key={change.id} className="flex items-center gap-2 text-sm">
                {React.createElement(changeTypeConfig[change.type].icon, {
                  className: cn('h-3 w-3', changeTypeConfig[change.type].color)
                })}
                <span className="text-xs">{change.description}</span>
                <Badge variant="outline" className="text-xs ml-auto">
                  {formatTime(change.timestamp)}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Hook for managing change tracking
export function useChangeTracking(documentId: string) {
  const [changes, setChanges] = useState<DocumentChange[]>([])
  const [sessions, setSessions] = useState<ChangeSession[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - would be replaced with real API
    const mockChanges: DocumentChange[] = [
      {
        id: '1',
        type: 'insert',
        authorId: '1',
        authorName: 'Sarah Chen',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        position: { start: 120, end: 145 },
        content: 'The ancient trees whispered secrets in the wind.',
        description: 'Added atmospheric description',
        status: 'accepted',
        metadata: { wordCount: 8, suggestion: false }
      },
      {
        id: '2',
        type: 'replace',
        authorId: '2',
        authorName: 'Mike Rodriguez',
        timestamp: new Date(Date.now() - 90 * 60 * 1000),
        position: { start: 200, end: 220 },
        content: '"I can\'t believe this is happening," Sarah whispered.',
        originalContent: '"This is unbelievable," Sarah said.',
        description: 'Improved dialogue to show emotion',
        status: 'pending',
        metadata: { wordCount: 7, suggestion: true }
      }
    ]

    const mockSessions: ChangeSession[] = [
      {
        id: '1',
        authorId: '1',
        authorName: 'Sarah Chen',
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        changes: [mockChanges[0]],
        summary: 'Chapter 3 atmospheric improvements',
        wordCount: 342
      }
    ]

    setTimeout(() => {
      setChanges(mockChanges)
      setSessions(mockSessions)
      setIsLoading(false)
    }, 1000)
  }, [documentId])

  return {
    changes,
    sessions,
    isLoading
  }
}