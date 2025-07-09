export interface TrackedEvent {
  eventId: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  agentName?: string;
  durationMs?: number;
  context: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  startTime: string;
  projectId?: number;
  userId?: string;
}

export interface FeedbackData {
  feedbackType: 'micro' | 'friction' | 'session';
  contentType?: string;
  contentId?: string;
  projectId?: number;
  rating?: number;
  comment?: string;
  context?: Record<string, any>;
}