// Motion and animation accessibility utilities
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Motion preference types
export type MotionPreference = 'reduce' | 'no-preference'
export type AnimationDuration = 'none' | 'short' | 'medium' | 'long'
export type AnimationType = 'fade' | 'slide' | 'scale' | 'bounce' | 'spin'

// Motion configuration
interface MotionConfig {
  respectSystemPreferences: boolean
  defaultDuration: AnimationDuration
  enableAnimations: boolean
  reducedMotionOverride?: boolean
}

// Motion context type
interface MotionContextType {
  prefersReducedMotion: boolean
  animationDuration: AnimationDuration
  enableAnimations: boolean
  setMotionPreferences: (preferences: Partial<MotionConfig>) => void
  getAnimationProps: (animation: AnimationType, duration?: AnimationDuration) => string
  shouldAnimate: (animationType?: AnimationType) => boolean
}

// Motion context
const MotionContext = createContext<MotionContextType | null>(null)

// Default motion configuration
const defaultMotionConfig: MotionConfig = {
  respectSystemPreferences: true,
  defaultDuration: 'medium',
  enableAnimations: true
}

// Animation duration mappings
const DURATION_MAP: Record<AnimationDuration, string> = {
  none: '0ms',
  short: '150ms',
  medium: '300ms',
  long: '500ms'
}

// Animation classes for different types
const ANIMATION_CLASSES: Record<AnimationType, Record<AnimationDuration, string>> = {
  fade: {
    none: '',
    short: 'transition-opacity duration-150',
    medium: 'transition-opacity duration-300',
    long: 'transition-opacity duration-500'
  },
  slide: {
    none: '',
    short: 'transition-transform duration-150',
    medium: 'transition-transform duration-300',
    long: 'transition-transform duration-500'
  },
  scale: {
    none: '',
    short: 'transition-transform duration-150',
    medium: 'transition-transform duration-300',
    long: 'transition-transform duration-500'
  },
  bounce: {
    none: '',
    short: 'transition-all duration-150',
    medium: 'transition-all duration-300',
    long: 'transition-all duration-500'
  },
  spin: {
    none: '',
    short: 'transition-transform duration-150',
    medium: 'transition-transform duration-300',
    long: 'transition-transform duration-500'
  }
}

// Motion provider component
interface MotionProviderProps {
  children: React.ReactNode
  config?: Partial<MotionConfig>
}

export function MotionProvider({ children, config = {} }: MotionProviderProps) {
  const [motionConfig, setMotionConfig] = useState<MotionConfig>({
    ...defaultMotionConfig,
    ...config
  })
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  
  // Detect system motion preferences
  useEffect(() => {
    if (!motionConfig.respectSystemPreferences || typeof window === 'undefined') {
      return
    }
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches)
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [motionConfig.respectSystemPreferences])
  
  // Determine if animations should be enabled
  const enableAnimations = motionConfig.enableAnimations && 
    (motionConfig.reducedMotionOverride !== undefined 
      ? !motionConfig.reducedMotionOverride 
      : !prefersReducedMotion)
  
  // Get animation duration based on preferences
  const animationDuration: AnimationDuration = enableAnimations 
    ? motionConfig.defaultDuration 
    : 'none'
  
  const setMotionPreferences = useCallback((preferences: Partial<MotionConfig>) => {
    setMotionConfig(prev => ({ ...prev, ...preferences }))
  }, [])
  
  const getAnimationProps = useCallback((
    animation: AnimationType, 
    duration: AnimationDuration = animationDuration
  ): string => {
    if (!enableAnimations) {
      return ANIMATION_CLASSES[animation].none
    }
    
    return ANIMATION_CLASSES[animation][duration] || ''
  }, [enableAnimations, animationDuration])
  
  const shouldAnimate = useCallback((animationType?: AnimationType): boolean => {
    if (!enableAnimations) return false
    
    // Additional logic for specific animation types
    if (animationType === 'bounce' && prefersReducedMotion) return false
    if (animationType === 'spin' && prefersReducedMotion) return false
    
    return true
  }, [enableAnimations, prefersReducedMotion])
  
  const value: MotionContextType = {
    prefersReducedMotion,
    animationDuration,
    enableAnimations,
    setMotionPreferences,
    getAnimationProps,
    shouldAnimate
  }
  
  return (
    <MotionContext.Provider value={value}>
      {children}
    </MotionContext.Provider>
  )
}

// Hook to use motion context
export function useMotion() {
  const context = useContext(MotionContext)
  if (!context) {
    throw new Error('useMotion must be used within MotionProvider')
  }
  return context
}

// Hook for safe animations
export function useSafeAnimation(animationType: AnimationType = 'fade') {
  const { getAnimationProps, shouldAnimate, animationDuration } = useMotion()
  
  const getProps = useCallback((duration?: AnimationDuration) => {
    return getAnimationProps(animationType, duration)
  }, [getAnimationProps, animationType])
  
  const canAnimate = shouldAnimate(animationType)
  
  return {
    getProps,
    canAnimate,
    duration: animationDuration,
    className: getProps()
  }
}

// Animated component wrapper
interface AnimatedProps {
  children: React.ReactNode
  animation?: AnimationType
  duration?: AnimationDuration
  className?: string
  style?: React.CSSProperties
  trigger?: boolean
  delay?: number
  onAnimationEnd?: () => void
}

export function Animated({
  children,
  animation = 'fade',
  duration,
  className,
  style,
  trigger = true,
  delay = 0,
  onAnimationEnd
}: AnimatedProps) {
  const { getAnimationProps, shouldAnimate } = useMotion()
  const [isVisible, setIsVisible] = useState(!trigger)
  
  useEffect(() => {
    if (trigger && shouldAnimate(animation)) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)
      
      return () => clearTimeout(timer)
    } else if (trigger) {
      setIsVisible(true)
    }
  }, [trigger, delay, animation, shouldAnimate])
  
  const animationClass = getAnimationProps(animation, duration)
  
  const handleAnimationEnd = () => {
    onAnimationEnd?.()
  }
  
  return (
    <div
      className={cn(
        animationClass,
        {
          'opacity-0': animation === 'fade' && !isVisible,
          'opacity-100': animation === 'fade' && isVisible,
          'transform translate-y-4': animation === 'slide' && !isVisible,
          'transform translate-y-0': animation === 'slide' && isVisible,
          'transform scale-95': animation === 'scale' && !isVisible,
          'transform scale-100': animation === 'scale' && isVisible
        },
        className
      )}
      style={style}
      onAnimationEnd={handleAnimationEnd}
      onTransitionEnd={handleAnimationEnd}
    >
      {children}
    </div>
  )
}

// Fade transition component
interface FadeTransitionProps {
  children: React.ReactNode
  show: boolean
  duration?: AnimationDuration
  className?: string
}

export function FadeTransition({ 
  children, 
  show, 
  duration,
  className 
}: FadeTransitionProps) {
  return (
    <Animated
      animation="fade"
      duration={duration}
      trigger={show}
      className={className}
    >
      {show && children}
    </Animated>
  )
}

// Slide transition component
interface SlideTransitionProps {
  children: React.ReactNode
  show: boolean
  direction?: 'up' | 'down' | 'left' | 'right'
  duration?: AnimationDuration
  className?: string
}

export function SlideTransition({
  children,
  show,
  direction = 'up',
  duration,
  className
}: SlideTransitionProps) {
  const directionClasses = {
    up: show ? 'translate-y-0' : 'translate-y-4',
    down: show ? 'translate-y-0' : '-translate-y-4',
    left: show ? 'translate-x-0' : 'translate-x-4',
    right: show ? 'translate-x-0' : '-translate-x-4'
  }
  
  return (
    <Animated
      animation="slide"
      duration={duration}
      trigger={show}
      className={cn(directionClasses[direction], className)}
    >
      {show && children}
    </Animated>
  )
}

// Scale transition component
interface ScaleTransitionProps {
  children: React.ReactNode
  show: boolean
  duration?: AnimationDuration
  className?: string
}

export function ScaleTransition({
  children,
  show,
  duration,
  className
}: ScaleTransitionProps) {
  return (
    <Animated
      animation="scale"
      duration={duration}
      trigger={show}
      className={className}
    >
      {show && children}
    </Animated>
  )
}

// Loading spinner with motion respect
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const { shouldAnimate, prefersReducedMotion } = useMotion()
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }
  
  if (prefersReducedMotion) {
    // Show a static loading indicator for reduced motion
    return (
      <div className={cn('border-2 border-gray-300 border-t-gray-600 rounded-full', sizeClasses[size], className)}>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
  
  return (
    <div
      className={cn(
        'border-2 border-gray-300 border-t-gray-600 rounded-full',
        shouldAnimate('spin') && 'animate-spin',
        sizeClasses[size],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Pulse animation component (respects motion preferences)
interface PulseProps {
  children: React.ReactNode
  enabled?: boolean
  className?: string
}

export function Pulse({ children, enabled = true, className }: PulseProps) {
  const { shouldAnimate } = useMotion()
  
  return (
    <div
      className={cn(
        enabled && shouldAnimate('fade') && 'animate-pulse',
        className
      )}
    >
      {children}
    </div>
  )
}

// Motion-aware CSS custom properties
export function useMotionCSS() {
  const { animationDuration, enableAnimations } = useMotion()
  
  const cssVariables = {
    '--animation-duration': enableAnimations ? DURATION_MAP[animationDuration] : '0ms',
    '--animation-enabled': enableAnimations ? '1' : '0'
  }
  
  return cssVariables
}

// Intersection observer with motion respect
export function useMotionIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const { shouldAnimate } = useMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [ref, setRef] = useState<HTMLElement | null>(null)
  
  useEffect(() => {
    if (!ref || !shouldAnimate()) {
      setIsVisible(true)
      return
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      options
    )
    
    observer.observe(ref)
    
    return () => {
      observer.disconnect()
    }
  }, [ref, shouldAnimate, options])
  
  return [setRef, isVisible] as const
}

// Motion settings component
interface MotionSettingsProps {
  className?: string
}

export function MotionSettings({ className }: MotionSettingsProps) {
  const { 
    prefersReducedMotion, 
    enableAnimations, 
    animationDuration,
    setMotionPreferences 
  } = useMotion()
  
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={enableAnimations}
            onChange={(e) => setMotionPreferences({ enableAnimations: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Enable animations</span>
        </label>
        <p className="text-sm text-gray-600 mt-1">
          Turn off to disable all animations and transitions
        </p>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Animation speed
        </label>
        <select
          value={animationDuration}
          onChange={(e) => setMotionPreferences({ 
            defaultDuration: e.target.value as AnimationDuration 
          })}
          className="w-full p-2 border rounded"
          disabled={!enableAnimations}
        >
          <option value="short">Fast</option>
          <option value="medium">Medium</option>
          <option value="long">Slow</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={!prefersReducedMotion}
            onChange={(e) => setMotionPreferences({ 
              reducedMotionOverride: !e.target.checked 
            })}
            className="w-4 h-4"
          />
          <span>Override system motion preferences</span>
        </label>
        <p className="text-sm text-gray-600 mt-1">
          System preference: {prefersReducedMotion ? 'Reduce motion' : 'No preference'}
        </p>
      </div>
    </div>
  )
}

// Export motion utilities
export {
  DURATION_MAP,
  ANIMATION_CLASSES,
  defaultMotionConfig
}