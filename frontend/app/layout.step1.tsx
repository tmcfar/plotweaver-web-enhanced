import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/design-system/theme-provider'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlotWeaver - AI-Powered Story Writing',
  description: 'Professional AI-assisted novel writing platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="plotweaver-theme"
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          {/* Main App Content */}
          {children}
          
          {/* Toast Notifications */}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
