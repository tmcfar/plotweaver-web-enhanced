import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  
  // Environment configuration
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_COMMIT_SHA || 'development',
  
  // Integrations - Commented out due to version compatibility issues
  // integrations: [],
  
  // Error filtering
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    
    // Network errors
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    
    // User cancellations
    'AbortError',
    'cancelled',
    
    // Known third-party errors
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
  ],
  
  // Transaction filtering
  ignoreTransactions: [
    '/_next/static',
    '/api/health',
    '/.well-known',
  ],
  
  // Before send hook
  beforeSend(event, hint) {
    // Filter out certain errors in development
    if (process.env.NODE_ENV === 'development') {
      if (event.exception?.values?.[0]?.value?.includes('Hydration')) {
        return null;
      }
    }
    
    // Add user context
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      if (user) {
        try {
          const userData = JSON.parse(user);
          event.user = {
            id: userData.id,
            email: userData.email,
            username: userData.name,
          };
        } catch (e) {
          // Invalid user data
        }
      }
    }
    
    // Add custom context
    event.contexts = {
      ...event.contexts,
      app: {
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
        mode_set: localStorage.getItem('mode-set') || 'unknown',
        feature_flags: getFeatureFlags(),
      },
      device: {
        online: navigator.onLine,
        memory: (navigator as any).deviceMemory || 'unknown',
        connection: (navigator as any).connection?.effectiveType || 'unknown',
      },
    };
    
    return event;
  },
  
  // Breadcrumb filtering
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out noisy breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    
    // Add more context to navigation breadcrumbs
    if (breadcrumb.category === 'navigation') {
      breadcrumb.data = {
        ...breadcrumb.data,
        mode_set: localStorage.getItem('mode-set'),
        project_id: getCurrentProjectId(),
      };
    }
    
    // Track important UI interactions
    if (breadcrumb.category === 'ui.click') {
      const target = hint?.event?.target as HTMLElement;
      if (target?.dataset?.tracking) {
        breadcrumb.message = `Clicked: ${target.dataset.tracking}`;
      }
    }
    
    return breadcrumb;
  },
});

// Helper functions
function getFeatureFlags(): Record<string, boolean> {
  return {
    locking: process.env.NEXT_PUBLIC_ENABLE_LOCKING === 'true',
    pregeneration: process.env.NEXT_PUBLIC_ENABLE_PREGENERATION === 'true',
    continuity: process.env.NEXT_PUBLIC_ENABLE_CONTINUITY === 'true',
    collaboration: process.env.NEXT_PUBLIC_ENABLE_COLLABORATION === 'true',
    offline: process.env.NEXT_PUBLIC_ENABLE_OFFLINE === 'true',
  };
}

function getCurrentProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/project\/([a-z0-9-]+)/);
  return match?.[1] || null;
}

// Custom error boundary reporting
export function reportErrorBoundary(error: Error, errorInfo: any) {
  Sentry.withScope((scope) => {
    scope.setContext('errorBoundary', {
      componentStack: errorInfo.componentStack,
    });
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}

// Performance monitoring helpers
export function measureComponentPerformance(componentName: string) {
  return Sentry.startSpan({
    name: `Component: ${componentName}`,
    op: 'react.component',
  }, () => {
    // Return a span that can be manually finished
    return {
      finish: () => {} // No-op for compatibility
    };
  });
}

// Custom metrics
export function trackCustomMetric(name: string, value: number, unit: string = 'none') {
  Sentry.metrics.gauge(name, value, { unit });
}

// User feedback
export function showUserReportDialog(eventId: string) {
  Sentry.showReportDialog({ eventId });
}

// Export for use in other parts of the app
export { Sentry };
