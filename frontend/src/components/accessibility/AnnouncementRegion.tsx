'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  message: string
  priority: 'polite' | 'assertive'
  timestamp: number
  timeout?: number
}

interface AnnouncementRegionProps {
  className?: string
  position?: 'top' | 'bottom' | 'sr-only'
  maxAnnouncements?: number
  defaultTimeout?: number
}

export function AnnouncementRegion({
  className,
  position = 'sr-only',
  maxAnnouncements = 5,
  defaultTimeout = 5000
}: AnnouncementRegionProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null)
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  // Add new announcement
  const announce = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    timeout = defaultTimeout
  ) => {
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random()}`,
      message,
      priority,
      timestamp: Date.now(),
      timeout
    }

    setAnnouncements(prev => {
      const newAnnouncements = [...prev, announcement]
      // Keep only the most recent announcements
      return newAnnouncements.slice(-maxAnnouncements)
    })

    // Set current announcement for immediate reading
    setCurrentAnnouncement(announcement)

    // Clear the announcement after timeout
    if (timeout > 0) {
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== announcement.id))
      }, timeout)
    }
  }, [defaultTimeout, maxAnnouncements])

  // Clear current announcement
  useEffect(() => {
    if (currentAnnouncement) {
      const timer = setTimeout(() => {
        setCurrentAnnouncement(null)
      }, 100) // Brief delay to ensure screen reader pickup

      return () => clearTimeout(timer)
    }
  }, [currentAnnouncement])

  // Global announcement function
  useEffect(() => {
    // Make announce function globally available
    ;(window as any).announceToScreenReader = announce

    return () => {
      delete (window as any).announceToScreenReader
    }
  }, [announce])

  const baseClasses = position === 'sr-only' 
    ? 'sr-only' 
    : cn(
        'fixed z-[9999] left-4 right-4 pointer-events-none',
        position === 'top' ? 'top-4' : 'bottom-4'
      )

  return (
    <>
      {/* Screen reader announcements */}
      <div
        ref={politeRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {currentAnnouncement?.priority === 'polite' && currentAnnouncement.message}
      </div>

      <div
        ref={assertiveRef}
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
      >
        {currentAnnouncement?.priority === 'assertive' && currentAnnouncement.message}
      </div>

      {/* Visual announcements (if not sr-only) */}
      {position !== 'sr-only' && (
        <div className={cn(baseClasses, className)}>
          <div className="space-y-2">
            {announcements.slice(-3).map((announcement) => (
              <VisualAnnouncement
                key={announcement.id}
                announcement={announcement}
                onDismiss={() => {
                  setAnnouncements(prev => 
                    prev.filter(a => a.id !== announcement.id)
                  )
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// Visual announcement component
interface VisualAnnouncementProps {
  announcement: Announcement
  onDismiss: () => void
}

function VisualAnnouncement({ announcement, onDismiss }: VisualAnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(onDismiss, 300) // Wait for animation
  }

  const priorityStyles = {
    polite: 'bg-blue-600 border-blue-700',
    assertive: 'bg-red-600 border-red-700'
  }

  return (
    <div
      className={cn(
        'px-4 py-2 rounded-md text-white text-sm shadow-lg border',
        'transform transition-all duration-300 pointer-events-auto',
        isVisible 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0',
        priorityStyles[announcement.priority]
      )}
      role={announcement.priority === 'assertive' ? 'alert' : 'status'}
    >
      <div className="flex items-center justify-between gap-3">
        <span>{announcement.message}</span>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-white/80 hover:text-white focus:outline-none focus:text-white"
          aria-label="Dismiss announcement"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Hook for making announcements
export function useAnnouncements() {
  const announce = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    timeout = 5000
  ) => {
    if (typeof window !== 'undefined') {
      const announcer = (window as any).announceToScreenReader
      if (announcer) {
        announcer(message, priority, timeout)
      } else {
        // Fallback for when AnnouncementRegion is not mounted
        const region = document.createElement('div')
        region.setAttribute('aria-live', priority)
        region.setAttribute('aria-atomic', 'true')
        region.className = 'sr-only'
        region.textContent = message

        document.body.appendChild(region)

        setTimeout(() => {
          document.body.removeChild(region)
        }, timeout)
      }
    }
  }, [])

  const announcePolite = useCallback((message: string, timeout?: number) => {
    announce(message, 'polite', timeout)
  }, [announce])

  const announceAssertive = useCallback((message: string, timeout?: number) => {
    announce(message, 'assertive', timeout)
  }, [announce])

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite')
  }, [announce])

  const announceError = useCallback((message: string) => {
    announce(`Error: ${message}`, 'assertive')
  }, [announce])

  const announceWarning = useCallback((message: string) => {
    announce(`Warning: ${message}`, 'assertive')
  }, [announce])

  const announceInfo = useCallback((message: string) => {
    announce(`Information: ${message}`, 'polite')
  }, [announce])

  return {
    announce,
    announcePolite,
    announceAssertive,
    announceSuccess,
    announceError,
    announceWarning,
    announceInfo
  }
}

// Status announcer for form states
interface FormStatusAnnouncerProps {
  children: React.ReactNode
  announceOnMount?: boolean
  mountMessage?: string
}

export function FormStatusAnnouncer({
  children,
  announceOnMount = false,
  mountMessage = 'Form loaded'
}: FormStatusAnnouncerProps) {
  const { announcePolite } = useAnnouncements()

  useEffect(() => {
    if (announceOnMount) {
      announcePolite(mountMessage)
    }
  }, [announceOnMount, mountMessage, announcePolite])

  return <>{children}</>
}

// Loading state announcer
interface LoadingAnnouncerProps {
  isLoading: boolean
  loadingMessage?: string
  completedMessage?: string
  errorMessage?: string
  error?: Error | null
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading...',
  completedMessage = 'Loading completed',
  errorMessage = 'Loading failed',
  error
}: LoadingAnnouncerProps) {
  const { announcePolite, announceError } = useAnnouncements()
  const [previousLoading, setPreviousLoading] = useState(isLoading)

  useEffect(() => {
    // Announce when loading starts
    if (isLoading && !previousLoading) {
      announcePolite(loadingMessage)
    }
    
    // Announce when loading completes
    if (!isLoading && previousLoading) {
      if (error) {
        announceError(errorMessage)
      } else {
        announcePolite(completedMessage)
      }
    }

    setPreviousLoading(isLoading)
  }, [isLoading, previousLoading, loadingMessage, completedMessage, errorMessage, error, announcePolite, announceError])

  return null
}

// Navigation change announcer
export function NavigationAnnouncer() {
  const { announcePolite } = useAnnouncements()

  useEffect(() => {
    const announceNavigation = () => {
      // Get the page title or main heading
      const title = document.title || 
                   document.querySelector('h1')?.textContent ||
                   'Page changed'
      
      announcePolite(`Navigated to ${title}`)
    }

    // Announce on route changes (for SPA)
    const handlePopState = () => {
      setTimeout(announceNavigation, 100) // Delay to ensure content is updated
    }

    window.addEventListener('popstate', handlePopState)

    // For Next.js router changes
    if (typeof window !== 'undefined') {
      const router = (window as any).__NEXT_ROUTER__
      if (router) {
        router.events.on('routeChangeComplete', announceNavigation)
        return () => {
          router.events.off('routeChangeComplete', announceNavigation)
          window.removeEventListener('popstate', handlePopState)
        }
      }
    }

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [announcePolite])

  return null
}

// Live region for dynamic content updates
interface LiveRegionProps {
  children: React.ReactNode
  priority?: 'polite' | 'assertive'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
  className
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
      role={priority === 'assertive' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

// Context for managing announcement regions
interface AnnouncementContextType {
  announce: (message: string, priority?: 'polite' | 'assertive', timeout?: number) => void
}

const AnnouncementContext = React.createContext<AnnouncementContextType | null>(null)

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const announce = useCallback((
    message: string,
    priority: 'polite' | 'assertive' = 'polite',
    timeout = 5000
  ) => {
    const announcement: Announcement = {
      id: `announcement-${Date.now()}-${Math.random()}`,
      message,
      priority,
      timestamp: Date.now(),
      timeout
    }

    setAnnouncements(prev => [...prev, announcement])

    if (timeout > 0) {
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(a => a.id !== announcement.id))
      }, timeout)
    }
  }, [])

  return (
    <AnnouncementContext.Provider value={{ announce }}>
      {children}
      <AnnouncementRegion />
    </AnnouncementContext.Provider>
  )
}

export function useAnnouncementContext() {
  const context = React.useContext(AnnouncementContext)
  if (!context) {
    throw new Error('useAnnouncementContext must be used within AnnouncementProvider')
  }
  return context
}