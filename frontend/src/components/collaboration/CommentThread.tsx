'use client'

import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Reply, 
  MoreHorizontal,
  Check,
  X,
  Edit,
  Trash2,
  Flag,
  ThumbsUp,
  Pin,
  Eye,
  EyeOff
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export interface Comment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorAvatar?: string
  timestamp: Date
  editedAt?: Date
  isResolved?: boolean
  isPinned?: boolean
  likes?: string[] // User IDs who liked
  replies?: Comment[]
  metadata?: {
    position?: { line: number; column: number }
    selectedText?: string
    type?: 'comment' | 'suggestion' | 'issue'
    depth?: number
  }
}

export interface CommentThread {
  id: string
  projectId: string
  documentId: string
  position: {
    start: number
    end: number
    line?: number
    column?: number
  }
  status: 'open' | 'resolved' | 'archived'
  type: 'comment' | 'suggestion' | 'issue' | 'approval'
  priority: 'low' | 'medium' | 'high'
  comments: Comment[]
  createdAt: Date
  updatedAt: Date
  assignees?: string[]
  tags?: string[]
}

interface CommentThreadProps {
  thread: CommentThread
  currentUserId: string
  isCollapsed?: boolean
  onAddComment?: (content: string, parentId?: string) => void
  onEditComment?: (commentId: string, content: string) => void
  onDeleteComment?: (commentId: string) => void
  onResolveThread?: () => void
  onTogglePin?: () => void
  onLikeComment?: (commentId: string) => void
  className?: string
}

const typeConfig = {
  comment: { icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  suggestion: { icon: Edit, color: 'text-green-600', bgColor: 'bg-green-50' },
  issue: { icon: Flag, color: 'text-red-600', bgColor: 'bg-red-50' },
  approval: { icon: Check, color: 'text-purple-600', bgColor: 'bg-purple-50' }
}

const priorityConfig = {
  low: { color: 'text-gray-600', label: 'Low' },
  medium: { color: 'text-yellow-600', label: 'Medium' },
  high: { color: 'text-red-600', label: 'High' }
}

export function CommentThread({
  thread,
  currentUserId,
  isCollapsed = false,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onResolveThread,
  onTogglePin,
  onLikeComment,
  className
}: CommentThreadProps) {
  const [isExpanded, setIsExpanded] = useState(!isCollapsed)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const TypeIcon = typeConfig[thread.type].icon

  const handleSubmitComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim(), replyingTo || undefined)
      setNewComment('')
      setReplyingTo(null)
    }
  }

  const handleSubmitEdit = (commentId: string) => {
    if (editContent.trim() && onEditComment) {
      onEditComment(commentId, editContent.trim())
      setEditingComment(null)
      setEditContent('')
    }
  }

  const startEditing = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEditing = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const formatTimeAgo = (date: Date) => {
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

  const flattenComments = (comments: Comment[]): Comment[] => {
    const flattened: Comment[] = []
    
    const traverse = (commentList: Comment[], depth = 0) => {
      commentList.forEach(comment => {
        flattened.push({ ...comment, metadata: { ...comment.metadata, depth } })
        if (comment.replies && comment.replies.length > 0) {
          traverse(comment.replies, depth + 1)
        }
      })
    }
    
    traverse(comments)
    return flattened
  }

  const allComments = flattenComments(thread.comments)
  const commentCount = allComments.length

  return (
    <Card className={cn(
      'w-full max-w-md border transition-all',
      thread.status === 'resolved' && 'opacity-75',
      thread.type === 'issue' && 'border-red-200',
      thread.type === 'suggestion' && 'border-green-200',
      className
    )}>
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              typeConfig[thread.type].bgColor
            )}>
              <TypeIcon className={cn('h-4 w-4', typeConfig[thread.type].color)} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {thread.type}
                </Badge>
                {thread.priority !== 'low' && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', priorityConfig[thread.priority].color)}
                  >
                    {priorityConfig[thread.priority].label}
                  </Badge>
                )}
                {thread.status === 'resolved' && (
                  <Badge variant="default" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Resolved
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {commentCount} comment{commentCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onTogglePin && (
                  <DropdownMenuItem onClick={onTogglePin}>
                    <Pin className="h-4 w-4 mr-2" />
                    {thread.comments[0]?.isPinned ? 'Unpin' : 'Pin'} Thread
                  </DropdownMenuItem>
                )}
                
                {onResolveThread && thread.status !== 'resolved' && (
                  <DropdownMenuItem onClick={onResolveThread}>
                    <Check className="h-4 w-4 mr-2" />
                    Resolve Thread
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Flag className="h-4 w-4 mr-2" />
                  Report Thread
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Selected text preview */}
        {thread.comments[0]?.metadata?.selectedText && (
          <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
            <div className="text-muted-foreground mb-1">Selected text:</div>
            <div className="italic">"{thread.comments[0].metadata.selectedText}"</div>
          </div>
        )}
      </CardHeader>

      {/* Comments */}
      {isExpanded && (
        <CardContent className="pt-0">
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {allComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={currentUserId}
                  depth={(comment.metadata as any)?.depth || 0}
                  isEditing={editingComment === comment.id}
                  editContent={editContent}
                  onEdit={() => startEditing(comment)}
                  onCancelEdit={cancelEditing}
                  onSubmitEdit={() => handleSubmitEdit(comment.id)}
                  onEditContentChange={setEditContent}
                  onDelete={() => onDeleteComment?.(comment.id)}
                  onLike={() => onLikeComment?.(comment.id)}
                  onReply={() => setReplyingTo(comment.id)}
                />
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          {/* New comment input */}
          <div className="space-y-2">
            {replyingTo && (
              <div className="text-xs text-muted-foreground">
                Replying to {allComments.find(c => c.id === replyingTo)?.authorName}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(null)}
                  className="h-4 w-4 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Avatar className="w-6 h-6 mt-1">
                <AvatarFallback className="text-xs">You</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <Textarea
                  ref={inputRef}
                  placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSubmitComment()
                    }
                  }}
                />
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    Cmd+Enter to submit
                  </div>
                  
                  <div className="flex gap-2">
                    {(newComment.trim() || replyingTo) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewComment('')
                          setReplyingTo(null)
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                    >
                      {replyingTo ? 'Reply' : 'Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

interface CommentItemProps {
  comment: Comment
  currentUserId: string
  depth: number
  isEditing: boolean
  editContent: string
  onEdit: () => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onEditContentChange: (content: string) => void
  onDelete: () => void
  onLike: () => void
  onReply: () => void
}

function CommentItem({
  comment,
  currentUserId,
  depth,
  isEditing,
  editContent,
  onEdit,
  onCancelEdit,
  onSubmitEdit,
  onEditContentChange,
  onDelete,
  onLike,
  onReply
}: CommentItemProps) {
  const isAuthor = comment.authorId === currentUserId
  const hasLiked = comment.likes?.includes(currentUserId)
  const likeCount = comment.likes?.length || 0

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatTimeAgo = (date: Date) => {
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
    <div 
      className={cn(
        'flex gap-2',
        depth > 0 && 'ml-6 border-l-2 border-muted pl-3'
      )}
    >
      <Avatar className="w-6 h-6 mt-1">
        <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
        <AvatarFallback className="text-xs">
          {getInitials(comment.authorName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(comment.timestamp)}
          </span>
          {comment.editedAt && (
            <Badge variant="outline" className="text-xs">
              Edited
            </Badge>
          )}
          {comment.isPinned && (
            <Pin className="h-3 w-3 text-yellow-600" />
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              className="min-h-[60px] resize-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={onSubmitEdit}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm mb-2 whitespace-pre-wrap">
              {comment.content}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLike}
                className={cn(
                  'h-6 px-2 text-xs',
                  hasLiked && 'text-blue-600'
                )}
              >
                <ThumbsUp className={cn(
                  'h-3 w-3 mr-1',
                  hasLiked && 'fill-current'
                )} />
                {likeCount > 0 && likeCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onReply}
                className="h-6 px-2 text-xs"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>

              {isAuthor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="h-6 px-2 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="h-6 px-2 text-xs text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Hook for managing comment threads
export function useCommentThreads(documentId: string) {
  const [threads, setThreads] = useState<CommentThread[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock data - would be replaced with real API
    const mockThreads: CommentThread[] = [
      {
        id: '1',
        projectId: 'elderbrook',
        documentId,
        position: { start: 120, end: 145, line: 5, column: 20 },
        status: 'open',
        type: 'comment',
        priority: 'medium',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        comments: [
          {
            id: 'c1',
            content: 'This dialogue feels a bit rushed. Consider adding more emotional depth to show Sarah\'s internal conflict.',
            authorId: '1',
            authorName: 'Sarah Chen',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            likes: ['2'],
            metadata: {
              selectedText: '"I can\'t do this anymore," Sarah said.',
              type: 'comment'
            }
          },
          {
            id: 'c2',
            content: 'Good point! I was thinking the same thing. Maybe we could add a beat where she hesitates before speaking?',
            authorId: '2',
            authorName: 'Mike Rodriguez',
            timestamp: new Date(Date.now() - 90 * 60 * 1000),
            likes: ['1'],
            replies: [
              {
                id: 'c3',
                content: 'Exactly! A moment of hesitation would make it more impactful.',
                authorId: '1',
                authorName: 'Sarah Chen',
                timestamp: new Date(Date.now() - 30 * 60 * 1000)
              }
            ]
          }
        ]
      }
    ]

    setTimeout(() => {
      setThreads(mockThreads)
      setIsLoading(false)
    }, 1000)
  }, [documentId])

  const addComment = (threadId: string, content: string, parentId?: string) => {
    // Implementation would send to API
    console.log('Adding comment:', { threadId, content, parentId })
  }

  const editComment = (commentId: string, content: string) => {
    // Implementation would send to API
    console.log('Editing comment:', { commentId, content })
  }

  const deleteComment = (commentId: string) => {
    // Implementation would send to API
    console.log('Deleting comment:', { commentId })
  }

  const resolveThread = (threadId: string) => {
    setThreads(prev => prev.map(thread => 
      thread.id === threadId 
        ? { ...thread, status: 'resolved' as const }
        : thread
    ))
  }

  const likeComment = (commentId: string) => {
    // Implementation would send to API
    console.log('Liking comment:', { commentId })
  }

  return {
    threads,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    resolveThread,
    likeComment
  }
}