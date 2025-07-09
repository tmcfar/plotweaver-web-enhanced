import { useEffect, useRef, useCallback } from 'react';
import { eventTracker } from '@/services/analytics';

export function useTracking(componentName: string) {
  const startTime = useRef<number>();
  const mountTime = useRef<number>();

  useEffect(() => {
    startTime.current = Date.now();
    mountTime.current = Date.now();
    
    eventTracker.track('component_mount', { 
      component: componentName,
      timestamp: new Date().toISOString()
    });

    return () => {
      if (startTime.current) {
        const duration = Date.now() - startTime.current;
        eventTracker.track('component_unmount', {
          component: componentName,
          durationMs: duration,
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [componentName]);

  const trackEvent = useCallback((eventType: string, context?: Record<string, any>) => {
    eventTracker.track(eventType, {
      component: componentName,
      componentMountTime: mountTime.current,
      ...context
    });
  }, [componentName]);

  const trackClick = useCallback((elementId: string, extraContext?: Record<string, any>) => {
    trackEvent('component_click', {
      elementId,
      ...extraContext
    });
  }, [trackEvent]);

  const trackInteraction = useCallback((interactionType: string, context?: Record<string, any>) => {
    trackEvent('component_interaction', {
      interactionType,
      ...context
    });
  }, [trackEvent]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    eventTracker.trackError(error, {
      component: componentName,
      ...context
    });
  }, [componentName]);

  const trackTiming = useCallback((eventType: string, startTime: number, context?: Record<string, any>) => {
    eventTracker.trackTiming(eventType, startTime, {
      component: componentName,
      ...context
    });
  }, [componentName]);

  return { 
    trackEvent, 
    trackClick, 
    trackInteraction, 
    trackError, 
    trackTiming 
  };
}

export function usePageTracking(pageName: string) {
  useEffect(() => {
    eventTracker.trackPageView(pageName);
  }, [pageName]);
}

export function usePerformanceTracking(componentName: string) {
  const renderStartTime = useRef<number>();

  useEffect(() => {
    renderStartTime.current = Date.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = Date.now() - renderStartTime.current;
      eventTracker.trackPerformance('component_render_time', renderTime, {
        component: componentName
      });
    }
  });

  const trackPerformanceMetric = useCallback((metric: string, value: number, context?: Record<string, any>) => {
    eventTracker.trackPerformance(metric, value, {
      component: componentName,
      ...context
    });
  }, [componentName]);

  return { trackPerformanceMetric };
}