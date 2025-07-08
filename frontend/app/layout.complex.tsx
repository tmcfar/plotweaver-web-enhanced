import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ConditionalClerkProvider } from '@/components/providers/ConditionalClerkProvider'
import { ThemeProvider } from '@/components/design-system/theme-provider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { GlobalErrorBoundary, AsyncErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'PlotWeaver - AI-Powered Story Writing',
  description: 'Professional AI-assisted novel writing platform with intelligent story generation and creative control',
  keywords: ['writing', 'AI', 'novel', 'story', 'creative writing', 'plot', 'character development'],
  authors: [{ name: 'PlotWeaver Team' }],
  creator: 'PlotWeaver',
  publisher: 'PlotWeaver',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://plotweaver.app',
    siteName: 'PlotWeaver',
    title: 'PlotWeaver - AI-Powered Story Writing',
    description: 'Transform your ideas into compelling narratives with AI assistance',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PlotWeaver - AI Story Writing Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@plotweaver',
    creator: '@plotweaver',
    title: 'PlotWeaver - AI-Powered Story Writing',
    description: 'Transform your ideas into compelling narratives with AI assistance',
    images: ['/twitter-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PlotWeaver',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConditionalClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          {process.env.NEXT_PUBLIC_API_URL && (
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL} />
          )}
          
          {/* Security headers */}
          <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
          <meta httpEquiv="X-Frame-Options" content="DENY" />
          <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
          <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
          
          {/* Content Security Policy */}
          <meta
            httpEquiv="Content-Security-Policy"
            content={`
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.sentry.io;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL} ${process.env.NEXT_PUBLIC_WS_URL} https://*.sentry.io https://clerk.com wss://*.clerk.com;
              frame-src 'self' https://clerk.com;
              worker-src 'self' blob:;
              manifest-src 'self';
            `.replace(/\s+/g, ' ').trim()}
          />
        </head>
        <body className={inter.className}>
          <GlobalErrorBoundary>
            <AsyncErrorBoundary>
              <QueryProvider>
                <ThemeProvider
                  defaultTheme="system"
                  storageKey="plotweaver-theme"
                >
                  {/* Main App Content */}
                  {children}
                  
                  {/* Client-side components */}
                  <ClientProviders />
                  
                  {/* Accessibility helpers */}
                  <div 
                    id="announcements" 
                    className="sr-only" 
                    aria-live="polite" 
                    aria-atomic="true"
                  />
                </ThemeProvider>
              </QueryProvider>
            </AsyncErrorBoundary>
          </GlobalErrorBoundary>
          
          {/* Performance monitoring in production */}
          {process.env.NODE_ENV === 'production' && (
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Web Vitals monitoring
                  if ('PerformanceObserver' in window) {
                    try {
                      const observer = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                          // Send to analytics
                          if (window.gtag) {
                            window.gtag('event', entry.name, {
                              value: Math.round(entry.value),
                              metric_type: 'web_vital',
                              non_interaction: true,
                            });
                          }
                        }
                      });
                      observer.observe({ entryTypes: ['web-vital'] });
                    } catch (e) {
                      console.error('Failed to setup performance monitoring:', e);
                    }
                  }
                `,
              }}
            />
          )}
        </body>
      </html>
    </ConditionalClerkProvider>
  )
}
