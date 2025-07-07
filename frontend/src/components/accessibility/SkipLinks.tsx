'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface SkipLink {
  href: string
  label: string
  description?: string
}

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
  position?: 'top-left' | 'top-center' | 'top-right'
  showOnFocus?: boolean
}

const defaultSkipLinks: SkipLink[] = [
  {
    href: '#main-content',
    label: 'Skip to main content',
    description: 'Jump to the main content area'
  },
  {
    href: '#primary-navigation',
    label: 'Skip to navigation',
    description: 'Jump to the primary navigation menu'
  },
  {
    href: '#sidebar',
    label: 'Skip to sidebar',
    description: 'Jump to the sidebar content'
  },
  {
    href: '#footer',
    label: 'Skip to footer',
    description: 'Jump to the page footer'
  }
]

export function SkipLinks({
  links = defaultSkipLinks,
  className,
  position = 'top-left',
  showOnFocus = true
}: SkipLinksProps) {
  const [currentFocus, setCurrentFocus] = useState<string | null>(null)
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    // Detect keyboard users
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const handleFocus = (href: string) => {
    setCurrentFocus(href)
  }

  const handleBlur = () => {
    setCurrentFocus(null)
  }

  const handleClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    const target = document.querySelector(href)
    if (target) {
      // Set focus to the target element
      target.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
      
      // Make element focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
      }
      
      ;(target as HTMLElement).focus()
      
      // Announce to screen readers
      announceToScreenReader(`Skipped to ${target.getAttribute('aria-label') || href.slice(1)}`)
    }
  }

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'top-right': 'top-4 right-4'
  }

  if (!isKeyboardUser && showOnFocus) {
    return null
  }

  return (
    <nav
      aria-label="Skip links"
      className={cn(
        'fixed z-[9999]',
        positionClasses[position],
        className
      )}
    >
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={cn(
                'inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600',
                'rounded-md shadow-lg transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                'hover:bg-blue-700',
                showOnFocus && [
                  'opacity-0 transform -translate-y-2',
                  'focus:opacity-100 focus:translate-y-0'
                ]
              )}
              onFocus={() => handleFocus(link.href)}
              onBlur={handleBlur}
              onClick={(e) => handleClick(link.href, e)}
              title={link.description}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// Skip to content for specific sections
interface SkipToContentProps {
  targetId: string
  label?: string
  children?: React.ReactNode
  className?: string
}

export function SkipToContent({
  targetId,
  label = 'Skip to content',
  children,
  className
}: SkipToContentProps) {
  const handleSkip = () => {
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      target.focus()
      announceToScreenReader(`Skipped to ${label}`)
    }
  }

  return (
    <button
      type="button"
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'z-[9999]',
        className
      )}
      onClick={handleSkip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleSkip()
        }
      }}
    >
      {children || label}
    </button>
  )
}

// Hook for managing skip link targets
export function useSkipLinkTargets() {
  const [targets, setTargets] = useState<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    // Find all elements with skip-link-target data attribute
    const elements = document.querySelectorAll('[data-skip-target]')
    const targetMap = new Map<string, HTMLElement>()

    elements.forEach((element) => {
      const id = element.getAttribute('data-skip-target')
      if (id && element instanceof HTMLElement) {
        targetMap.set(id, element)
      }
    })

    setTargets(targetMap)

    // Observer to watch for new targets
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            const skipTargets = node.querySelectorAll('[data-skip-target]')
            skipTargets.forEach((element) => {
              const id = element.getAttribute('data-skip-target')
              if (id && element instanceof HTMLElement) {
                setTargets(prev => new Map(prev.set(id, element)))
              }
            })
          }
        })
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => observer.disconnect()
  }, [])

  const registerTarget = (id: string, element: HTMLElement) => {
    setTargets(prev => new Map(prev.set(id, element)))
  }

  const unregisterTarget = (id: string) => {
    setTargets(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }

  const scrollToTarget = (id: string) => {
    const target = targets.get(id)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      target.focus()
      announceToScreenReader(`Skipped to ${target.getAttribute('aria-label') || id}`)
    }
  }

  return {
    targets,
    registerTarget,
    unregisterTarget,
    scrollToTarget
  }
}

// Component to mark skip link targets
interface SkipTargetProps {
  id: string
  children: React.ReactNode
  label?: string
  className?: string
  tabIndex?: number
}

export function SkipTarget({
  id,
  children,
  label,
  className,
  tabIndex = -1
}: SkipTargetProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const { registerTarget, unregisterTarget } = useSkipLinkTargets()

  useEffect(() => {
    const element = ref.current
    if (element) {
      registerTarget(id, element)
      return () => unregisterTarget(id)
    }
  }, [id, registerTarget, unregisterTarget])

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      tabIndex={tabIndex}
      aria-label={label}
      data-skip-target={id}
    >
      {children}
    </div>
  )
}

// Breadcrumb skip navigation
interface BreadcrumbSkipProps {
  items: Array<{
    label: string
    href?: string
    targetId?: string
  }>
  className?: string
}

export function BreadcrumbSkip({
  items,
  className
}: BreadcrumbSkipProps) {
  const handleSkipTo = (item: { href?: string; targetId?: string }) => {
    if (item.targetId) {
      const target = document.getElementById(item.targetId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        target.focus()
        announceToScreenReader(`Navigated to ${item.label}`)
      }
    } else if (item.href) {
      window.location.hash = item.href
    }
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={cn('sr-only focus-within:not-sr-only', className)}
    >
      <ol className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
              onClick={() => handleSkipTo(item)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Utility function to announce to screen readers
function announceToScreenReader(message: string) {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', 'polite')
  announcement.setAttribute('aria-atomic', 'true')
  announcement.setAttribute('class', 'sr-only')
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// Main content wrapper with skip target
interface MainContentProps {
  children: React.ReactNode
  className?: string
  skipLinkLabel?: string
}

export function MainContent({
  children,
  className,
  skipLinkLabel = 'Main content'
}: MainContentProps) {
  return (
    <SkipTarget
      id="main-content"
      label={skipLinkLabel}
      className={className}
    >
      <main role="main">
        {children}
      </main>
    </SkipTarget>
  )
}