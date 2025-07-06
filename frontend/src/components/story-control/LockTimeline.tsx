'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  Lock,
  Unlock,
  AlertTriangle,
  Shield,
  Clock,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface LockEvent {
  id: string
  lockId: string
  type: 'created' | 'modified' | 'violated' | 'resolved' | 'disabled' | 'enabled'
  timestamp: Date
  description: string
  user: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  location?: {
    chapter?: string
    section?: string
    paragraph?: number
  }
}

interface TimelineLock {
  id: string
  title: string
  type: 'character' | 'plot' | 'setting' | 'theme' | 'continuity' | 'foundation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'violated' | 'resolved' | 'disabled'
  events: LockEvent[]
  color: string
}

interface LockTimelineProps {
  locks: TimelineLock[]
  selectedLockId?: string
  onSelectLock?: (lockId: string) => void
  onSelectEvent?: (event: LockEvent) => void
  timeRange?: { start: Date; end: Date }
  className?: string
}

const eventTypeConfig = {
  created: { icon: Lock, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Created' },
  modified: { icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Modified' },
  violated: { icon: AlertTriangle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Violated' },
  resolved: { icon: Shield, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Resolved' },
  disabled: { icon: Unlock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Disabled' },
  enabled: { icon: Lock, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Enabled' }
}

export function LockTimeline({
  locks,
  selectedLockId,
  onSelectLock,
  onSelectEvent,
  timeRange,
  className
}: LockTimelineProps) {
  const [zoom, setZoom] = useState(1)
  const [viewRange, setViewRange] = useState(
    timeRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    }
  )
  const timelineRef = useRef<HTMLDivElement>(null)
  const [timelineWidth, setTimelineWidth] = useState(800)

  // Calculate timeline dimensions
  const totalDuration = viewRange.end.getTime() - viewRange.start.getTime()
  const pixelsPerMs = (timelineWidth * zoom) / totalDuration

  // Get all events in chronological order
  const allEvents = locks
    .flatMap(lock => 
      lock.events.map(event => ({ ...event, lock }))
    )
    .filter(event => 
      event.timestamp >= viewRange.start && event.timestamp <= viewRange.end
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  // Calculate event positions
  const getEventPosition = (timestamp: Date) => {
    const offset = timestamp.getTime() - viewRange.start.getTime()
    return (offset * pixelsPerMs)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatTimeShort = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 10))
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.1))
  const handleResetZoom = () => setZoom(1)

  const shiftTimeRange = (direction: 'left' | 'right') => {
    const shift = totalDuration * 0.3 // Shift by 30% of current range
    const newStart = new Date(viewRange.start.getTime() + (direction === 'right' ? shift : -shift))
    const newEnd = new Date(viewRange.end.getTime() + (direction === 'right' ? shift : -shift))
    
    setViewRange({ start: newStart, end: newEnd })
  }

  useEffect(() => {
    const updateWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.clientWidth - 40) // Account for padding
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  return (
    <TooltipProvider>
      <Card className={cn('h-full flex flex-col', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Lock Timeline
              <Badge variant="secondary">{allEvents.length} events</Badge>
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => shiftTimeRange('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => shiftTimeRange('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-border mx-1" />

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleResetZoom}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time range indicator */}
          <div className="text-xs text-muted-foreground">
            {formatTime(viewRange.start)} → {formatTime(viewRange.end)}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full relative">
            {/* Lock rows */}
            <ScrollArea className="h-full">
              <div className="space-y-4 pb-4">
                {locks.map((lock, lockIndex) => {
                  const lockEvents = allEvents.filter(e => e.lockId === lock.id)
                  const isSelected = selectedLockId === lock.id

                  return (
                    <div
                      key={lock.id}
                      className={cn(
                        'relative border rounded-lg p-3 transition-colors cursor-pointer',
                        isSelected ? 'border-primary bg-primary/5' : 'border-border',
                        lock.status === 'violated' && 'border-red-200 bg-red-50'
                      )}
                      onClick={() => onSelectLock?.(lock.id)}
                    >
                      {/* Lock header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: lock.color }}
                          />
                          <span className="font-medium text-sm">{lock.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {lock.type}
                          </Badge>
                          <Badge 
                            variant={lock.status === 'violated' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {lock.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {lockEvents.length} events
                        </span>
                      </div>

                      {/* Timeline track */}
                      <div 
                        ref={lockIndex === 0 ? timelineRef : undefined}
                        className="relative h-12 bg-muted/30 rounded-md overflow-hidden"
                        style={{ minWidth: `${timelineWidth * zoom}px` }}
                      >
                        {/* Time grid lines */}
                        {Array.from({ length: Math.floor(totalDuration / (24 * 60 * 60 * 1000)) + 1 }, (_, i) => {
                          const dayTime = new Date(viewRange.start.getTime() + i * 24 * 60 * 60 * 1000)
                          const position = getEventPosition(dayTime)
                          
                          return (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 w-px bg-border/50"
                              style={{ left: `${position}px` }}
                            />
                          )
                        })}

                        {/* Events */}
                        {lockEvents.map(event => {
                          const position = getEventPosition(event.timestamp)
                          const EventIcon = eventTypeConfig[event.type].icon
                          
                          return (
                            <Tooltip key={event.id}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center cursor-pointer transition-transform hover:scale-110',
                                    eventTypeConfig[event.type].bgColor
                                  )}
                                  style={{ 
                                    left: `${position - 16}px`,
                                    backgroundColor: lock.color + '20'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectEvent?.(event)
                                  }}
                                >
                                  <EventIcon 
                                    className={cn('h-4 w-4', eventTypeConfig[event.type].color)} 
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <div className="font-medium">{eventTypeConfig[event.type].label}</div>
                                  <div className="text-xs">{event.description}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatTime(event.timestamp)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    by {event.user}
                                  </div>
                                  {event.location && (
                                    <div className="text-xs text-muted-foreground">
                                      {event.location.chapter && `Chapter: ${event.location.chapter}`}
                                      {event.location.section && ` • Section: ${event.location.section}`}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {locks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No lock events to display</p>
                    <p className="text-xs">Create some story locks to see their timeline</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Time axis */}
            <div className="absolute bottom-0 left-0 right-0 h-8 border-t bg-background">
              <div 
                className="relative h-full"
                style={{ minWidth: `${timelineWidth * zoom}px` }}
              >
                {Array.from({ length: Math.floor(totalDuration / (24 * 60 * 60 * 1000)) + 1 }, (_, i) => {
                  const dayTime = new Date(viewRange.start.getTime() + i * 24 * 60 * 60 * 1000)
                  const position = getEventPosition(dayTime)
                  
                  return (
                    <div
                      key={i}
                      className="absolute top-0 flex flex-col items-center text-xs text-muted-foreground"
                      style={{ left: `${position}px`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-px h-2 bg-border" />
                      <span className="mt-1 whitespace-nowrap">
                        {formatTimeShort(dayTime)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

// Hook for managing timeline data
export function useLockTimeline() {
  const [events, setEvents] = useState<LockEvent[]>([])

  const addEvent = (event: Omit<LockEvent, 'id' | 'timestamp'>) => {
    const newEvent: LockEvent = {
      ...event,
      id: Date.now().toString(),
      timestamp: new Date()
    }
    setEvents(prev => [...prev, newEvent])
    return newEvent.id
  }

  const getEventsForLock = (lockId: string) => {
    return events.filter(event => event.lockId === lockId)
  }

  const getEventsInRange = (start: Date, end: Date) => {
    return events.filter(event => 
      event.timestamp >= start && event.timestamp <= end
    )
  }

  const getEventsByType = (type: LockEvent['type']) => {
    return events.filter(event => event.type === type)
  }

  return {
    events,
    addEvent,
    getEventsForLock,
    getEventsInRange,
    getEventsByType
  }
}