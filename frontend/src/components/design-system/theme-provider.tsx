'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { lightTheme } from './themes/light'
import { darkTheme } from './themes/dark'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'plotweaver-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // Get theme from localStorage
    const stored = localStorage.getItem(storageKey) as Theme
    if (stored) {
      setThemeState(stored)
    }
  }, [storageKey])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    systemTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme tokens hook
export function useThemeTokens() {
  const { resolvedTheme } = useTheme()
  return resolvedTheme === 'dark' ? darkTheme : lightTheme
}