// Analytics and user behavior tracking

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

interface UserProperties {
  mode_set?: string;
  user_id?: string;
  subscription_tier?: string;
  feature_flags?: string[];
}

class AnalyticsManager {
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private userProperties: UserProperties = {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Initialize Google Analytics 4
    if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
      this.initGA4();
    }

    // Initialize PostHog
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      this.initPostHog();
    }

    this.isInitialized = true;
    this.flushEventQueue();
  }

  private initGA4() {
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_ANALYTICS_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', process.env.NEXT_PUBLIC_ANALYTICS_ID, {
      page_title: 'PlotWeaver',
      page_location: window.location.href,
      custom_map: {
        custom_parameter_mode_set: 'mode_set'
      }
    });
  }

  private initPostHog() {
    // PostHog implementation would go here
    // This is a placeholder for PostHog initialization
    console.log('PostHog initialized with key:', process.env.NEXT_PUBLIC_POSTHOG_KEY);
  }

  private flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  private sendEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    // Send to Google Analytics
    if (typeof window.gtag === 'function') {
      window.gtag('event', event.name, {
        ...event.properties,
        ...this.userProperties,
        timestamp: event.timestamp || new Date().toISOString()
      });
    }

    // Send to PostHog (if initialized)
    if (window.posthog) {
      window.posthog.capture(event.name, {
        ...event.properties,
        ...this.userProperties
      });
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  // Public methods
  trackEvent(name: string, properties?: Record<string, any>) {
    this.sendEvent({
      name,
      properties,
      timestamp: new Date().toISOString()
    });
  }

  setUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };
    
    // Set user properties in GA4
    if (typeof window.gtag === 'function') {
      window.gtag('config', process.env.NEXT_PUBLIC_ANALYTICS_ID, {
        user_properties: this.userProperties
      });
    }

    // Set user properties in PostHog
    if (window.posthog) {
      window.posthog.identify(properties.user_id, properties);
    }
  }

  // Mode-set specific tracking
  trackModeSetChange(oldMode: string | null, newMode: string) {
    this.trackEvent('mode_set_changed', {
      old_mode: oldMode,
      new_mode: newMode,
      timestamp: new Date().toISOString()
    });

    this.setUserProperties({ mode_set: newMode });
  }

  trackModeSetFeatureUsage(modeSet: string, feature: string, metadata?: Record<string, any>) {
    this.trackEvent('mode_set_feature_used', {
      mode_set: modeSet,
      feature,
      ...metadata
    });
  }

  // Editor tracking
  trackEditorAction(action: string, metadata?: Record<string, any>) {
    this.trackEvent('editor_action', {
      action,
      mode_set: this.userProperties.mode_set,
      ...metadata
    });
  }

  trackContentGeneration(type: 'scene' | 'character' | 'location', success: boolean, duration?: number) {
    this.trackEvent('content_generated', {
      content_type: type,
      success,
      duration_ms: duration,
      mode_set: this.userProperties.mode_set
    });
  }

  // Collaboration tracking
  trackCollaborationAction(action: string, metadata?: Record<string, any>) {
    this.trackEvent('collaboration_action', {
      action,
      ...metadata
    });
  }

  // Lock system tracking
  trackLockAction(action: 'lock' | 'unlock' | 'override', lockType: string, metadata?: Record<string, any>) {
    this.trackEvent('lock_action', {
      action,
      lock_type: lockType,
      ...metadata
    });
  }

  // Performance tracking
  trackPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
    this.trackEvent('performance_metric', {
      metric,
      value,
      unit,
      mode_set: this.userProperties.mode_set
    });
  }

  // User engagement tracking
  trackPageView(page: string, properties?: Record<string, any>) {
    this.trackEvent('page_view', {
      page,
      mode_set: this.userProperties.mode_set,
      ...properties
    });
  }

  trackSessionStart() {
    this.trackEvent('session_start', {
      mode_set: this.userProperties.mode_set,
      timestamp: new Date().toISOString()
    });
  }

  trackSessionEnd(duration: number) {
    this.trackEvent('session_end', {
      duration_ms: duration,
      mode_set: this.userProperties.mode_set
    });
  }

  // Feature adoption tracking
  trackFeatureDiscovery(feature: string, context: string) {
    this.trackEvent('feature_discovered', {
      feature,
      context,
      mode_set: this.userProperties.mode_set
    });
  }

  trackFeatureFirstUse(feature: string) {
    this.trackEvent('feature_first_use', {
      feature,
      mode_set: this.userProperties.mode_set
    });
  }

  // Error tracking
  trackError(error: string, context?: Record<string, any>) {
    this.trackEvent('error_occurred', {
      error,
      mode_set: this.userProperties.mode_set,
      ...context
    });
  }

  // AI interaction tracking
  trackAIInteraction(interaction: string, success: boolean, metadata?: Record<string, any>) {
    this.trackEvent('ai_interaction', {
      interaction,
      success,
      mode_set: this.userProperties.mode_set,
      ...metadata
    });
  }

  // Export tracking
  trackExport(format: string, size: number, success: boolean) {
    this.trackEvent('content_exported', {
      format,
      size_bytes: size,
      success,
      mode_set: this.userProperties.mode_set
    });
  }

  // Search tracking
  trackSearch(query: string, results: number, category?: string) {
    this.trackEvent('search_performed', {
      query: query.length > 50 ? query.substring(0, 50) + '...' : query, // Truncate long queries
      results_count: results,
      category,
      mode_set: this.userProperties.mode_set
    });
  }

  // Funnel tracking
  trackFunnelStep(funnel: string, step: string, metadata?: Record<string, any>) {
    this.trackEvent('funnel_step', {
      funnel,
      step,
      mode_set: this.userProperties.mode_set,
      ...metadata
    });
  }
}

// Global analytics instance
const analytics = new AnalyticsManager();

// Convenience functions
export function trackEvent(name: string, properties?: Record<string, any>) {
  analytics.trackEvent(name, properties);
}

export function setUserProperties(properties: UserProperties) {
  analytics.setUserProperties(properties);
}

export function trackModeSetChange(oldMode: string | null, newMode: string) {
  analytics.trackModeSetChange(oldMode, newMode);
}

export function trackModeSetFeatureUsage(modeSet: string, feature: string, metadata?: Record<string, any>) {
  analytics.trackModeSetFeatureUsage(modeSet, feature, metadata);
}

export function trackEditorAction(action: string, metadata?: Record<string, any>) {
  analytics.trackEditorAction(action, metadata);
}

export function trackContentGeneration(type: 'scene' | 'character' | 'location', success: boolean, duration?: number) {
  analytics.trackContentGeneration(type, success, duration);
}

export function trackCollaborationAction(action: string, metadata?: Record<string, any>) {
  analytics.trackCollaborationAction(action, metadata);
}

export function trackLockAction(action: 'lock' | 'unlock' | 'override', lockType: string, metadata?: Record<string, any>) {
  analytics.trackLockAction(action, lockType, metadata);
}

export function trackPerformanceMetric(metric: string, value: number, unit: string = 'ms') {
  analytics.trackPerformanceMetric(metric, value, unit);
}

export function trackPageView(page: string, properties?: Record<string, any>) {
  analytics.trackPageView(page, properties);
}

export function trackSessionStart() {
  analytics.trackSessionStart();
}

export function trackSessionEnd(duration: number) {
  analytics.trackSessionEnd(duration);
}

export function trackFeatureDiscovery(feature: string, context: string) {
  analytics.trackFeatureDiscovery(feature, context);
}

export function trackFeatureFirstUse(feature: string) {
  analytics.trackFeatureFirstUse(feature);
}

export function trackError(error: string, context?: Record<string, any>) {
  analytics.trackError(error, context);
}

export function trackAIInteraction(interaction: string, success: boolean, metadata?: Record<string, any>) {
  analytics.trackAIInteraction(interaction, success, metadata);
}

export function trackExport(format: string, size: number, success: boolean) {
  analytics.trackExport(format, size, success);
}

export function trackSearch(query: string, results: number, category?: string) {
  analytics.trackSearch(query, results, category);
}

export function trackFunnelStep(funnel: string, step: string, metadata?: Record<string, any>) {
  analytics.trackFunnelStep(funnel, step, metadata);
}

// Type declarations for global objects
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    posthog: any;
  }
}

export default analytics;