import { v4 as uuidv4 } from 'uuid';
import { TrackedEvent } from './types';
import { sessionManager } from './sessionManager';
import { apiClient } from '../api/client';

class EventTracker {
  private eventQueue: TrackedEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private isTrackingEnabled: boolean = true;

  constructor() {
    this.initializeTracking();
    this.startBatchProcessor();
    this.setupBeforeUnload();
  }

  private initializeTracking(): void {
    // Check if tracking is enabled from localStorage or environment
    const trackingEnabled = localStorage.getItem('tracking_enabled');
    if (trackingEnabled !== null) {
      this.isTrackingEnabled = trackingEnabled === 'true';
    } else {
      this.isTrackingEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING === 'true';
    }
  }

  private setupBeforeUnload(): void {
    // Flush events before page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush events when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  setTrackingEnabled(enabled: boolean): void {
    this.isTrackingEnabled = enabled;
    localStorage.setItem('tracking_enabled', enabled.toString());
    
    if (!enabled) {
      this.clearQueue();
    }
  }

  isEnabled(): boolean {
    return this.isTrackingEnabled;
  }

  track(eventType: string, context: Record<string, any> = {}): void {
    if (!this.isTrackingEnabled) return;

    const event: TrackedEvent = {
      eventId: uuidv4(),
      sessionId: sessionManager.getSessionId(),
      timestamp: new Date().toISOString(),
      eventType,
      context: {
        ...context,
        url: window.location.pathname,
        projectId: sessionManager.getProjectId(),
        userId: sessionManager.getUserId(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent,
        referrer: document.referrer
      }
    };

    this.eventQueue.push(event);
    
    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  trackTiming(eventType: string, startTime: number, context: Record<string, any> = {}): void {
    const duration = Date.now() - startTime;
    this.track(eventType, {
      ...context,
      durationMs: duration
    });
  }

  trackAgent(agentName: string, eventType: string, context: Record<string, any> = {}): void {
    this.track(eventType, {
      ...context,
      agentName
    });
  }

  getProjectId(): number | undefined {
    return sessionManager.getProjectId();
  }

  async flush(): Promise<void> {
    if (!this.isTrackingEnabled || this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    await this.sendEvents(events);
  }

  private async sendEvents(events: TrackedEvent[], retryCount = 0): Promise<void> {
    try {
      await apiClient.submitEventBatch(events);

      // Track successful batch send
      console.debug(`Successfully sent ${events.length} events`);
    } catch (error) {
      console.error('Failed to send events:', error);
      
      // Retry logic
      if (retryCount < this.MAX_RETRIES) {
        setTimeout(() => {
          this.sendEvents(events, retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // Exponential backoff
      } else {
        // Re-queue events if all retries failed
        this.eventQueue.unshift(...events);
      }
    }
  }

  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      this.flush();
    }, this.BATCH_INTERVAL);
  }

  private clearQueue(): void {
    this.eventQueue = [];
  }

  // Utility methods for common tracking patterns
  trackPageView(pageName: string): void {
    this.track('page_view', { pageName });
  }

  trackClick(elementId: string, elementType: string): void {
    this.track('click', { elementId, elementType });
  }

  trackFormSubmit(formId: string, formData?: Record<string, any>): void {
    this.track('form_submit', { formId, formData });
  }

  trackError(error: Error, context: Record<string, any> = {}): void {
    this.track('error', {
      ...context,
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name
    });
  }

  trackPerformance(metric: string, value: number, context: Record<string, any> = {}): void {
    this.track('performance', {
      ...context,
      metric,
      value
    });
  }

  // Clean up resources
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    this.flush();
  }
}

export const eventTracker = new EventTracker();