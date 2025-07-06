'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Move,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  MoreHorizontal,
  Calendar,
  User,
  FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface StoryLock {
  id: string
  type: 'character' | 'plot' | 'setting' | 'theme' | 'continuity' | 'foundation'
  title: string
  description: string
  content: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'violated' | 'resolved' | 'disabled'
  createdAt: Date
  createdBy: string
  lastModified: Date
  affectedSections: string[]
  dependencies: string[]
  isVisible: boolean
  position?: { x: number; y: number }
}

interface LockManagerProps {
  projectId: string
  locks: StoryLock[]
  onCreateLock?: (lock: Omit<StoryLock, 'id' | 'createdAt' | 'lastModified'>) => void
  onUpdateLock?: (lockId: string, updates: Partial<StoryLock>) => void
  onDeleteLock?: (lockId: string) => void
  onToggleLock?: (lockId: string) => void
  selectedText?: string
  className?: string
}

const lockTypeConfig = {
  character: { 
    icon: User, 
    color: 'text-blue-500', 
    bgColor: 'bg-blue-50 border-blue-200',
    label: 'Character',
    description: 'Character traits, relationships, and development'
  },
  plot: { 
    icon: FileText, 
    color: 'text-green-500', 
    bgColor: 'bg-green-50 border-green-200',
    label: 'Plot',
    description: 'Story events, causality, and plot structure'
  },
  setting: { 
    icon: Calendar, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-50 border-purple-200',
    label: 'Setting',
    description: 'Time, place, and world consistency'
  },
  theme: { 
    icon: Eye, 
    color: 'text-orange-500', 
    bgColor: 'bg-orange-50 border-orange-200',
    label: 'Theme',
    description: 'Thematic elements and messaging'
  },
  continuity: { 
    icon: Shield, 
    color: 'text-red-500', 
    bgColor: 'bg-red-50 border-red-200',
    label: 'Continuity',
    description: 'Consistency and logical flow'
  },
  foundation: { 
    icon: Lock, 
    color: 'text-gray-700', 
    bgColor: 'bg-gray-50 border-gray-200',
    label: 'Foundation',
    description: 'Core story elements that cannot change'
  }
}

const severityConfig = {
  low: { color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Low' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Medium' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'High' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Critical' }
}

export function LockManager({
  projectId,
  locks,
  onCreateLock,
  onUpdateLock,
  onDeleteLock,
  onToggleLock,
  selectedText,
  className
}: LockManagerProps) {
  const [filter, setFilter] = useState<{
    type?: string
    severity?: string
    status?: string
    search?: string
  }>({})
  const [sortBy, setSortBy] = useState<'created' | 'modified' | 'severity' | 'type'>('created')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingLock, setEditingLock] = useState<StoryLock | null>(null)
  const [draggedLock, setDraggedLock] = useState<string | null>(null)

  // Filter and sort locks
  const filteredLocks = locks
    .filter(lock => {
      if (filter.type && lock.type !== filter.type) return false
      if (filter.severity && lock.severity !== filter.severity) return false
      if (filter.status && lock.status !== filter.status) return false
      if (filter.search && !lock.title.toLowerCase().includes(filter.search.toLowerCase()) &&
          !lock.description.toLowerCase().includes(filter.search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'modified':
          return b.lastModified.getTime() - a.lastModified.getTime()
        case 'severity':
          const severityOrder = { critical: 3, high: 2, medium: 1, low: 0 }
          return severityOrder[b.severity] - severityOrder[a.severity]
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

  const handleCreateLock = (lockData: Omit<StoryLock, 'id' | 'createdAt' | 'lastModified'>) => {
    onCreateLock?.(lockData)
    setShowCreateDialog(false)
  }

  const handleEditLock = (lock: StoryLock) => {
    setEditingLock(lock)
  }

  const handleUpdateLock = (updates: Partial<StoryLock>) => {
    if (editingLock) {
      onUpdateLock?.(editingLock.id, updates)
      setEditingLock(null)
    }
  }

  const handleDragStart = (lockId: string) => {
    setDraggedLock(lockId)
  }

  const handleDragEnd = () => {
    setDraggedLock(null)
  }

  const getStatusIcon = (status: StoryLock['status']) => {
    switch (status) {
      case 'active':
        return <Lock className="h-4 w-4 text-green-500" />
      case 'violated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'resolved':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'disabled':
        return <Unlock className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Story Locks
            <Badge variant="secondary">{locks.length}</Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Lock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <CreateLockDialog
                  selectedText={selectedText}
                  onCreateLock={handleCreateLock}
                  onCancel={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          <Input
            placeholder="Search locks..."
            value={filter.search || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            className="h-8"
          />
          
          <Select value={filter.type || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, type: value || undefined }))}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {Object.entries(lockTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filter.severity || ''} onValueChange={(value) => setFilter(prev => ({ ...prev, severity: value || undefined }))}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Severities</SelectItem>
              {Object.entries(severityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="severity">Severity</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {filteredLocks.map((lock) => {
              const typeConfig = lockTypeConfig[lock.type]
              const severityConfig = severityConfig[lock.severity]
              const TypeIcon = typeConfig.icon

              return (
                <div
                  key={lock.id}
                  draggable
                  onDragStart={() => handleDragStart(lock.id)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'border rounded-lg p-3 transition-all cursor-move',
                    typeConfig.bgColor,
                    lock.status === 'violated' && 'border-red-300 bg-red-50',
                    lock.status === 'disabled' && 'opacity-60',
                    draggedLock === lock.id && 'opacity-50 scale-95'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 mt-1">
                      <TypeIcon className={cn('h-4 w-4', typeConfig.color)} />
                      {getStatusIcon(lock.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm truncate">{lock.title}</h4>
                        <Badge variant="outline" className={cn('text-xs', severityConfig.color, severityConfig.bgColor)}>
                          {severityConfig.label}
                        </Badge>
                        {!lock.isVisible && (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {lock.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{lock.createdBy}</span>
                          <span>•</span>
                          <span>{lock.lastModified.toLocaleDateString()}</span>
                          {lock.affectedSections.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{lock.affectedSections.length} sections</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onToggleLock?.(lock.id)}
                          >
                            {lock.status === 'active' ? (
                              <Lock className="h-3 w-3" />
                            ) : (
                              <Unlock className="h-3 w-3" />
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditLock(lock)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onUpdateLock?.(lock.id, { isVisible: !lock.isVisible })}>
                                {lock.isVisible ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Show
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDeleteLock?.(lock.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredLocks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No locks found</p>
                <p className="text-xs">Create your first story lock to maintain consistency</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Edit Lock Dialog */}
      {editingLock && (
        <EditLockDialog
          lock={editingLock}
          onUpdateLock={handleUpdateLock}
          onCancel={() => setEditingLock(null)}
        />
      )}
    </Card>
  )
}

// Create Lock Dialog Component
function CreateLockDialog({ 
  selectedText, 
  onCreateLock, 
  onCancel 
}: {
  selectedText?: string
  onCreateLock: (lock: Omit<StoryLock, 'id' | 'createdAt' | 'lastModified'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    type: 'character' as StoryLock['type'],
    title: '',
    description: '',
    content: selectedText || '',
    severity: 'medium' as StoryLock['severity'],
    affectedSections: [] as string[],
    dependencies: [] as string[],
    isVisible: true
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    onCreateLock({
      ...formData,
      status: 'active',
      createdBy: 'Current User', // This would come from auth context
      position: undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Create Story Lock</DialogTitle>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(lockTypeConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <config.icon className={cn('h-4 w-4', config.color)} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Severity</Label>
          <Select value={formData.severity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(severityConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Brief title for this lock"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="What should remain consistent?"
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Content to Lock</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Specific content, rules, or constraints"
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Lock</Button>
      </div>
    </form>
  )
}

// Edit Lock Dialog Component
function EditLockDialog({ 
  lock, 
  onUpdateLock, 
  onCancel 
}: {
  lock: StoryLock
  onUpdateLock: (updates: Partial<StoryLock>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    type: lock.type,
    title: lock.title,
    description: lock.description,
    content: lock.content,
    severity: lock.severity,
    isVisible: lock.isVisible
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateLock(formData)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Story Lock</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(lockTypeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className={cn('h-4 w-4', config.color)} />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={formData.severity} onValueChange={(value: any) => setFormData(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(severityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}