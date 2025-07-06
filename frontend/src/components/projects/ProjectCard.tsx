'use client'

import React from 'react'
import Link from 'next/link'
import { MoreHorizontal, Calendar, Target, BookOpen } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'

interface ProjectCardProps {
  project: Project
  onEdit?: () => void
  onDuplicate?: () => void
  onArchive?: () => void
  onDelete?: () => void
  className?: string
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-yellow-100 text-yellow-800 border-yellow-200',
}

const writingModeIcons = {
  'professional-writer': '✍️',
  'ai-first': '🤖',
  'editor': '📝',
  'hobbyist': '🎨',
}

export function ProjectCard({
  project,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  className,
}: ProjectCardProps) {
  const progress = project.targetWordCount 
    ? Math.min((project.wordCount / project.targetWordCount) * 100, 100)
    : 0

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatWordCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  return (
    <Card className={cn(
      'group relative transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
      project.status === 'archived' && 'opacity-70',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link 
              href={`/projects/${project.id}`}
              className="block group-hover:text-primary transition-colors"
            >
              <h3 className="font-semibold text-lg leading-tight line-clamp-2">
                {project.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {project.description || 'No description'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Project actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  Edit
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  Duplicate
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onArchive && project.status !== 'archived' && (
                <DropdownMenuItem onClick={onArchive}>
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metadata */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className={statusColors[project.status]}>
              {project.status.replace('-', ' ')}
            </Badge>
            <span className="flex items-center text-muted-foreground">
              <span className="mr-1">{writingModeIcons[project.writingMode]}</span>
              {project.writingMode.replace('-', ' ')}
            </span>
          </div>
          <span className="text-muted-foreground">{project.genre}</span>
        </div>

        {/* Progress */}
        {project.targetWordCount && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <Target className="h-3 w-3" />
                <span>Progress</span>
              </div>
              <span className="text-muted-foreground">
                {formatWordCount(project.wordCount)} / {formatWordCount(project.targetWordCount)}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {project.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Updated {formatDate(project.updatedAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="h-3 w-3" />
            <span>{formatWordCount(project.wordCount)} words</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}