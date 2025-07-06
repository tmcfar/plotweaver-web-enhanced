'use client'

import React, { useState } from 'react'
import { 
  Edit3, 
  Eye, 
  MessageSquare, 
  Download, 
  FileText, 
  Clock, 
  User,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Layers,
  GitBranch,
  Tag,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface EditorProps {
  projectId: string
  className?: string
}

// Mock data for editor experience
const mockData = {
  document: {
    title: 'The Secrets of Elderbrook',
    author: 'Sarah Chen',
    lastModified: '2024-01-15T14:30:00Z',
    wordCount: 85432,
    pageCount: 341,
    status: 'in-review'
  },
  annotations: [
    {
      id: '1',
      type: 'comment',
      author: 'Editorial Team',
      timestamp: '2024-01-15T10:30:00Z',
      location: 'Chapter 2, Para 3',
      text: 'This dialogue feels rushed. Consider adding more emotional depth.',
      status: 'open',
      priority: 'medium'
    },
    {
      id: '2',
      type: 'suggestion',
      author: 'Copy Editor',
      timestamp: '2024-01-15T09:15:00Z',
      location: 'Chapter 1, Para 7',
      text: 'Consider replacing "very" with a stronger adjective.',
      status: 'resolved',
      priority: 'low'
    },
    {
      id: '3',
      type: 'revision',
      author: 'Senior Editor',
      timestamp: '2024-01-14T16:45:00Z',
      location: 'Chapter 3, Para 1',
      text: 'This section needs major restructuring for better flow.',
      status: 'in-progress',
      priority: 'high'
    }
  ],
  changes: [
    {
      id: '1',
      type: 'insertion',
      author: 'Author',
      timestamp: '2024-01-15T14:30:00Z',
      location: 'Chapter 2, Para 5',
      text: 'Added character motivation paragraph',
      wordCount: 127
    },
    {
      id: '2',
      type: 'deletion',
      author: 'Editor',
      timestamp: '2024-01-15T13:15:00Z',
      location: 'Chapter 1, Para 12',
      text: 'Removed redundant description',
      wordCount: -89
    },
    {
      id: '3',
      type: 'modification',
      author: 'Copy Editor',
      timestamp: '2024-01-15T11:45:00Z',
      location: 'Chapter 2, Para 8',
      text: 'Improved dialogue attribution',
      wordCount: 12
    }
  ],
  chapters: [
    { id: '1', title: 'The Beginning', status: 'approved', annotations: 3, changes: 2 },
    { id: '2', title: 'Rising Action', status: 'in-review', annotations: 8, changes: 5 },
    { id: '3', title: 'The Twist', status: 'draft', annotations: 2, changes: 1 },
    { id: '4', title: 'Resolution', status: 'not-started', annotations: 0, changes: 0 }
  ]
}

const statusConfig = {
  'open': { color: 'text-red-500', bgColor: 'bg-red-50', label: 'Open' },
  'in-progress': { color: 'text-yellow-500', bgColor: 'bg-yellow-50', label: 'In Progress' },
  'resolved': { color: 'text-green-500', bgColor: 'bg-green-50', label: 'Resolved' }
}

const priorityConfig = {
  'low': { color: 'text-gray-500', label: 'Low' },
  'medium': { color: 'text-yellow-600', label: 'Medium' },
  'high': { color: 'text-red-600', label: 'High' }
}

const chapterStatusConfig = {
  'approved': { icon: CheckCircle, color: 'text-green-500', label: 'Approved' },
  'in-review': { icon: Eye, color: 'text-blue-500', label: 'In Review' },
  'draft': { icon: Edit3, color: 'text-orange-500', label: 'Draft' },
  'not-started': { icon: AlertCircle, color: 'text-gray-400', label: 'Not Started' }
}

export function Editor({ projectId, className }: EditorProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [filter, setFilter] = useState({ status: '', priority: '', author: '' })
  const [searchQuery, setSearchQuery] = useState('')

  const { document, annotations, changes, chapters } = mockData

  // Filter annotations
  const filteredAnnotations = annotations.filter(annotation => {
    if (filter.status && annotation.status !== filter.status) return false
    if (filter.priority && annotation.priority !== filter.priority) return false
    if (filter.author && !annotation.author.toLowerCase().includes(filter.author.toLowerCase())) return false
    if (searchQuery && !annotation.text.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    return `${Math.floor(diffHours / 24)}d ago`
  }

  return (
    <div className={cn('h-full flex flex-col space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editorial Dashboard</h1>
          <p className="text-muted-foreground">Review, annotate, and track changes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve Draft
          </Button>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{document.wordCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Words</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{annotations.filter(a => a.status === 'open').length}</p>
                <p className="text-xs text-muted-foreground">Open Comments</p>
              </div>
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{changes.length}</p>
                <p className="text-xs text-muted-foreground">Recent Changes</p>
              </div>
              <GitBranch className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{document.pageCount}</p>
                <p className="text-xs text-muted-foreground">Pages</p>
              </div>
              <Layers className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="annotations">Annotations</TabsTrigger>
            <TabsTrigger value="changes">Track Changes</TabsTrigger>
            <TabsTrigger value="chapters">Chapter Status</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden mt-6">
            <TabsContent value="overview" className="h-full space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="font-medium">{document.title}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Author</Label>
                        <p className="font-medium">{document.author}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Last Modified</Label>
                        <p className="text-sm">{formatDate(document.lastModified)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Status</Label>
                        <Badge variant="secondary" className="mt-1">
                          {document.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Review Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Review Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-red-600">
                          {annotations.filter(a => a.status === 'open').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Open</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-yellow-600">
                          {annotations.filter(a => a.status === 'in-progress').length}
                        </div>
                        <div className="text-xs text-muted-foreground">In Progress</div>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-green-600">
                          {annotations.filter(a => a.status === 'resolved').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Resolved</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Priority Breakdown</h4>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-red-600">
                            {annotations.filter(a => a.priority === 'high').length}
                          </div>
                          <div className="text-muted-foreground">High</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">
                            {annotations.filter(a => a.priority === 'medium').length}
                          </div>
                          <div className="text-muted-foreground">Medium</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-600">
                            {annotations.filter(a => a.priority === 'low').length}
                          </div>
                          <div className="text-muted-foreground">Low</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="annotations" className="h-full space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search annotations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filter.priority} onValueChange={(value) => setFilter(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Annotations List */}
              <ScrollArea className="flex-1">
                <div className="space-y-3">
                  {filteredAnnotations.map((annotation) => {
                    const statusConfig = statusConfig[annotation.status]
                    const priorityConfig = priorityConfig[annotation.priority]

                    return (
                      <Card key={annotation.id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', statusConfig.color, statusConfig.bgColor)}
                              >
                                {statusConfig.label}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs', priorityConfig.color)}
                              >
                                {priorityConfig.label}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(annotation.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-sm mb-2">{annotation.text}</p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {annotation.author}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {annotation.location}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
                                Reply
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 text-xs">
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="changes" className="h-full">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {changes.map((change) => (
                    <Card key={change.id} className="border-l-4 border-l-blue-500/20">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={change.type === 'insertion' ? 'default' : 
                                     change.type === 'deletion' ? 'destructive' : 'secondary'}
                              className="text-xs capitalize"
                            >
                              {change.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {change.wordCount > 0 ? '+' : ''}{change.wordCount} words
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(change.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm mb-2">{change.text}</p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {change.author}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {change.location}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              Accept
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="chapters" className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chapters.map((chapter) => {
                  const StatusIcon = chapterStatusConfig[chapter.status].icon
                  const statusConfig = chapterStatusConfig[chapter.status]

                  return (
                    <Card key={chapter.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{chapter.title}</h3>
                          <div className="flex items-center gap-1">
                            <StatusIcon className={cn('h-4 w-4', statusConfig.color)} />
                            <Badge variant="outline" className="text-xs">
                              {statusConfig.label}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-orange-600">
                              {chapter.annotations}
                            </div>
                            <div className="text-xs text-muted-foreground">Annotations</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-blue-600">
                              {chapter.changes}
                            </div>
                            <div className="text-xs text-muted-foreground">Changes</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Eye className="h-3 w-3 mr-1" />
                            Review
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Comment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}