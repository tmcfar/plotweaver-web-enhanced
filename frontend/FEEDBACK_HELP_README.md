# PlotWeaver Frontend - Feedback & Help System

This implementation provides a comprehensive event tracking, feedback collection, and contextual help system for the PlotWeaver React/Next.js frontend.

## Features Implemented

### 1. Event Tracking System
- **Event Tracker Service**: Batches and sends user events to the backend
- **Session Manager**: Manages user sessions and tracks session duration
- **Tracking Hooks**: React hooks for easy event tracking integration

### 2. Feedback Components
- **MicroFeedback**: Thumbs up/down feedback with optional comments
- **FrictionDetector**: Automatic friction detection after multiple regenerations
- **SessionFeedback**: End-of-session feedback modal with NPS scoring

### 3. Help System
- **HelpProvider**: Context provider for help content management
- **HelpTooltip**: Smart tooltips with help content
- **HelpSearch**: Searchable help content with autocomplete
- **InlineGuide**: Expandable inline help guides

## Quick Start

### 1. Wrap your app with providers

```tsx
// In your main App.tsx or layout
import { HelpProvider } from '@/components/help';

function App() {
  return (
    <HelpProvider>
      {/* Your app content */}
    </HelpProvider>
  );
}
```

### 2. Add event tracking to components

```tsx
import { useTracking } from '@/hooks/useTracking';

function MyComponent() {
  const { trackEvent } = useTracking('MyComponent');

  const handleClick = () => {
    trackEvent('button_clicked', { buttonId: 'submit' });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### 3. Add feedback to generated content

```tsx
import { MicroFeedback } from '@/components/feedback';

function SceneCard({ scene }) {
  return (
    <div className="scene-card">
      <p>{scene.content}</p>
      <MicroFeedback
        contentType="scene"
        contentId={scene.id}
        onFeedback={(rating) => console.log('Feedback:', rating)}
      />
    </div>
  );
}
```

### 4. Add help tooltips

```tsx
import { HelpTooltip } from '@/components/help';

function FeatureButton() {
  return (
    <HelpTooltip helpId="scene-generation-help">
      <button>Generate Scene</button>
    </HelpTooltip>
  );
}
```

## Component API Reference

### MicroFeedback

Props:
- `contentType: string` - Type of content (e.g., 'scene', 'character')
- `contentId: string` - Unique identifier for the content
- `context?: Record<string, any>` - Additional context data
- `onFeedback?: (rating: number) => void` - Callback when feedback is given
- `className?: string` - Additional CSS classes

### FrictionDetector

Props:
- `contentType: string` - Type of content being regenerated
- `contentId: string` - Unique identifier for the content
- `regenerationCount: number` - Current number of regenerations
- `onReport?: (reported: boolean) => void` - Callback when friction is reported
- `threshold?: number` - Number of regenerations before showing (default: 3)
- `className?: string` - Additional CSS classes

### SessionFeedback

Props:
- `isOpen: boolean` - Whether the modal is open
- `onClose: () => void` - Callback to close the modal
- `trigger?: 'manual' | 'auto' | 'save' | 'export'` - What triggered the feedback
- `onComplete?: (submitted: boolean) => void` - Callback when feedback is complete
- `className?: string` - Additional CSS classes

### HelpTooltip

Props:
- `helpId: string` - Unique identifier for the help content
- `children: React.ReactNode` - Content to wrap with tooltip
- `showIcon?: boolean` - Whether to show help icon (default: true)
- `iconPosition?: 'left' | 'right'` - Position of help icon (default: 'right')
- `trigger?: 'hover' | 'click' | 'focus'` - How to trigger tooltip (default: 'hover')
- `side?: 'top' | 'right' | 'bottom' | 'left'` - Tooltip position (default: 'top')
- `className?: string` - Additional CSS classes

### HelpSearch

Props:
- `onResultClick?: (helpId: string) => void` - Callback when result is clicked
- `placeholder?: string` - Search input placeholder
- `className?: string` - Additional CSS classes

### InlineGuide

Props:
- `helpId: string` - Unique identifier for the help content
- `title?: string` - Custom title for the guide
- `defaultExpanded?: boolean` - Whether guide starts expanded (default: false)
- `showIcon?: boolean` - Whether to show guide icon (default: true)
- `className?: string` - Additional CSS classes

## Event Tracking Usage

### Basic Tracking Hooks

```tsx
import { useTracking, useAgentTracking } from '@/hooks/useTracking';

function SceneGenerator() {
  const { trackEvent } = useTracking('SceneGenerator');
  const { trackGeneration } = useAgentTracking('scene_agent');

  const generateScene = async () => {
    await trackGeneration('scene', async () => {
      // Your generation logic here
      const response = await api.generateScene();
      return response;
    });
  };

  return (
    <button onClick={generateScene}>
      Generate Scene
    </button>
  );
}
```

### Manual Event Tracking

```tsx
import { eventTracker } from '@/services/analytics';

// Track custom events
eventTracker.track('custom_event', {
  key: 'value',
  timestamp: Date.now()
});

// Track performance metrics
eventTracker.trackPerformance('component_render', 150);

// Track errors
eventTracker.trackError(new Error('Something went wrong'), {
  component: 'MyComponent'
});
```

## Help Content Management

### Loading Help Content

Help content is automatically loaded when needed, but you can preload:

```tsx
import { useHelp } from '@/components/help';

function MyComponent() {
  const { preloadHelp } = useHelp();

  useEffect(() => {
    preloadHelp(['help-id-1', 'help-id-2']);
  }, []);
}
```

### Custom Help Content Hook

```tsx
import { useHelpContent } from '@/components/help';

function CustomHelpComponent({ helpId }) {
  const { content, isLoading, error } = useHelpContent(helpId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!content) return <div>No content available</div>;

  return <div>{content.content}</div>;
}
```

## Configuration

### Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_ENABLE_TRACKING=true
NEXT_PUBLIC_SESSION_TIMEOUT=1800000
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Analytics Settings

Users can disable tracking:

```tsx
import { eventTracker } from '@/services/analytics';

// Disable tracking
eventTracker.setTrackingEnabled(false);

// Check if tracking is enabled
const isEnabled = eventTracker.isEnabled();
```

## Backend Integration

### Required API Endpoints

The system expects these endpoints:

- `POST /api/v1/events/batch` - Batch event submission
- `POST /api/v1/feedback` - Feedback submission
- `PATCH /api/v1/feedback` - Feedback updates
- `POST /api/v1/feedback/friction` - Friction reporting
- `POST /api/v1/feedback/session` - Session feedback
- `POST /api/v1/help/bulk` - Bulk help content loading
- `GET /api/v1/help/search` - Help content search

### Event Data Structure

Events are sent in this format:

```json
{
  "events": [
    {
      "eventId": "uuid",
      "sessionId": "uuid",
      "timestamp": "2024-01-01T00:00:00.000Z",
      "eventType": "component_click",
      "agentName": "scene_agent",
      "durationMs": 1500,
      "context": {
        "component": "SceneGenerator",
        "url": "/projects/123",
        "projectId": 123,
        "userId": "user123"
      }
    }
  ]
}
```

## Testing

### Unit Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MicroFeedback } from '@/components/feedback';

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

```tsx
import { render, screen } from '@testing-library/react';
import { HelpProvider } from '@/components/help';
import { TestComponent } from './TestComponent';

describe('Help System Integration', () => {
  it('loads and displays help content', async () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );

    // Test help content loading and display
  });
});
```

## Performance Considerations

- Events are batched and sent every 30 seconds or when 10 events accumulate
- Help content is cached after first load
- Components use React.memo and useCallback for optimization
- Search results are debounced by 300ms
- Tooltips have a 500ms delay to prevent accidental triggers

## Accessibility

- All components are keyboard navigable
- Screen reader support with proper ARIA labels
- Focus management for modals and tooltips
- Color contrast meets WCAG 2.1 AA standards

## Examples

See `/src/components/examples/FeedbackHelpExample.tsx` for a complete integration example.

## Contributing

When adding new tracking events or help content:

1. Add appropriate TypeScript types
2. Update this README with new APIs
3. Add unit tests for new components
4. Test with real backend integration
5. Verify accessibility compliance