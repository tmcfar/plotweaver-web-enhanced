import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/design-system/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PlotWeaver',
  description: 'AI-Powered Story Writing',
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
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
