import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { sessionManager } from '@/services/analytics';
import { useTracking } from '@/hooks/useTracking';
import { apiClient } from '@/services/api/client';

interface MicroFeedbackProps {
  contentType: string;
  contentId: string;
  context?: Record<string, any>;
  onFeedback?: (rating: number) => void;
  className?: string;
}

export function MicroFeedback({ 
  contentType, 
  contentId, 
  context,
  onFeedback,
  className = ''
}: MicroFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackEvent } = useTracking('MicroFeedback');

  const submitFeedback = async (newRating: number) => {
    if (isSubmitting || rating !== null) return;

    setIsSubmitting(true);
    setRating(newRating);

    try {
      const projectId = sessionManager.getProjectId();

      const feedbackData = {
        feedbackType: 'micro' as const,
        contentType,
        contentId,
        projectId,
        rating: newRating,
        comment: comment || undefined,
        context: {
          ...context,
          timestamp: new Date().toISOString()
        }
      };

      await apiClient.submitFeedback(feedbackData);

      trackEvent('feedback_submitted', {
        rating: newRating,
        contentType,
        contentId,
        hasComment: !!comment
      });

      toast.success('Thanks for your feedback!');
      onFeedback?.(newRating);
      
      if (newRating === -1) {
        setShowComment(true);
      } else {
        // Reset after positive feedback
        setTimeout(() => {
          setRating(null);
          setComment('');
          setShowComment(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
      setRating(null);
      
      trackEvent('feedback_error', {
        rating: newRating,
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim() || rating !== -1) return;

    setIsSubmitting(true);
    
    try {
      const projectId = sessionManager.getProjectId();

      const feedbackData = {
        feedbackType: 'micro' as const,
        contentType,
        contentId,
        projectId,
        rating: rating,
        comment: comment.trim(),
        context: {
          ...context,
          timestamp: new Date().toISOString()
        }
      };

      await apiClient.updateFeedback(feedbackData);

      trackEvent('feedback_comment_submitted', {
        contentType,
        contentId,
        commentLength: comment.length
      });

      toast.success('Thank you for the additional feedback!');
      
      setTimeout(() => {
        setRating(null);
        setComment('');
        setShowComment(false);
      }, 1500);
    } catch (error) {
      console.error('Failed to submit comment:', error);
      toast.error('Failed to submit comment. Please try again.');
      
      trackEvent('feedback_comment_error', {
        contentType,
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommentSubmit();
    } else if (e.key === 'Escape') {
      setShowComment(false);
      setComment('');
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => submitFeedback(1)}
        disabled={isSubmitting || rating !== null}
        className={`p-1 rounded transition-all duration-200 ${
          rating === 1 
            ? 'text-green-600 bg-green-50 scale-110 shadow-sm' 
            : 'text-gray-400 hover:text-green-600 hover:bg-green-50 hover:scale-105'
        } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1`}
        aria-label="Good - I like this content"
        title="Good"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      
      <button
        onClick={() => submitFeedback(-1)}
        disabled={isSubmitting || rating !== null}
        className={`p-1 rounded transition-all duration-200 ${
          rating === -1 
            ? 'text-red-600 bg-red-50 scale-110 shadow-sm' 
            : 'text-gray-400 hover:text-red-600 hover:bg-red-50 hover:scale-105'
        } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1`}
        aria-label="Bad - I don't like this content"
        title="Bad"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>

      {showComment && rating === -1 && (
        <div className="flex items-center gap-2 ml-2 animate-in slide-in-from-left-2 duration-300">
          <input
            type="text"
            placeholder="What went wrong? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            maxLength={100}
            autoFocus
            disabled={isSubmitting}
          />
          <button
            onClick={handleCommentSubmit}
            disabled={isSubmitting || !comment.trim()}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}
    </div>
  );
}

export default MicroFeedback;