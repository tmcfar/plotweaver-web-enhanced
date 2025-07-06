import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('Sentry DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session tracking
    autoSessionTracking: true,
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-critical errors in production
      if (process.env.NODE_ENV === 'production') {
        if (event.level === 'warning') {
          return null;
        }
        
        // Filter out network errors that are not actionable
        if (event.exception?.values?.[0]?.type === 'NetworkError') {
          return null;
        }
        
        // Filter out known browser extension errors
        if (event.exception?.values?.[0]?.value?.includes('extension')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Additional context
    initialScope: {
      tags: {
        component: 'plotweaver-ui',
        version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown'
      }
    },
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // Set up automatic route change tracking for Next.js
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
    ],
  });
}

// Custom error logging functions
export function logError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_context', context);
    }
    Sentry.captureException(error);
  });
}

export function logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', extra?: Record<string, any>) {
  Sentry.withScope((scope) => {
    scope.setLevel(level);
    if (extra) {
      scope.setContext('message_context', extra);
    }
    Sentry.captureMessage(message);
  });
}

// User context
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

// Mode-set specific tracking
export function setModeSetContext(modeSet: string) {
  Sentry.setTag('mode_set', modeSet);
  Sentry.setContext('mode_set_info', {
    current_mode: modeSet,
    timestamp: new Date().toISOString()
  });
}

// Performance monitoring for specific operations
export function trackPerformance<T>(operationName: string, operation: () => T): T {
  const transaction = Sentry.startTransaction({
    name: operationName,
    op: 'custom'
  });

  try {
    const result = operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

// Async performance monitoring
export async function trackAsyncPerformance<T>(
  operationName: string, 
  operation: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({
    name: operationName,
    op: 'custom'
  });

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}

// Feature usage tracking
export function trackFeatureUsage(feature: string, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Feature used: ${feature}`,
    category: 'feature_usage',
    level: 'info',
    data: metadata
  });
}

// Editor performance tracking
export function trackEditorOperation(operation: string, duration: number, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Editor operation: ${operation}`,
    category: 'editor_performance',
    level: 'info',
    data: {
      duration_ms: duration,
      ...metadata
    }
  });
  
  // Also send as custom metric if duration is concerning
  if (duration > 1000) { // More than 1 second
    logMessage(`Slow editor operation: ${operation}`, 'warning', {
      duration_ms: duration,
      ...metadata
    });
  }
}

// AI operation tracking
export function trackAIOperation(operation: string, success: boolean, duration?: number, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `AI operation: ${operation}`,
    category: 'ai_operation',
    level: success ? 'info' : 'error',
    data: {
      success,
      duration_ms: duration,
      ...metadata
    }
  });
  
  if (!success) {
    logMessage(`AI operation failed: ${operation}`, 'error', metadata);
  }
}

// Collaboration tracking
export function trackCollaborationEvent(event: string, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Collaboration event: ${event}`,
    category: 'collaboration',
    level: 'info',
    data: metadata
  });
}

// Lock system tracking
export function trackLockOperation(operation: string, lockType: string, success: boolean, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    message: `Lock operation: ${operation}`,
    category: 'lock_system',
    level: success ? 'info' : 'warning',
    data: {
      lock_type: lockType,
      success,
      ...metadata
    }
  });
}

export default {
  initSentry,
  logError,
  logMessage,
  setUserContext,
  setModeSetContext,
  trackPerformance,
  trackAsyncPerformance,
  trackFeatureUsage,
  trackEditorOperation,
  trackAIOperation,
  trackCollaborationEvent,
  trackLockOperation
};