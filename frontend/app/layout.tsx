import type { Metadata } from 'next'
import { ThemeProvider } from "@/components/design-system/theme-provider"
import { Inter } from 'next/font/google'
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
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
