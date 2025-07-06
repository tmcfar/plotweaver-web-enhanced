import { designTokens } from '../tokens'

export const lightTheme = {
  colors: {
    background: designTokens.colors.gray[50],
    foreground: designTokens.colors.gray[900],
    card: designTokens.colors.gray[50],
    cardForeground: designTokens.colors.gray[900],
    popover: designTokens.colors.gray[50],
    popoverForeground: designTokens.colors.gray[900],
    primary: designTokens.colors.primary[600],
    primaryForeground: designTokens.colors.gray[50],
    secondary: designTokens.colors.gray[100],
    secondaryForeground: designTokens.colors.gray[900],
    muted: designTokens.colors.gray[100],
    mutedForeground: designTokens.colors.gray[500],
    accent: designTokens.colors.gray[100],
    accentForeground: designTokens.colors.gray[900],
    destructive: designTokens.colors.error[500],
    destructiveForeground: designTokens.colors.gray[50],
    border: designTokens.colors.gray[200],
    input: designTokens.colors.gray[200],
    ring: designTokens.colors.primary[600],
    success: designTokens.colors.success[500],
    warning: designTokens.colors.warning[500],
    error: designTokens.colors.error[500],
  },
  editor: {
    background: designTokens.colors.gray[50],
    foreground: designTokens.colors.gray[900],
    selection: designTokens.colors.primary[100],
    lineNumber: designTokens.colors.gray[400],
    cursor: designTokens.colors.primary[600],
  },
  sidebar: {
    background: designTokens.colors.gray[100],
    foreground: designTokens.colors.gray[900],
    border: designTokens.colors.gray[200],
    hover: designTokens.colors.gray[200],
    active: designTokens.colors.primary[100],
  },
  toolbar: {
    background: designTokens.colors.gray[50],
    foreground: designTokens.colors.gray[900],
    border: designTokens.colors.gray[200],
    buttonHover: designTokens.colors.gray[100],
    buttonActive: designTokens.colors.primary[100],
  },
} as const

export type LightTheme = typeof lightTheme