'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Screen reader only text component
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  as?: keyof JSX.IntrinsicElements
  className?: string
}

export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span',
  className 
}: ScreenReaderOnlyProps) {
  return (
    <Component className={cn('sr-only', className)}>
      {children}
    </Component>
  )
}

// Visually hidden but focusable element
interface VisuallyHiddenProps {
  children: React.ReactNode
  focusable?: boolean
  className?: string
}

export function VisuallyHidden({ 
  children, 
  focusable = false,
  className 
}: VisuallyHiddenProps) {
  return (
    <span 
      className={cn(
        'absolute w-px h-px p-0 -m-px overflow-hidden',
        'whitespace-nowrap border-0',
        focusable && 'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50',
        focusable && 'focus:w-auto focus:h-auto focus:p-2 focus:m-0',
        focusable && 'focus:overflow-visible focus:whitespace-normal',
        focusable && 'focus:bg-white focus:border focus:border-gray-300 focus:rounded',
        className
      )}
      tabIndex={focusable ? 0 : undefined}
    >
      {children}
    </span>
  )
}

// ARIA live region for dynamic content
interface AriaLiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  busy?: boolean
  className?: string
}

export function AriaLiveRegion({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions text',
  busy = false,
  className
}: AriaLiveRegionProps) {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      aria-busy={busy}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

// Accessible heading hierarchy
interface AccessibleHeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  visualLevel?: 1 | 2 | 3 | 4 | 5 | 6
}

export function AccessibleHeading({ 
  level, 
  children, 
  className,
  visualLevel 
}: AccessibleHeadingProps) {
  const Component = `h${level}` as keyof JSX.IntrinsicElements
  const visualClass = visualLevel ? `text-${visualLevel}xl font-bold` : undefined
  
  return (
    <Component className={cn(visualClass, className)}>
      {children}
    </Component>
  )
}

// Accessible description component
interface AccessibleDescriptionProps {
  id: string
  children: React.ReactNode
  className?: string
}

export function AccessibleDescription({ 
  id, 
  children, 
  className 
}: AccessibleDescriptionProps) {
  return (
    <div id={id} className={cn('text-sm text-muted-foreground', className)}>
      {children}
    </div>
  )
}

// Screen reader status announcer
interface StatusAnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
  delay?: number
  clearAfter?: number
}

export function StatusAnnouncer({
  message,
  priority = 'polite',
  delay = 0,
  clearAfter = 5000
}: StatusAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState('')
  const timeoutRef = useRef<NodeJS.Timeout>()
  const clearTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (clearTimeoutRef.current) {
      clearTimeout(clearTimeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setCurrentMessage(message)
      
      if (clearAfter > 0) {
        clearTimeoutRef.current = setTimeout(() => {
          setCurrentMessage('')
        }, clearAfter)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (clearTimeoutRef.current) clearTimeout(clearTimeoutRef.current)
    }
  }, [message, delay, clearAfter])

  return (
    <AriaLiveRegion politeness={priority}>
      {currentMessage}
    </AriaLiveRegion>
  )
}

// Loading state announcer
interface LoadingStatusProps {
  isLoading: boolean
  loadingText?: string
  completedText?: string
  errorText?: string
  error?: boolean
}

export function LoadingStatus({
  isLoading,
  loadingText = 'Loading...',
  completedText = 'Content loaded',
  errorText = 'Failed to load content',
  error = false
}: LoadingStatusProps) {
  const [announcement, setAnnouncement] = useState('')
  const prevLoading = useRef(isLoading)

  useEffect(() => {
    if (isLoading && !prevLoading.current) {
      setAnnouncement(loadingText)
    } else if (!isLoading && prevLoading.current) {
      setAnnouncement(error ? errorText : completedText)
    }
    
    prevLoading.current = isLoading
  }, [isLoading, loadingText, completedText, errorText, error])

  return (
    <AriaLiveRegion politeness="polite">
      {announcement}
    </AriaLiveRegion>
  )
}

// Accessible table helpers
interface AccessibleTableProps {
  children: React.ReactNode
  caption?: string
  summary?: string
  className?: string
}

export function AccessibleTable({
  children,
  caption,
  summary,
  className
}: AccessibleTableProps) {
  return (
    <table className={className} summary={summary}>
      {caption && <caption className="sr-only">{caption}</caption>}
      {children}
    </table>
  )
}

// Accessible form field group
interface FieldGroupProps {
  legend: string
  children: React.ReactNode
  required?: boolean
  invalid?: boolean
  className?: string
}

export function FieldGroup({
  legend,
  children,
  required = false,
  invalid = false,
  className
}: FieldGroupProps) {
  return (
    <fieldset 
      className={cn(
        'border-0 p-0 m-0',
        invalid && 'aria-invalid',
        className
      )}
      aria-required={required}
      aria-invalid={invalid}
    >
      <legend className="sr-only">
        {legend}
        {required && <span aria-label="required"> *</span>}
      </legend>
      {children}
    </fieldset>
  )
}

// Accessible error message
interface ErrorMessageProps {
  id: string
  error?: string | null
  className?: string
}

export function ErrorMessage({ id, error, className }: ErrorMessageProps) {
  if (!error) return null

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn('text-sm text-red-600 mt-1', className)}
    >
      {error}
    </div>
  )
}

// Accessible progress indicator
interface ProgressIndicatorProps {
  value: number
  max?: number
  label?: string
  description?: string
  className?: string
}

export function ProgressIndicator({
  value,
  max = 100,
  label,
  description,
  className
}: ProgressIndicatorProps) {
  const percentage = Math.round((value / max) * 100)
  const progressId = `progress-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm text-muted-foreground">
            {percentage}%
          </span>
        </div>
      )}
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? progressId : undefined}
        aria-describedby={description ? `${progressId}-desc` : undefined}
        className="w-full bg-gray-200 rounded-full h-2"
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <div id={`${progressId}-desc`} className="text-xs text-muted-foreground mt-1">
          {description}
        </div>
      )}
      
      <ScreenReaderOnly>
        Progress: {percentage}% complete
      </ScreenReaderOnly>
    </div>
  )
}

// Accessible accordion/disclosure
interface DisclosureProps {
  trigger: React.ReactNode
  children: React.ReactNode
  expanded?: boolean
  onToggle?: (expanded: boolean) => void
  className?: string
}

export function Disclosure({
  trigger,
  children,
  expanded = false,
  onToggle,
  className
}: DisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)
  const contentId = `disclosure-${Math.random().toString(36).substr(2, 9)}`

  const handleToggle = () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    onToggle?.(newExpanded)
  }

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={contentId}
        onClick={handleToggle}
        className="w-full text-left"
      >
        {trigger}
      </button>
      
      <div
        id={contentId}
        aria-hidden={!isExpanded}
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}

// Accessible breadcrumb navigation
interface BreadcrumbProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
  className?: string
}

export function AccessibleBreadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}
            
            {item.current ? (
              <span
                aria-current="page"
                className="text-gray-900 font-medium"
              >
                {item.label}
              </span>
            ) : item.href ? (
              <a
                href={item.href}
                className="text-blue-600 hover:text-blue-800"
              >
                {item.label}
              </a>
            ) : (
              <span className="text-gray-500">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Accessible tooltip
interface AccessibleTooltipProps {
  content: string
  children: React.ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function AccessibleTooltip({
  content,
  children,
  placement = 'top',
  className
}: AccessibleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn('relative inline-block', className)}>
      <div
        aria-describedby={isVisible ? tooltipId : undefined}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            'absolute z-50 px-2 py-1 text-sm bg-gray-900 text-white rounded shadow-lg',
            'pointer-events-none',
            {
              'bottom-full left-1/2 transform -translate-x-1/2 mb-2': placement === 'top',
              'top-full left-1/2 transform -translate-x-1/2 mt-2': placement === 'bottom',
              'right-full top-1/2 transform -translate-y-1/2 mr-2': placement === 'left',
              'left-full top-1/2 transform -translate-y-1/2 ml-2': placement === 'right'
            }
          )}
        >
          {content}
        </div>
      )}
    </div>
  )
}

// Hook for managing ARIA attributes
export function useAriaAttributes(options: {
  labelledBy?: string
  describedBy?: string
  expanded?: boolean
  selected?: boolean
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  busy?: boolean
}) {
  const {
    labelledBy,
    describedBy,
    expanded,
    selected,
    disabled,
    required,
    invalid,
    busy
  } = options

  return {
    'aria-labelledby': labelledBy,
    'aria-describedby': describedBy,
    'aria-expanded': expanded,
    'aria-selected': selected,
    'aria-disabled': disabled,
    'aria-required': required,
    'aria-invalid': invalid,
    'aria-busy': busy
  }
}

// Hook for managing screen reader announcements
export function useScreenReaderAnnouncements() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    announcer.textContent = message

    document.body.appendChild(announcer)

    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }, [])

  const announceNavigation = useCallback((destination: string) => {
    announce(`Navigated to ${destination}`, 'polite')
  }, [announce])

  const announceAction = useCallback((action: string) => {
    announce(`${action} completed`, 'polite')
  }, [announce])

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive')
  }, [announce])

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite')
  }, [announce])

  return {
    announce,
    announceNavigation,
    announceAction,
    announceError,
    announceSuccess
  }
}

// Component for managing document title
interface DocumentTitleProps {
  title: string
  suffix?: string
}

export function DocumentTitle({ title, suffix = 'PlotWeaver' }: DocumentTitleProps) {
  useEffect(() => {
    const fullTitle = `${title} - ${suffix}`
    document.title = fullTitle
    
    // Announce page change to screen readers
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', 'polite')
    announcer.setAttribute('aria-atomic', 'true')
    announcer.setAttribute('class', 'sr-only')
    announcer.textContent = `Page changed to ${title}`

    document.body.appendChild(announcer)

    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }, [title, suffix])

  return null
}

// Accessible modal/dialog wrapper
interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title: string
  description?: string
  className?: string
}

export function AccessibleModal({
  isOpen,
  onClose,
  children,
  title,
  description,
  className
}: AccessibleModalProps) {
  const modalId = `modal-${Math.random().toString(36).substr(2, 9)}`
  const titleId = `${modalId}-title`
  const descId = `${modalId}-desc`

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'bg-white rounded-lg shadow-xl max-w-md w-full mx-4',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold mb-4">
            {title}
          </h2>
          
          {description && (
            <div id={descId} className="text-sm text-gray-600 mb-4">
              {description}
            </div>
          )}
          
          {children}
        </div>
      </div>
    </div>
  )
}