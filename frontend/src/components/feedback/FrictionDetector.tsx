import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { eventTracker, sessionManager } from '@/services/analytics';
import { useTracking } from '@/hooks/useTracking';

interface FrictionDetectorProps {
  contentType: string;
  contentId: string;
  regenerationCount: number;
  onReport?: (reported: boolean) => void;
  threshold?: number;
  className?: string;
}

export function FrictionDetector({ 
  contentType,
  contentId,
  regenerationCount,
  onReport,
  threshold = 3,
  className = ''
}: FrictionDetectorProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const { trackEvent } = useTracking('FrictionDetector');

  useEffect(() => {
    if (regenerationCount >= threshold && !showPrompt && !hasReported) {
      setShowPrompt(true);
      
      eventTracker.track('friction_detected', {
        contentType,
        contentId,
        regenerationCount,
        threshold,
        timestamp: new Date().toISOString()
      });

      trackEvent('friction_prompt_shown', {
        contentType,
        contentId,
        regenerationCount
      });
    }
  }, [regenerationCount, contentType, contentId, threshold, showPrompt, hasReported, trackEvent]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const projectId = sessionManager.getProjectId();
      const sessionId = sessionManager.getSessionId();

      const frictionData = {
        feedbackType: 'friction' as const,
        contentType,
        contentId,
        projectId,
        context: {
          regenerationCount,
          threshold,
          explanation: explanation.trim() || undefined,
          sessionId,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.pathname
        }
      };

      const response = await fetch('/api/v1/feedback/friction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId
        },
        body: JSON.stringify(frictionData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      trackEvent('friction_reported', {
        contentType,
        contentId,
        regenerationCount,
        hasExplanation: !!explanation.trim()
      });

      setHasReported(true);
      setShowPrompt(false);
      onReport?.(true);
      
      // Show success state briefly
      setTimeout(() => {
        setExplanation('');
      }, 1000);
    } catch (error) {
      console.error('Failed to report friction:', error);
      
      trackEvent('friction_report_error', {
        contentType,
        contentId,
        error: error?.message || 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setExplanation('');
    
    trackEvent('friction_prompt_dismissed', {
      contentType,
      contentId,
      regenerationCount
    });
    
    onReport?.(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleDismiss();
    }
  };

  if (!showPrompt || hasReported) return null;

  return (
    <div className={`fixed bottom-20 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-bottom-2 duration-300 z-50 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-yellow-900">Having trouble?</h4>
            <button
              onClick={handleDismiss}
              className="text-yellow-400 hover:text-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded"
              aria-label="Dismiss friction detector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm text-yellow-700 mb-3">
            We noticed you've regenerated this {contentType} {regenerationCount} times. 
            What's not working?
          </p>
          
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell us what could be improved..."
            className="w-full p-2 text-sm border border-yellow-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-colors resize-none"
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
          />
          
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-yellow-600">
              {explanation.length}/500
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1 text-yellow-700 text-sm hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded"
                disabled={isSubmitting}
              >
                Skip
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
              >
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </div>
          </div>
          
          {explanation.length > 0 && (
            <p className="text-xs text-yellow-600 mt-2">
              Press Ctrl+Enter to submit quickly
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FrictionDetector;