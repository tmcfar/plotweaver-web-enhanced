import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';
import { eventTracker, sessionManager } from '@/services/analytics';
import { useTracking } from '@/hooks/useTracking';

interface SessionFeedbackProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'manual' | 'auto' | 'save' | 'export';
  onComplete?: (submitted: boolean) => void;
  className?: string;
}

export function SessionFeedback({ 
  isOpen,
  onClose,
  trigger = 'auto', 
  onComplete,
  className = ''
}: SessionFeedbackProps) {
  const [satisfaction, setSatisfaction] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [challenge, setChallenge] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackEvent } = useTracking('SessionFeedback');

  useEffect(() => {
    if (isOpen) {
      trackEvent('session_feedback_opened', { trigger });
    }
  }, [isOpen, trigger, trackEvent]);

  const handleSubmit = async () => {
    if (satisfaction === 0 || nps === null || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const sessionId = sessionManager.getSessionId();
      const projectId = sessionManager.getProjectId();
      const sessionDuration = sessionManager.getSessionDuration();

      const feedbackData = {
        feedbackType: 'session' as const,
        projectId,
        context: {
          satisfaction,
          likelihoodToRecommend: nps,
          biggestChallenge: challenge.trim() || undefined,
          sessionDuration,
          trigger,
          sessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.pathname
        }
      };

      const response = await fetch('/api/v1/feedback/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      trackEvent('session_feedback_submitted', {
        satisfaction,
        nps,
        hasChallenge: !!challenge.trim(),
        sessionDuration,
        trigger
      });

      onComplete?.(true);
      onClose();
    } catch (error) {
      console.error('Failed to submit session feedback:', error);
      
      trackEvent('session_feedback_error', {
        satisfaction,
        nps,
        error: error?.message || 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    trackEvent('session_feedback_closed', {
      satisfaction,
      nps,
      hasChallenge: !!challenge.trim(),
      submitted: false
    });
    
    onComplete?.(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const canSubmit = satisfaction > 0 && nps !== null && !isSubmitting;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-300 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            How was your experience today?
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded"
            aria-label="Close feedback modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall satisfaction
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setSatisfaction(value)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                  aria-label={`Rate ${value} out of 5 stars`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      value <= satisfaction 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {satisfaction > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {satisfaction === 1 && 'Very dissatisfied'}
                {satisfaction === 2 && 'Dissatisfied'}
                {satisfaction === 3 && 'Neutral'}
                {satisfaction === 4 && 'Satisfied'}
                {satisfaction === 5 && 'Very satisfied'}
              </p>
            )}
          </div>

          {/* NPS Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How likely are you to recommend PlotWeaver to others?
            </label>
            <div className="grid grid-cols-11 gap-1 mb-2">
              {[...Array(11)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setNps(i)}
                  className={`px-1 py-2 rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    i === nps 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                  aria-label={`Rate ${i} out of 10 for likelihood to recommend`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>

          {/* Open Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What was your biggest challenge today? (optional)
            </label>
            <textarea
              value={challenge}
              onChange={(e) => setChallenge(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
              rows={3}
              placeholder="Tell us what could be better..."
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                {challenge.length}/500
              </span>
              {challenge.length > 0 && (
                <span className="text-xs text-gray-500">
                  Press Ctrl+Enter to submit
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
              disabled={isSubmitting}
            >
              Skip
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionFeedback;