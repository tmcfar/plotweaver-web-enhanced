# PlotWeaver Frontend - Help & Feedback Implementation Plan

## Overview
Implement event tracking, feedback collection UI, and contextual help system for PlotWeaver's React/Next.js frontend, integrating with the existing project structure and Flask backend.

## Phase 1: Event Tracking UI (Days 1-10)

### 1.1 Core Analytics Service
Create event tracking infrastructure:

```bash
# Create analytics directory structure
mkdir -p src/services/analytics
touch src/services/analytics/eventTracker.ts
touch src/services/analytics/sessionManager.ts
touch src/services/analytics/types.ts
```

#### Event Tracker Service (`src/services/analytics/eventTracker.ts`)
```typescript
import { v4 as uuidv4 } from 'uuid';

interface TrackedEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  agentName?: string;
  durationMs?: number;
  context: Record<string, any>;
}

class EventTracker {
  private sessionId: string;
  private eventQueue: TrackedEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private projectId?: number;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startBatchProcessor();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('plotweaver_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('plotweaver_session_id', sessionId);
      localStorage.setItem('session_start', new Date().toISOString());
    }
    return sessionId;
  }

  setProjectId(projectId: number) {
    this.projectId = projectId;
  }

  track(eventType: string, context: Record<string, any> = {}) {
    const event: TrackedEvent = {
      eventId: uuidv4(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      context: {
        ...context,
        url: window.location.pathname,
        projectId: this.projectId || this.extractProjectId(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= 10) {
      this.flush();
    }
  }

  private extractProjectId(): number | undefined {
    const match = window.location.pathname.match(/\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/v1/events/batch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': this.sessionId
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      this.eventQueue.unshift(...events);
      console.error('Failed to send events:', error);
    }
  }

  private startBatchProcessor() {
    this.batchTimer = setInterval(() => this.flush(), 30000);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    const startTime = localStorage.getItem('session_start');
    if (!startTime) return 0;
    return Date.now() - new Date(startTime).getTime();
  }
}

export const eventTracker = new EventTracker();
```

### 1.2 React Hooks for Tracking
Create reusable hooks:

```typescript
// src/hooks/useTracking.ts
import { useEffect, useRef } from 'react';
import { eventTracker } from '@/services/analytics/eventTracker';

export function useTracking(componentName: string) {
  const startTime = useRef<number>();

  useEffect(() => {
    startTime.current = Date.now();
    eventTracker.track('component_view', { component: componentName });

    return () => {
      if (startTime.current) {
        const duration = Date.now() - startTime.current;
        eventTracker.track('component_exit', {
          component: componentName,
          durationMs: duration
        });
      }
    };
  }, [componentName]);

  const trackEvent = (eventType: string, context?: Record<string, any>) => {
    eventTracker.track(eventType, {
      component: componentName,
      ...context
    });
  };

  return { trackEvent };
}

// src/hooks/useAgentTracking.ts
export function useAgentTracking(agentName: string) {
  const trackGeneration = async (
    generationType: string, 
    callback: () => Promise<any>
  ) => {
    const startTime = Date.now();
    let success = true;
    let error: any = null;

    try {
      const result = await callback();
      return result;
    } catch (e) {
      success = false;
      error = e;
      throw e;
    } finally {
      eventTracker.track('agent_generation', {
        agentName,
        generationType,
        durationMs: Date.now() - startTime,
        success,
        error: error?.message
      });
    }
  };

  return { trackGeneration };
}
```

### 1.3 Integration with Existing Components
Update key components to include tracking:

```typescript
// Example: Scene generation component
import { useAgentTracking } from '@/hooks/useAgentTracking';

export function SceneGenerator({ chapterId }: Props) {
  const { trackGeneration } = useAgentTracking('scene_agent');
  
  const generateScene = async () => {
    await trackGeneration('scene', async () => {
      // Existing generation logic
      const response = await api.generateScene(chapterId);
      return response;
    });
  };
}
```

## Phase 2: Feedback UI Components (Days 11-20)

### 2.1 Component Library Structure
```bash
mkdir -p src/components/feedback
touch src/components/feedback/MicroFeedback.tsx
touch src/components/feedback/FrictionDetector.tsx
touch src/components/feedback/SessionFeedback.tsx
touch src/components/feedback/index.ts
```

### 2.2 Micro-Feedback Component
```typescript
// src/components/feedback/MicroFeedback.tsx
import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { eventTracker } from '@/services/analytics/eventTracker';

interface MicroFeedbackProps {
  contentType: string;
  contentId: string;
  context?: Record<string, any>;
  onFeedback?: (rating: number) => void;
}

export function MicroFeedback({ 
  contentType, 
  contentId, 
  context,
  onFeedback 
}: MicroFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (newRating: number) => {
    if (isSubmitting || rating !== null) return;

    setIsSubmitting(true);
    setRating(newRating);

    try {
      const projectId = eventTracker.getProjectId() || context?.projectId;

      const response = await fetch('/api/v1/feedback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-ID': eventTracker.getSessionId()
        },
        body: JSON.stringify({
          feedbackType: 'micro',
          contentType,
          contentId,
          projectId,
          rating: newRating,
          comment: comment || undefined,
          context
        })
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      toast.success('Thanks for your feedback!');
      onFeedback?.(newRating);
      
      if (newRating === -1) {
        setShowComment(true);
      } else {
        // Reset after positive feedback
        setTimeout(() => {
          setRating(null);
          setComment('');
        }, 2000);
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
      setRating(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = () => {
    if (comment.trim() && rating === -1) {
      submitFeedback(rating);
    }
  };

  return (
    <div className="inline-flex items-center gap-2 ml-4">
      <button
        onClick={() => submitFeedback(1)}
        disabled={isSubmitting || rating !== null}
        className={`p-1 rounded transition-all ${
          rating === 1 
            ? 'text-green-600 bg-green-50 scale-110' 
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Good"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => submitFeedback(-1)}
        disabled={isSubmitting || rating !== null}
        className={`p-1 rounded transition-all ${
          rating === -1 
            ? 'text-red-600 bg-red-50 scale-110' 
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        aria-label="Bad"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>

      {showComment && rating === -1 && (
        <div className="flex items-center gap-2 ml-2 animate-slide-in">
          <input
            type="text"
            placeholder="What went wrong? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCommentSubmit();
            }}
            className="px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
            maxLength={100}
            autoFocus
          />
          <button
            onClick={handleCommentSubmit}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
```

### 2.3 Friction Detection System
```typescript
// src/components/feedback/FrictionDetector.tsx
import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { eventTracker } from '@/services/analytics/eventTracker';

interface FrictionDetectorProps {
  contentType: string;
  contentId: string;
  regenerationCount: number;
  onReport?: () => void;
}

export function FrictionDetector({ 
  contentType,
  contentId,
  regenerationCount,
  onReport 
}: FrictionDetectorProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (regenerationCount >= 3 && !showPrompt) {
      setShowPrompt(true);
      eventTracker.track('friction_detected', {
        contentType,
        contentId,
        regenerationCount
      });
    }
  }, [regenerationCount, contentType, contentId]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await fetch(`/api/v1/projects/${eventTracker.getProjectId()}/feedback/friction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': eventTracker.getSessionId()
        },
        body: JSON.stringify({
          contentType,
          contentId,
          regenerationCount,
          explanation
        })
      });

      onReport?.();
      setShowPrompt(false);
    } catch (error) {
      console.error('Failed to report friction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm animate-slide-up">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-yellow-900">Having trouble?</h4>
          <p className="text-sm text-yellow-700 mt-1">
            We noticed you've regenerated this {contentType} {regenerationCount} times.
          </p>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="What's not working? Your feedback helps us improve."
            className="w-full mt-2 p-2 text-sm border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="px-3 py-1 text-yellow-700 text-sm hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2.4 Session Feedback Modal
```typescript
// src/components/feedback/SessionFeedback.tsx
import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { eventTracker } from '@/services/analytics/eventTracker';

interface SessionFeedbackProps {
  trigger?: 'manual' | 'auto';
  onComplete?: () => void;
}

export function SessionFeedback({ trigger = 'auto', onComplete }: SessionFeedbackProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [satisfaction, setSatisfaction] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [challenge, setChallenge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (trigger === 'auto') {
      // Show after 30 minutes or on save/export
      const timer = setTimeout(() => {
        if (eventTracker.getSessionDuration() > 30 * 60 * 1000) {
          setIsOpen(true);
        }
      }, 30 * 60 * 1000);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  const handleSubmit = async () => {
    if (satisfaction === 0 || nps === null) return;

    setIsSubmitting(true);

    try {
      await fetch('/api/v1/feedback/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': eventTracker.getSessionId()
        },
        body: JSON.stringify({
          satisfaction,
          likelihoodToRecommend: nps,
          biggestChallenge: challenge || undefined,
          sessionDuration: eventTracker.getSessionDuration()
        })
      });

      eventTracker.track('session_feedback_submitted', {
        satisfaction,
        nps
      });

      onComplete?.();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to submit session feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-lg p-6 max-w-md w-full animate-scale-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">How was your experience today?</h3>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Overall satisfaction
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setSatisfaction(value)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      value <= satisfaction 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* NPS Score */}
          <div>
            <label className="block text-sm font-medium mb-2">
              How likely are you to recommend PlotWeaver?
            </label>
            <div className="grid grid-cols-11 gap-1">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setNps(i)}
                  className={`px-2 py-1 rounded text-sm transition-colors ${
                    i === nps 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>

          {/* Open Feedback */}
          <div>
            <label className="block text-sm font-medium mb-2">
              What was your biggest challenge today? (optional)
            </label>
            <textarea
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Tell us what could be better..."
              maxLength={500}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={satisfaction === 0 || nps === null || isSubmitting}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Phase 3: Contextual Help System (Days 21-30)

### 3.1 Help System Architecture
```bash
mkdir -p src/components/help
touch src/components/help/Tooltip.tsx
touch src/components/help/InlineGuide.tsx
touch src/components/help/HelpSearch.tsx
touch src/components/help/HelpProvider.tsx
```

### 3.2 Help Provider Context
```typescript
// src/components/help/HelpProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface HelpContent {
  helpId: string;
  title: string;
  content: string;
  contentType: 'tooltip' | 'guide' | 'article';
}

interface HelpContextType {
  helpContent: Map<string, HelpContent>;
  loadHelp: (helpIds: string[]) => Promise<void>;
  searchHelp: (query: string) => Promise<HelpContent[]>;
}

const HelpContext = createContext<HelpContextType | null>(null);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [helpContent, setHelpContent] = useState(new Map<string, HelpContent>());

  const loadHelp = async (helpIds: string[]) => {
    // Check cache first
    const uncached = helpIds.filter(id => !helpContent.has(id));
    
    if (uncached.length === 0) return;

    try {
      const response = await fetch('/api/v1/help/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpIds: uncached })
      });
      
      const data = await response.json();
      setHelpContent(prev => {
        const next = new Map(prev);
        data.forEach((item: HelpContent) => {
          next.set(item.helpId, item);
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to load help content:', error);
    }
  };

  const searchHelp = async (query: string): Promise<HelpContent[]> => {
    const response = await fetch(`/api/v1/help/search?q=${encodeURIComponent(query)}`);
    return response.json();
  };

  return (
    <HelpContext.Provider value={{ helpContent, loadHelp, searchHelp }}>
      {children}
    </HelpContext.Provider>
  );
}

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) throw new Error('useHelp must be used within HelpProvider');
  return context;
};
```

### 3.3 Smart Tooltip Component
```typescript
// src/components/help/Tooltip.tsx
import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { useHelp } from './HelpProvider';
import { eventTracker } from '@/services/analytics/eventTracker';

interface TooltipProps {
  helpId: string;
  children: React.ReactNode;
  showIcon?: boolean;
}

export function Tooltip({ helpId, children, showIcon = true }: TooltipProps) {
  const { helpContent, loadHelp } = useHelp();
  const [isOpen, setIsOpen] = useState(false);
  const content = helpContent.get(helpId);

  useEffect(() => {
    loadHelp([helpId]);
  }, [helpId]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      eventTracker.track('help_tooltip_viewed', { helpId });
    }
  };

  return (
    <TooltipPrimitive.Provider>
      <TooltipPrimitive.Root
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        <TooltipPrimitive.Trigger asChild>
          <span className="inline-flex items-center gap-1">
            {children}
            {showIcon && <HelpCircle className="w-4 h-4 text-gray-400" />}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="bg-gray-900 text-white px-3 py-2 rounded text-sm max-w-xs animate-fade-in"
            sideOffset={5}
          >
            {content?.content || 'Loading...'}
            <TooltipPrimitive.Arrow className="fill-gray-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
```

## Phase 4: Analytics Dashboard (Days 31-40)

### 4.1 Dashboard Components
```bash
mkdir -p src/components/analytics
touch src/components/analytics/DashboardOverview.tsx
touch src/components/analytics/EventMonitor.tsx
touch src/components/analytics/QualityMetrics.tsx
```

### 4.2 Real-time Event Monitor
```typescript
// src/components/analytics/EventMonitor.tsx
import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export function EventMonitor() {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // WebSocket connection for real-time events
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/events`);
    
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    
    ws.onmessage = (message) => {
      const event = JSON.parse(message.data);
      setEvents(prev => [event, ...prev].slice(0, 50));
    };
    
    return () => ws.close();
  }, []);

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg h-96 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <Activity className={`w-5 h-5 ${isConnected ? 'text-green-400 animate-pulse' : 'text-red-400'}`} />
        <h3 className="font-semibold">Live Events</h3>
        <span className="text-xs text-gray-400">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      <div className="space-y-1 text-xs font-mono overflow-auto">
        {events.map((event, i) => (
          <div
            key={`${event.eventId}-${i}`}
            className="flex gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <span className="text-gray-500">
              {new Date(event.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-blue-400">{event.eventType}</span>
            {event.agentName && (
              <span className="text-yellow-400">[{event.agentName}]</span>
            )}
            <span className="text-gray-600 truncate">
              {event.sessionId.slice(0, 8)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Phase 5: Privacy & Performance (Days 41-50)

### 5.1 Privacy Settings Component
```typescript
// src/components/settings/PrivacySettings.tsx
import React, { useState, useEffect } from 'react';
import { Shield, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function PrivacySettings() {
  const [settings, setSettings] = useState({
    trackingEnabled: true,
    shareAnonymousData: true,
    retentionDays: 30
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load current settings
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/v1/users/privacy-settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      await fetch('/api/v1/users/privacy-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
      
      setSettings(prev => ({ ...prev, [key]: value }));
      
      // Update local tracking if needed
      if (key === 'trackingEnabled') {
        localStorage.setItem('tracking_enabled', value.toString());
      }
      
      toast.success('Privacy settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  // Rest of component implementation...
}
```

## Testing Strategy

### Unit Tests
```typescript
// __tests__/components/feedback/MicroFeedback.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MicroFeedback } from '@/components/feedback/MicroFeedback';

describe('MicroFeedback', () => {
  it('submits positive feedback', async () => {
    const onFeedback = jest.fn();
    render(
      <MicroFeedback 
        contentType="scene"
        contentId="123"
        onFeedback={onFeedback}
      />
    );

    fireEvent.click(screen.getByLabelText('Good'));
    
    await waitFor(() => {
      expect(onFeedback).toHaveBeenCalledWith(1);
    });
  });
});
```

### Integration Tests
```typescript
// __tests__/services/eventTracker.test.ts
import { eventTracker } from '@/services/analytics/eventTracker';

describe('EventTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('batches events correctly', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    
    // Track 10 events to trigger batch
    for (let i = 0; i < 10; i++) {
      eventTracker.track('test_event', { index: i });
    }

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/events/batch',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('test_event')
        })
      );
    });
  });
});
```

## Implementation Checklist

### Week 1-2: Event Tracking
- [ ] Set up analytics service
- [ ] Create tracking hooks
- [ ] Integrate with existing components
- [ ] Add session management
- [ ] Test event batching

### Week 3-4: Feedback UI
- [ ] Build micro-feedback component
- [ ] Implement friction detection
- [ ] Create session feedback modal
- [ ] Add animations and transitions
- [ ] Test feedback flow

### Week 5-6: Help System
- [ ] Create help provider context
- [ ] Build tooltip system
- [ ] Implement inline guides
- [ ] Add help search
- [ ] Cache help content

### Week 7-8: Analytics Dashboard
- [ ] Build dashboard overview
- [ ] Add real-time monitoring
- [ ] Create quality metrics
- [ ] Implement data visualization
- [ ] Test WebSocket connection

### Week 9-10: Privacy & Polish
- [ ] Add privacy settings
- [ ] Implement data export
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Cross-browser testing

## Performance Considerations

### Bundle Size
- Lazy load analytics dashboard
- Tree-shake unused components
- Use dynamic imports for heavy features

### Runtime Performance
- Debounce tracking calls
- Use Web Workers for heavy processing
- Implement virtual scrolling for lists
- Cache help content aggressively

### Network Optimization
- Batch API calls
- Use WebSocket for real-time data
- Implement request deduplication
- Add offline support

## Deployment Strategy

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_ENABLE_TRACKING=true
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
```

### Feature Flags
```typescript
// src/config/features.ts
export const features = {
  eventTracking: process.env.NEXT_PUBLIC_ENABLE_TRACKING === 'true',
  feedbackUI: true,
  helpSystem: true,
  analyticssDashboard: process.env.NODE_ENV === 'development',
  privacyControls: true
};
```

## Success Metrics

### User Experience
- Feedback submission < 100ms perceived latency
- Help tooltips appear instantly
- Smooth animations at 60fps
- Works offline with queue

### Technical Metrics
- Bundle size increase < 50KB
- 100% test coverage for critical paths
- Zero accessibility violations
- Works in all modern browsers

### Business Metrics
- 40% of users provide feedback
- Help content reduces support tickets by 50%
- Session duration increases by 20%
- User satisfaction improves by 30%
