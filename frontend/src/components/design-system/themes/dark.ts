import { designTokens } from '../tokens'

export const darkTheme = {
  colors: {
    background: designTokens.colors.gray[900],
    foreground: designTokens.colors.gray[50],
    card: designTokens.colors.gray[900],
    cardForeground: designTokens.colors.gray[50],
    popover: designTokens.colors.gray[900],
    popoverForeground: designTokens.colors.gray[50],
    primary: designTokens.colors.primary[500],
    primaryForeground: designTokens.colors.gray[900],
    secondary: designTokens.colors.gray[800],
    secondaryForeground: designTokens.colors.gray[50],
    muted: designTokens.colors.gray[800],
    mutedForeground: designTokens.colors.gray[400],
    accent: designTokens.colors.gray[800],
    accentForeground: designTokens.colors.gray[50],
    destructive: designTokens.colors.error[500],
    destructiveForeground: designTokens.colors.gray[50],
    border: designTokens.colors.gray[700],
    input: designTokens.colors.gray[800],
    ring: designTokens.colors.primary[500],
    success: designTokens.colors.success[500],
    warning: designTokens.colors.warning[500],
    error: designTokens.colors.error[500],
  },
  editor: {
    background: designTokens.colors.gray[900],
    foreground: designTokens.colors.gray[50],
    selection: designTokens.colors.primary[800],
    lineNumber: designTokens.colors.gray[500],
    cursor: designTokens.colors.primary[400],
  },
  sidebar: {
    background: designTokens.colors.gray[800],
    foreground: designTokens.colors.gray[50],
    border: designTokens.colors.gray[700],
    hover: designTokens.colors.gray[700],
    active: designTokens.colors.primary[800],
  },
  toolbar: {
    background: designTokens.colors.gray[900],
    foreground: designTokens.colors.gray[50],
    border: designTokens.colors.gray[700],
    buttonHover: designTokens.colors.gray[800],
    buttonActive: designTokens.colors.primary[800],
  },
} as const

export type DarkTheme = typeof darkTheme