'use client'

import React from 'react'
import Link from 'next/link'
import { MoreHorizontal, Calendar, Target, BookOpen, Edit, Copy, Archive, Trash2 } from 'lucide-react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'

interface ProjectListProps {
  projects: Project[]
  onEdit?: (project: Project) => void
  onDuplicate?: (project: Project) => void
  onArchive?: (project: Project) => void
  onDelete?: (project: Project) => void
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

export function ProjectList({
  projects,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  className,
}: ProjectListProps) {
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

  const getProgress = (project: Project) => {
    if (!project.targetWordCount) return 0
    return Math.min((project.wordCount / project.targetWordCount) * 100, 100)
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow 
              key={project.id}
              className={cn(
                'group',
                project.status === 'archived' && 'opacity-70'
              )}
            >
              <TableCell>
                <div className="space-y-1">
                  <Link 
                    href={`/projects/${project.id}`}
                    className="font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {project.title}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>{writingModeIcons[project.writingMode]}</span>
                    <span className="line-clamp-1">{project.description || 'No description'}</span>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className={statusColors[project.status]}>
                  {project.status.replace('-', ' ')}
                </Badge>
              </TableCell>
              
              <TableCell className="text-sm text-muted-foreground">
                {project.genre}
              </TableCell>
              
              <TableCell>
                <div className="space-y-2 min-w-[120px]">
                  <div className="flex items-center justify-between text-xs">
                    <span>{formatWordCount(project.wordCount)}</span>
                    {project.targetWordCount && (
                      <span className="text-muted-foreground">
                        / {formatWordCount(project.targetWordCount)}
                      </span>
                    )}
                  </div>
                  {project.targetWordCount && (
                    <Progress value={getProgress(project)} className="h-1" />
                  )}
                </div>
              </TableCell>
              
              <TableCell className="text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Project actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(project)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {onArchive && project.status !== 'archived' && (
                      <DropdownMenuItem onClick={() => onArchive(project)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(project)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}