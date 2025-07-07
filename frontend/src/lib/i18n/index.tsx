// Internationalization utilities and multi-language support
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Supported languages
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ar'

// Language configuration
interface LanguageConfig {
  code: SupportedLanguage
  name: string
  nativeName: string
  rtl: boolean
  fallback?: SupportedLanguage
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false, fallback: 'en' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', rtl: false, fallback: 'en' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false, fallback: 'en' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false, fallback: 'en' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false, fallback: 'en' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false, fallback: 'en' },
  ko: { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false, fallback: 'en' },
  zh: { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false, fallback: 'en' },
  ar: { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true, fallback: 'en' }
}

// Translation key type
type TranslationKey = string

// Translation values with interpolation support
type TranslationValue = string | ((params: Record<string, any>) => string)

// Translation dictionary
type TranslationDictionary = Record<TranslationKey, TranslationValue>

// I18n context type
interface I18nContextType {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  isRTL: boolean
  translate: (key: TranslationKey, params?: Record<string, any>) => string
  hasTranslation: (key: TranslationKey) => boolean
  loadTranslations: (language: SupportedLanguage) => Promise<void>
  isLoading: boolean
}

// I18n context
const I18nContext = createContext<I18nContextType | null>(null)

// Translation cache
const translationCache = new Map<SupportedLanguage, TranslationDictionary>()

// Default translations (English)
const defaultTranslations: TranslationDictionary = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.retry': 'Retry',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.search': 'Search',
  'common.filter': 'Filter',
  'common.sort': 'Sort',
  'common.select': 'Select',
  'common.confirm': 'Confirm',
  'common.yes': 'Yes',
  'common.no': 'No',
  
  // Navigation
  'nav.home': 'Home',
  'nav.projects': 'Projects',
  'nav.settings': 'Settings',
  'nav.help': 'Help',
  'nav.profile': 'Profile',
  'nav.logout': 'Logout',
  
  // Projects
  'projects.title': 'Projects',
  'projects.create': 'Create Project',
  'projects.empty': 'No projects found',
  'projects.search': 'Search projects...',
  'projects.filter.all': 'All Projects',
  'projects.filter.recent': 'Recent',
  'projects.filter.shared': 'Shared',
  'projects.delete.confirm': 'Are you sure you want to delete this project?',
  
  // Editor
  'editor.title': 'Editor',
  'editor.save': 'Save',
  'editor.undo': 'Undo',
  'editor.redo': 'Redo',
  'editor.find': 'Find',
  'editor.replace': 'Replace',
  'editor.goto': 'Go to Line',
  
  // Accessibility
  'a11y.skipToMain': 'Skip to main content',
  'a11y.skipToNav': 'Skip to navigation',
  'a11y.menuButton': 'Open menu',
  'a11y.closeDialog': 'Close dialog',
  'a11y.loading': 'Loading content',
  'a11y.error': 'Error occurred',
  'a11y.required': 'Required field',
  'a11y.optional': 'Optional field',
  
  // Forms
  'form.required': 'This field is required',
  'form.invalid': 'Please enter a valid value',
  'form.emailInvalid': 'Please enter a valid email address',
  'form.passwordTooShort': 'Password must be at least 8 characters',
  'form.passwordsDoNotMatch': 'Passwords do not match',
  
  // Time and dates
  'time.now': 'Now',
  'time.today': 'Today',
  'time.yesterday': 'Yesterday',
  'time.daysAgo': (params: { count: number }) => `${params.count} days ago`,
  'time.weeksAgo': (params: { count: number }) => `${params.count} weeks ago`,
  'time.monthsAgo': (params: { count: number }) => `${params.count} months ago`,
  
  // Pluralization
  'items.count': (params: { count: number }) => 
    params.count === 1 ? '1 item' : `${params.count} items`,
  'files.count': (params: { count: number }) => 
    params.count === 1 ? '1 file' : `${params.count} files`,
  'users.count': (params: { count: number }) => 
    params.count === 1 ? '1 user' : `${params.count} users`
}

// Load translation cache with defaults
translationCache.set('en', defaultTranslations)

// I18n provider component
interface I18nProviderProps {
  children: React.ReactNode
  defaultLanguage?: SupportedLanguage
  persistLanguage?: boolean
}

export function I18nProvider({ 
  children, 
  defaultLanguage = 'en',
  persistLanguage = true 
}: I18nProviderProps) {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined' && persistLanguage) {
      const stored = localStorage.getItem('plotweaver:language') as SupportedLanguage
      if (stored && SUPPORTED_LANGUAGES[stored]) {
        return stored
      }
    }
    
    // Detect browser language
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0] as SupportedLanguage
      if (SUPPORTED_LANGUAGES[browserLang]) {
        return browserLang
      }
    }
    
    return defaultLanguage
  })
  
  const [isLoading, setIsLoading] = useState(false)
  
  const setLanguage = useCallback(async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) return
    
    setIsLoading(true)
    
    try {
      await loadTranslations(newLanguage)
      setLanguageState(newLanguage)
      
      if (persistLanguage && typeof window !== 'undefined') {
        localStorage.setItem('plotweaver:language', newLanguage)
      }
      
      // Update document language and direction
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLanguage
        document.documentElement.dir = SUPPORTED_LANGUAGES[newLanguage].rtl ? 'rtl' : 'ltr'
      }
    } catch (error) {
      console.error('Failed to load translations:', error)
    } finally {
      setIsLoading(false)
    }
  }, [language, persistLanguage])
  
  const isRTL = SUPPORTED_LANGUAGES[language].rtl
  
  const translate = useCallback((key: TranslationKey, params?: Record<string, any>): string => {
    const translations = translationCache.get(language) || defaultTranslations
    const fallbackTranslations = translationCache.get('en') || defaultTranslations
    
    let translation = translations[key] || fallbackTranslations[key]
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`)
      return key
    }
    
    if (typeof translation === 'function') {
      return translation(params || {})
    }
    
    // Simple interpolation
    if (params && typeof translation === 'string') {
      return translation.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }
    
    return translation
  }, [language])
  
  const hasTranslation = useCallback((key: TranslationKey): boolean => {
    const translations = translationCache.get(language) || defaultTranslations
    return key in translations
  }, [language])
  
  // Set initial document attributes
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    }
  }, [language, isRTL])
  
  const value: I18nContextType = {
    language,
    setLanguage,
    isRTL,
    translate,
    hasTranslation,
    loadTranslations,
    isLoading
  }
  
  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

// Load translations for a language
async function loadTranslations(language: SupportedLanguage): Promise<void> {
  if (translationCache.has(language)) {
    return
  }
  
  try {
    // In a real app, this would load from API or import language files
    const translations = await import(`./locales/${language}.json`)
    translationCache.set(language, { ...defaultTranslations, ...translations.default })
  } catch (error) {
    console.warn(`Failed to load translations for ${language}, using fallback`)
    // Use fallback language or defaults
    const fallbackLang = SUPPORTED_LANGUAGES[language].fallback
    if (fallbackLang && fallbackLang !== language) {
      const fallbackTranslations = translationCache.get(fallbackLang) || defaultTranslations
      translationCache.set(language, fallbackTranslations)
    } else {
      translationCache.set(language, defaultTranslations)
    }
  }
}

// Hook to use i18n
export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

// Hook for translation
export function useTranslation() {
  const { translate, hasTranslation, language, isRTL } = useI18n()
  
  const t = useCallback((key: TranslationKey, params?: Record<string, any>) => {
    return translate(key, params)
  }, [translate])
  
  return { t, hasTranslation, language, isRTL }
}

// Language selector component
interface LanguageSelectorProps {
  className?: string
  showNativeNames?: boolean
}

export function LanguageSelector({ className, showNativeNames = true }: LanguageSelectorProps) {
  const { language, setLanguage, isLoading } = useI18n()
  const { t } = useTranslation()
  
  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
      disabled={isLoading}
      className={className}
      aria-label={t('settings.language')}
    >
      {Object.values(SUPPORTED_LANGUAGES).map((lang) => (
        <option key={lang.code} value={lang.code}>
          {showNativeNames ? lang.nativeName : lang.name}
        </option>
      ))}
    </select>
  )
}

// RTL-aware component wrapper
interface RTLAwareProps {
  children: React.ReactNode
  className?: string
}

export function RTLAware({ children, className }: RTLAwareProps) {
  const { isRTL } = useI18n()
  
  return (
    <div 
      className={className}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{
        textAlign: isRTL ? 'right' : 'left'
      }}
    >
      {children}
    </div>
  )
}

// Number formatting with locale support
export function useNumberFormat() {
  const { language } = useI18n()
  
  const formatNumber = useCallback((
    number: number, 
    options?: Intl.NumberFormatOptions
  ) => {
    return new Intl.NumberFormat(language, options).format(number)
  }, [language])
  
  const formatCurrency = useCallback((
    amount: number, 
    currency: string = 'USD'
  ) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency
    }).format(amount)
  }, [language])
  
  const formatPercent = useCallback((number: number) => {
    return new Intl.NumberFormat(language, {
      style: 'percent'
    }).format(number)
  }, [language])
  
  return { formatNumber, formatCurrency, formatPercent }
}

// Date formatting with locale support
export function useDateFormat() {
  const { language } = useI18n()
  
  const formatDate = useCallback((
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions
  ) => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    return new Intl.DateTimeFormat(language, options).format(dateObj)
  }, [language])
  
  const formatRelativeTime = useCallback((date: Date | string | number) => {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    const { t } = useTranslation()
    
    if (diffDays === 0) return t('time.today')
    if (diffDays === 1) return t('time.yesterday')
    if (diffDays < 7) return t('time.daysAgo', { count: diffDays })
    if (diffDays < 30) return t('time.weeksAgo', { count: Math.floor(diffDays / 7) })
    return t('time.monthsAgo', { count: Math.floor(diffDays / 30) })
  }, [language])
  
  return { formatDate, formatRelativeTime }
}

// Export utilities
export {
  translationCache,
  loadTranslations,
  defaultTranslations
}