'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Keyboard navigation hook
export function useKeyboardNavigation(options: {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  enabled?: boolean
  preventDefault?: boolean
} = {}) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    enabled = true,
    preventDefault = true
  } = options

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    const { key, shiftKey } = event

    switch (key) {
      case 'Escape':
        if (onEscape) {
          if (preventDefault) event.preventDefault()
          onEscape()
        }
        break
      case 'Enter':
        if (onEnter) {
          if (preventDefault) event.preventDefault()
          onEnter()
        }
        break
      case 'ArrowUp':
        if (onArrowUp) {
          if (preventDefault) event.preventDefault()
          onArrowUp()
        }
        break
      case 'ArrowDown':
        if (onArrowDown) {
          if (preventDefault) event.preventDefault()
          onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (onArrowLeft) {
          if (preventDefault) event.preventDefault()
          onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (onArrowRight) {
          if (preventDefault) event.preventDefault()
          onArrowRight()
        }
        break
      case 'Tab':
        if (shiftKey && onShiftTab) {
          if (preventDefault) event.preventDefault()
          onShiftTab()
        } else if (!shiftKey && onTab) {
          if (preventDefault) event.preventDefault()
          onTab()
        }
        break
    }
  }, [
    enabled,
    preventDefault,
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab
  ])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  return { handleKeyDown }
}

// Focus trap component
interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  restoreFocus?: boolean
  className?: string
}

export function FocusTrap({
  children,
  active = true,
  initialFocus,
  restoreFocus = true,
  className
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Store the currently focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus the initial element or first focusable element
    const focusInitialElement = () => {
      if (initialFocus?.current) {
        initialFocus.current.focus()
      } else {
        const firstFocusable = getFocusableElements(containerRef.current)[0]
        firstFocusable?.focus()
      }
    }

    // Delay to ensure the component is rendered
    setTimeout(focusInitialElement, 0)

    return () => {
      // Restore focus when component unmounts or becomes inactive
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, initialFocus, restoreFocus])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!active || event.key !== 'Tab') return

    const focusableElements = getFocusableElements(containerRef.current)
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault()
        firstFocusable?.focus()
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
}

// Get focusable elements within a container
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []

  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  const elements = container.querySelectorAll(focusableSelectors)
  return Array.from(elements).filter(
    element => !element.hasAttribute('hidden') && 
               (element as HTMLElement).offsetParent !== null
  ) as HTMLElement[]
}

// Roving tabindex for lists and grids
interface RovingTabIndexProps {
  children: React.ReactNode
  orientation?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
  className?: string
  onSelectionChange?: (index: number) => void
  defaultIndex?: number
}

export function RovingTabIndex({
  children,
  orientation = 'vertical',
  loop = true,
  className,
  onSelectionChange,
  defaultIndex = 0
}: RovingTabIndexProps) {
  const [focusedIndex, setFocusedIndex] = useState(defaultIndex)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    // Update items ref when children change
    if (containerRef.current) {
      itemsRef.current = Array.from(
        containerRef.current.children
      ) as HTMLElement[]
    }
  })

  const moveFocus = useCallback((direction: 'next' | 'previous') => {
    const items = itemsRef.current
    if (items.length === 0) return

    let newIndex = focusedIndex

    if (direction === 'next') {
      newIndex = focusedIndex + 1
      if (newIndex >= items.length) {
        newIndex = loop ? 0 : items.length - 1
      }
    } else {
      newIndex = focusedIndex - 1
      if (newIndex < 0) {
        newIndex = loop ? items.length - 1 : 0
      }
    }

    setFocusedIndex(newIndex)
    items[newIndex]?.focus()
    onSelectionChange?.(newIndex)
  }, [focusedIndex, loop, onSelectionChange])

  useKeyboardNavigation({
    onArrowUp: orientation === 'vertical' || orientation === 'both' 
      ? () => moveFocus('previous') 
      : undefined,
    onArrowDown: orientation === 'vertical' || orientation === 'both'
      ? () => moveFocus('next')
      : undefined,
    onArrowLeft: orientation === 'horizontal' || orientation === 'both'
      ? () => moveFocus('previous')
      : undefined,
    onArrowRight: orientation === 'horizontal' || orientation === 'both'
      ? () => moveFocus('next')
      : undefined,
    enabled: true,
    preventDefault: true
  })

  return (
    <div
      ref={containerRef}
      className={className}
      role="group"
      onFocus={(e) => {
        // When container receives focus, focus the current item
        if (e.target === containerRef.current) {
          itemsRef.current[focusedIndex]?.focus()
        }
      }}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            tabIndex: index === focusedIndex ? 0 : -1,
            onFocus: () => {
              setFocusedIndex(index)
              onSelectionChange?.(index)
            }
          } as any)
        }
        return child
      })}
    </div>
  )
}

// Keyboard shortcut manager
interface ShortcutConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  description: string
  action: () => void
  enabled?: boolean
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutConfig[]
  showHelp?: boolean
  helpTrigger?: string
  className?: string
}

export function KeyboardShortcuts({
  shortcuts,
  showHelp = true,
  helpTrigger = '?',
  className
}: KeyboardShortcutsProps) {
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for help trigger
      if (showHelp && event.key === helpTrigger && !event.ctrlKey && !event.altKey && !event.metaKey) {
        setShowHelpDialog(true)
        return
      }

      // Check for shortcuts
      shortcuts.forEach(shortcut => {
        if (!shortcut.enabled) return

        const matches = 
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.metaKey === !!shortcut.metaKey

        if (matches) {
          event.preventDefault()
          shortcut.action()
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts, showHelp, helpTrigger])

  const formatShortcut = (shortcut: ShortcutConfig) => {
    const parts = []
    if (shortcut.ctrlKey || shortcut.metaKey) parts.push('Ctrl')
    if (shortcut.altKey) parts.push('Alt')
    if (shortcut.shiftKey) parts.push('Shift')
    parts.push(shortcut.key.toUpperCase())
    return parts.join(' + ')
  }

  return (
    <>
      {showHelpDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <FocusTrap active={showHelpDialog}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowHelpDialog(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                  aria-label="Close help dialog"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4">
                <div className="space-y-3">
                  {shortcuts.filter(s => s.enabled !== false).map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                  Press <kbd className="px-1 bg-gray-100 rounded">{helpTrigger}</kbd> to show this help again
                </div>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  )
}

// Accessible dropdown/combobox navigation
interface AccessibleDropdownProps {
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  onSelect?: (index: number) => void
  className?: string
  trigger: React.ReactNode
}

export function AccessibleDropdown({
  children,
  isOpen,
  onToggle,
  onSelect,
  className,
  trigger
}: AccessibleDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const options = React.Children.toArray(children)

  useKeyboardNavigation({
    onEscape: () => {
      onToggle()
      triggerRef.current?.focus()
    },
    onArrowUp: () => {
      if (isOpen) {
        const newIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1
        setSelectedIndex(newIndex)
      }
    },
    onArrowDown: () => {
      if (isOpen) {
        const newIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0
        setSelectedIndex(newIndex)
      } else {
        onToggle()
      }
    },
    onEnter: () => {
      if (isOpen && selectedIndex >= 0) {
        onSelect?.(selectedIndex)
        onToggle()
      } else if (!isOpen) {
        onToggle()
      }
    },
    enabled: true
  })

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="w-full"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={dropdownRef}
          role="listbox"
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {options.map((option, index) => (
            <div
              key={index}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'px-3 py-2 cursor-pointer',
                index === selectedIndex && 'bg-blue-100 text-blue-900'
              )}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => {
                onSelect?.(index)
                onToggle()
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Hook for managing focus within a component
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)

  const focusFirst = useCallback((container: HTMLElement | null) => {
    if (!container) return
    const firstFocusable = getFocusableElements(container)[0]
    firstFocusable?.focus()
    setFocusedElement(firstFocusable || null)
  }, [])

  const focusLast = useCallback((container: HTMLElement | null) => {
    if (!container) return
    const focusableElements = getFocusableElements(container)
    const lastFocusable = focusableElements[focusableElements.length - 1]
    lastFocusable?.focus()
    setFocusedElement(lastFocusable || null)
  }, [])

  const focusNext = useCallback((container: HTMLElement | null) => {
    if (!container || !focusedElement) return
    const focusableElements = getFocusableElements(container)
    const currentIndex = focusableElements.indexOf(focusedElement)
    const nextIndex = currentIndex + 1
    
    if (nextIndex < focusableElements.length) {
      focusableElements[nextIndex].focus()
      setFocusedElement(focusableElements[nextIndex])
    }
  }, [focusedElement])

  const focusPrevious = useCallback((container: HTMLElement | null) => {
    if (!container || !focusedElement) return
    const focusableElements = getFocusableElements(container)
    const currentIndex = focusableElements.indexOf(focusedElement)
    const previousIndex = currentIndex - 1
    
    if (previousIndex >= 0) {
      focusableElements[previousIndex].focus()
      setFocusedElement(focusableElements[previousIndex])
    }
  }, [focusedElement])

  return {
    focusedElement,
    setFocusedElement,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious
  }
}