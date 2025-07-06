'use client'

import React, { Suspense, lazy, useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Lazy loading with retry mechanism
interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
  retryCount?: number
  delay?: number
  className?: string
}

export function LazyComponent({
  loader,
  fallback = <ComponentSkeleton />,
  errorFallback = <ErrorFallback />,
  retryCount = 3,
  delay = 0,
  className,
  ...props
}: LazyComponentProps & any) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [attempts, setAttempts] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const loadComponent = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Add artificial delay if specified
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        const module = await loader()
        
        if (mountedRef.current) {
          setComponent(() => module.default)
          setIsLoading(false)
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err as Error)
          setIsLoading(false)
          
          // Retry logic
          if (attempts < retryCount) {
            setTimeout(() => {
              if (mountedRef.current) {
                setAttempts(prev => prev + 1)
                loadComponent()
              }
            }, 1000 * Math.pow(2, attempts)) // Exponential backoff
          }
        }
      }
    }

    loadComponent()

    return () => {
      mountedRef.current = false
    }
  }, [loader, delay, retryCount, attempts])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  if (error && attempts >= retryCount) {
    return <div className={className}>{errorFallback}</div>
  }

  if (isLoading || !Component) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <div className={className}>
      <Component {...props} />
    </div>
  )
}

// Intersection Observer based lazy loading
interface IntersectionLazyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
  className?: string
  minHeight?: number
}

export function IntersectionLazy({
  children,
  fallback = <ComponentSkeleton />,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true,
  className,
  minHeight = 200
}: IntersectionLazyProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
            observer.disconnect()
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [rootMargin, threshold, triggerOnce])

  const shouldShowContent = isVisible || hasTriggered

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight: shouldShowContent ? 'auto' : minHeight }}
    >
      {shouldShowContent ? children : fallback}
    </div>
  )
}

// Code splitting for route-based components
export const LazyRoutes = {
  Dashboard: lazy(() => 
    import('@/app/(dashboard)/dashboard/page').catch(() => 
      import('@/components/fallbacks/RouteFallback')
    )
  ),
  Projects: lazy(() => 
    import('@/app/(dashboard)/projects/page').catch(() => 
      import('@/components/fallbacks/RouteFallback')
    )
  ),
  ProjectEditor: lazy(() => 
    import('@/app/(dashboard)/projects/[id]/page').catch(() => 
      import('@/components/fallbacks/RouteFallback')
    )
  ),
  Settings: lazy(() => 
    import('@/app/(dashboard)/settings/page').catch(() => 
      import('@/components/fallbacks/RouteFallback')
    )
  )
}

// Panel-specific lazy loaded components
export const LazyPanels = {
  AIAssistant: lazy(() => 
    import('@/components/ai/AIAssistant').catch(() => 
      import('@/components/fallbacks/PanelFallback')
    )
  ),
  CharacterPanel: lazy(() => 
    import('@/components/editor/panels/CharacterPanel').catch(() => 
      import('@/components/fallbacks/PanelFallback')
    )
  ),
  TimelinePanel: lazy(() => 
    import('@/components/editor/panels/TimelinePanel').catch(() => 
      import('@/components/fallbacks/PanelFallback')
    )
  ),
  OutlinePanel: lazy(() => 
    import('@/components/editor/panels/OutlinePanel').catch(() => 
      import('@/components/fallbacks/PanelFallback')
    )
  ),
  LockManager: lazy(() => 
    import('@/components/story-control/LockManager').catch(() => 
      import('@/components/fallbacks/PanelFallback')
    )
  ),
  CollaborationPanel: lazy(() => 
    import('@/components/collaboration/CollaboratorList').catch(() => 
      import('@/components/fallbacks/PanelFallback')
    )
  )
}

// Dynamic import with preloading
interface DynamicPanelProps {
  panelType: keyof typeof LazyPanels
  preload?: boolean
  className?: string
  [key: string]: any
}

export function DynamicPanel({ 
  panelType, 
  preload = false, 
  className,
  ...props 
}: DynamicPanelProps) {
  const Component = LazyPanels[panelType]

  useEffect(() => {
    if (preload) {
      // Preload the component
      Component.preload?.()
    }
  }, [Component, preload])

  return (
    <Suspense fallback={<PanelSkeleton />}>
      <div className={className}>
        <Component {...props} />
      </div>
    </Suspense>
  )
}

// Progressive loading for heavy components
interface ProgressiveLoaderProps {
  stages: Array<{
    component: () => Promise<{ default: React.ComponentType<any> }>
    condition?: () => boolean
    priority: 'high' | 'medium' | 'low'
  }>
  fallback?: React.ReactNode
  className?: string
}

export function ProgressiveLoader({
  stages,
  fallback = <ComponentSkeleton />,
  className
}: ProgressiveLoaderProps) {
  const [loadedComponents, setLoadedComponents] = useState<React.ComponentType<any>[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadStages = async () => {
      // Sort stages by priority
      const sortedStages = [...stages].sort((a, b) => {
        const priorities = { high: 3, medium: 2, low: 1 }
        return priorities[b.priority] - priorities[a.priority]
      })

      const components: React.ComponentType<any>[] = []

      for (const stage of sortedStages) {
        if (!stage.condition || stage.condition()) {
          try {
            const module = await stage.component()
            components.push(module.default)
          } catch (error) {
            console.error('Failed to load stage:', error)
          }
        }
      }

      setLoadedComponents(components)
      setIsLoading(false)
    }

    loadStages()
  }, [stages])

  if (isLoading) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <div className={className}>
      {loadedComponents.map((Component, index) => (
        <Component key={index} />
      ))}
    </div>
  )
}

// Adaptive loading based on connection speed
export function useAdaptiveLoading() {
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast')
  const [shouldPreload, setShouldPreload] = useState(true)

  useEffect(() => {
    // Check connection speed
    const connection = (navigator as any).connection
    if (connection) {
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType
        const isSlowConnection = ['slow-2g', '2g'].includes(effectiveType)
        setConnectionSpeed(isSlowConnection ? 'slow' : 'fast')
        setShouldPreload(!isSlowConnection && !connection.saveData)
      }

      updateConnectionInfo()
      connection.addEventListener('change', updateConnectionInfo)

      return () => {
        connection.removeEventListener('change', updateConnectionInfo)
      }
    }
  }, [])

  return {
    connectionSpeed,
    shouldPreload,
    isSlowConnection: connectionSpeed === 'slow'
  }
}

// Bundle splitting wrapper
interface BundleSplitProps {
  bundleName: string
  children: React.ReactNode
  fallback?: React.ReactNode
  preload?: boolean
}

export function BundleSplit({
  bundleName,
  children,
  fallback = <ComponentSkeleton />,
  preload = false
}: BundleSplitProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const { shouldPreload } = useAdaptiveLoading()

  useEffect(() => {
    if (preload && shouldPreload) {
      // Preload bundle
      import(`@/bundles/${bundleName}`).then(() => {
        setIsLoaded(true)
      }).catch(error => {
        console.error(`Failed to preload bundle ${bundleName}:`, error)
      })
    } else {
      setIsLoaded(true)
    }
  }, [bundleName, preload, shouldPreload])

  if (!isLoaded) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Fallback components
function ComponentSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
        <div className="h-20 bg-muted rounded"></div>
      </div>
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-4/6"></div>
        </div>
        <div className="mt-6 h-32 bg-muted rounded"></div>
      </div>
    </div>
  )
}

function ErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <span className="text-red-600 text-xl">⚠</span>
      </div>
      <h3 className="text-lg font-medium mb-2">Failed to load component</h3>
      <p className="text-muted-foreground text-sm">Please try refreshing the page</p>
    </div>
  )
}

// Hook for managing lazy loading state
export function useLazyLoading() {
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())

  const setLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => new Map(prev.set(key, loading)))
  }

  const setError = (key: string, error: Error | null) => {
    setErrors(prev => {
      const newMap = new Map(prev)
      if (error) {
        newMap.set(key, error)
      } else {
        newMap.delete(key)
      }
      return newMap
    })
  }

  const isLoading = (key: string) => loadingStates.get(key) || false
  const getError = (key: string) => errors.get(key) || null

  return {
    setLoading,
    setError,
    isLoading,
    getError,
    loadingStates,
    errors
  }
}