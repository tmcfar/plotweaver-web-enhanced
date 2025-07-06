'use client'

import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Pause, 
  Play,
  MoreHorizontal,
  TrendingUp,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface AgentTask {
  id: string
  type: 'generation' | 'analysis' | 'suggestion' | 'correction'
  title: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  agent: string
  startTime?: Date
  endTime?: Date
  estimatedDuration?: number
  tokensUsed?: number
  cost?: number
  result?: string
}

interface AgentProgressProps {
  tasks: AgentTask[]
  onCancelTask?: (taskId: string) => void
  onRetryTask?: (taskId: string) => void
  onViewResult?: (task: AgentTask) => void
  className?: string
}

const statusIcons = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: Pause
}

const statusColors = {
  pending: 'text-yellow-500',
  running: 'text-blue-500',
  completed: 'text-green-500',
  failed: 'text-red-500',
  cancelled: 'text-gray-500'
}

const taskTypeIcons = {
  generation: Zap,
  analysis: TrendingUp,
  suggestion: CheckCircle,
  correction: XCircle
}

export function AgentProgress({ 
  tasks, 
  onCancelTask, 
  onRetryTask, 
  onViewResult,
  className 
}: AgentProgressProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const activeTasks = tasks.filter(task => task.status === 'running')
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const failedTasks = tasks.filter(task => task.status === 'failed')

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date()
    const diff = end.getTime() - startTime.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  if (tasks.length === 0) {
    return null
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">AI Progress</CardTitle>
          <div className="flex items-center gap-2">
            {activeTasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeTasks.length} active
              </Badge>
            )}
            {failedTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {failedTasks.length} failed
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const StatusIcon = statusIcons[task.status]
          const TaskTypeIcon = taskTypeIcons[task.type]
          const isExpanded = expandedTask === task.id
          
          return (
            <div 
              key={task.id}
              className={cn(
                'border rounded-lg p-3 transition-colors',
                task.status === 'running' && 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50',
                task.status === 'completed' && 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50',
                task.status === 'failed' && 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 mt-0.5">
                  <TaskTypeIcon className="h-4 w-4 text-muted-foreground" />
                  <StatusIcon 
                    className={cn(
                      'h-4 w-4',
                      statusColors[task.status],
                      task.status === 'running' && 'animate-spin'
                    )} 
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{task.title}</h4>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {task.agent}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {task.status === 'running' && onCancelTask && (
                            <DropdownMenuItem onClick={() => onCancelTask(task.id)}>
                              Cancel
                            </DropdownMenuItem>
                          )}
                          {task.status === 'failed' && onRetryTask && (
                            <DropdownMenuItem onClick={() => onRetryTask(task.id)}>
                              Retry
                            </DropdownMenuItem>
                          )}
                          {task.status === 'completed' && task.result && onViewResult && (
                            <DropdownMenuItem onClick={() => onViewResult(task)}>
                              View Result
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                            {isExpanded ? 'Hide Details' : 'Show Details'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {task.description}
                  </p>

                  {/* Progress bar for running tasks */}
                  {task.status === 'running' && (
                    <div className="space-y-1 mb-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-1" />
                    </div>
                  )}

                  {/* Task metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {task.startTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(task.startTime, task.endTime)}
                      </span>
                    )}
                    
                    {task.tokensUsed && (
                      <span>{task.tokensUsed} tokens</span>
                    )}
                    
                    {task.cost && (
                      <span>{formatCost(task.cost)}</span>
                    )}
                    
                    <span className="capitalize">{task.status}</span>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="font-medium">Type:</span> {task.type}
                        </div>
                        {task.estimatedDuration && (
                          <div>
                            <span className="font-medium">Estimated Duration:</span> {task.estimatedDuration}s
                          </div>
                        )}
                        {task.startTime && (
                          <div>
                            <span className="font-medium">Started:</span> {task.startTime.toLocaleTimeString()}
                          </div>
                        )}
                        {task.endTime && (
                          <div>
                            <span className="font-medium">Completed:</span> {task.endTime.toLocaleTimeString()}
                          </div>
                        )}
                        {task.result && task.status === 'completed' && (
                          <div>
                            <span className="font-medium">Result Preview:</span>
                            <div className="mt-1 p-2 bg-muted rounded text-xs max-h-20 overflow-y-auto">
                              {task.result.length > 100 ? `${task.result.slice(0, 100)}...` : task.result}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Summary stats */}
        {tasks.length > 3 && (
          <div className="pt-3 border-t border-border/50">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="font-medium text-green-600">{completedTasks.length}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">{activeTasks.length}</div>
                <div className="text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="font-medium text-red-600">{failedTasks.length}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Hook for managing agent progress
export function useAgentProgress() {
  const [tasks, setTasks] = useState<AgentTask[]>([])

  const addTask = (task: Omit<AgentTask, 'id' | 'startTime'>) => {
    const newTask: AgentTask = {
      ...task,
      id: Date.now().toString(),
      startTime: new Date()
    }
    setTasks(prev => [...prev, newTask])
    return newTask.id
  }

  const updateTask = (taskId: string, updates: Partial<AgentTask>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            ...updates,
            endTime: updates.status === 'completed' || updates.status === 'failed' 
              ? new Date() 
              : task.endTime
          }
        : task
    ))
  }

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const clearCompleted = () => {
    setTasks(prev => prev.filter(task => task.status !== 'completed'))
  }

  const cancelTask = (taskId: string) => {
    updateTask(taskId, { status: 'cancelled', endTime: new Date() })
  }

  const retryTask = (taskId: string) => {
    updateTask(taskId, { 
      status: 'pending', 
      progress: 0, 
      startTime: new Date(), 
      endTime: undefined 
    })
  }

  return {
    tasks,
    addTask,
    updateTask,
    removeTask,
    clearCompleted,
    cancelTask,
    retryTask
  }
}