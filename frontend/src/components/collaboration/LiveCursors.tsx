'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { UserPresence } from '@/lib/realtime/presence-manager'
import { cn } from '@/lib/utils'

interface LiveCursorsProps {
  users: UserPresence[]
  currentUserId?: string
  containerRef: React.RefObject<HTMLElement>
  className?: string
}

interface CursorPosition {
  userId: string
  x: number
  y: number
  username: string
  color: string
  selection?: {
    start: { x: number; y: number }
    end: { x: number; y: number }
  }
  visible: boolean
}

const userColors = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#EC4899', // pink
  '#6366F1'  // indigo
]

export function LiveCursors({ users, currentUserId, containerRef, className }: LiveCursorsProps) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())
  const [isVisible, setIsVisible] = useState(true)
  const cursorsRef = useRef<Map<string, CursorPosition>>(new Map())
  const animationFrameRef = useRef<number>()

  // Generate consistent colors for users
  const getUserColor = useCallback((userId: string): string => {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash)
    }
    return userColors[Math.abs(hash) % userColors.length]
  }, [])

  // Update cursor positions from user presence data
  useEffect(() => {
    const newCursors = new Map<string, CursorPosition>()

    users
      .filter(user => user.userId !== currentUserId && user.cursor && user.status === 'online')
      .forEach(user => {
        if (user.cursor) {
          newCursors.set(user.userId, {
            userId: user.userId,
            x: user.cursor.x,
            y: user.cursor.y,
            username: user.username,
            color: getUserColor(user.userId),
            selection: user.cursor.selection ? {
              start: { x: user.cursor.selection.start, y: user.cursor.y },
              end: { x: user.cursor.selection.end, y: user.cursor.y }
            } : undefined,
            visible: true
          })
        }
      })

    setCursors(newCursors)
    cursorsRef.current = newCursors
  }, [users, currentUserId, getUserColor])

  // Hide cursors after inactivity
  useEffect(() => {
    const hideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    const showCursors = () => {
      setIsVisible(true)
      clearTimeout(hideTimer)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', showCursors)
      container.addEventListener('keydown', showCursors)
      
      return () => {
        container.removeEventListener('mousemove', showCursors)
        container.removeEventListener('keydown', showCursors)
        clearTimeout(hideTimer)
      }
    }

    return () => clearTimeout(hideTimer)
  }, [containerRef])

  // Smooth cursor animation
  const animateCursors = useCallback(() => {
    // This would contain smooth interpolation logic for cursor movement
    // For now, we'll use direct positioning
    
    animationFrameRef.current = requestAnimationFrame(animateCursors)
  }, [])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animateCursors)
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animateCursors])

  if (!isVisible || cursors.size === 0) {
    return null
  }

  return (
    <div className={cn('absolute inset-0 pointer-events-none z-50', className)}>
      {Array.from(cursors.values()).map(cursor => (
        <React.Fragment key={cursor.userId}>
          {/* Selection highlight */}
          {cursor.selection && (
            <SelectionHighlight
              selection={cursor.selection}
              color={cursor.color}
            />
          )}
          
          {/* Cursor */}
          <RemoteCursor
            position={{ x: cursor.x, y: cursor.y }}
            username={cursor.username}
            color={cursor.color}
            visible={cursor.visible}
          />
        </React.Fragment>
      ))}
    </div>
  )
}

interface RemoteCursorProps {
  position: { x: number; y: number }
  username: string
  color: string
  visible: boolean
}

function RemoteCursor({ position, username, color, visible }: RemoteCursorProps) {
  const [showLabel, setShowLabel] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLabel(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [position])

  if (!visible) return null

  return (
    <div
      className="absolute transition-all duration-75 ease-out"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow-sm"
        style={{ color }}
      >
        <path
          d="M2 2l6 14 2-6 6-2-14-6z"
          fill="currentColor"
          stroke="white"
          strokeWidth="1"
        />
      </svg>
      
      {/* Username label */}
      {showLabel && (
        <div
          className={cn(
            'absolute top-5 left-2 px-2 py-1 rounded text-xs font-medium text-white',
            'animate-in fade-in duration-200',
            'shadow-lg border border-white/20'
          )}
          style={{ backgroundColor: color }}
        >
          {username}
        </div>
      )}
    </div>
  )
}

interface SelectionHighlightProps {
  selection: {
    start: { x: number; y: number }
    end: { x: number; y: number }
  }
  color: string
}

function SelectionHighlight({ selection, color }: SelectionHighlightProps) {
  const width = Math.abs(selection.end.x - selection.start.x)
  const height = Math.abs(selection.end.y - selection.start.y) || 20 // Default line height
  
  const x = Math.min(selection.start.x, selection.end.x)
  const y = Math.min(selection.start.y, selection.end.y)

  return (
    <div
      className="absolute rounded transition-all duration-75 ease-out"
      style={{
        left: x,
        top: y,
        width: width || 2, // Minimum width for cursor
        height,
        backgroundColor: `${color}20`, // 20% opacity
        border: `1px solid ${color}40`
      }}
    />
  )
}

// Hook for tracking mouse cursor position
export function useCursorTracking(
  containerRef: React.RefObject<HTMLElement>,
  onCursorMove?: (position: { x: number; y: number }) => void
) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const throttleRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const newPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }

      setPosition(newPosition)

      // Throttle cursor updates
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }

      throttleRef.current = setTimeout(() => {
        onCursorMove?.(newPosition)
      }, 50) // 20fps update rate
    }

    const handleMouseLeave = () => {
      // Hide cursor when leaving container
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
      onCursorMove?.({ x: -1, y: -1 }) // Signal cursor left
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (throttleRef.current) {
        clearTimeout(throttleRef.current)
      }
    }
  }, [containerRef, onCursorMove])

  return position
}

// Hook for tracking text selection
export function useSelectionTracking(
  containerRef: React.RefObject<HTMLElement>,
  onSelectionChange?: (selection: { start: number; end: number } | null) => void
) {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleSelectionChange = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        setSelection(null)
        onSelectionChange?.(null)
        return
      }

      const range = sel.getRangeAt(0)
      const containerRange = document.createRange()
      containerRange.selectNodeContents(container)

      // Check if selection is within our container
      if (container.contains(range.commonAncestorContainer)) {
        const preSelectionRange = range.cloneRange()
        preSelectionRange.selectNodeContents(container)
        preSelectionRange.setEnd(range.startContainer, range.startOffset)
        
        const start = preSelectionRange.toString().length
        const end = start + range.toString().length

        const newSelection = { start, end }
        setSelection(newSelection)
        onSelectionChange?.(newSelection)
      } else {
        setSelection(null)
        onSelectionChange?.(null)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [containerRef, onSelectionChange])

  return selection
}