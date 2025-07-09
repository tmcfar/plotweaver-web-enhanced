import React, { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, X } from 'lucide-react';
import { useHelpContent } from './HelpProvider';
import { useTracking } from '@/hooks/useTracking';

interface InlineGuideProps {
  helpId: string;
  title?: string;
  defaultExpanded?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function InlineGuide({ 
  helpId, 
  title,
  defaultExpanded = false,
  showIcon = true,
  className = ''
}: InlineGuideProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { content, isLoading, error } = useHelpContent(helpId);
  const { trackEvent } = useTracking('InlineGuide');

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    
    trackEvent('inline_guide_toggled', {
      helpId,
      expanded: newExpanded,
      hasContent: !!content
    });
  };

  const handleClose = () => {
    setIsExpanded(false);
    
    trackEvent('inline_guide_closed', {
      helpId
    });
  };

  const displayTitle = title || content?.title || 'Help Guide';

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
        <div className="text-red-700 text-sm">
          Failed to load help content
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-lg"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {showIcon && <BookOpen className="w-4 h-4 text-blue-600" />}
          <span className="font-medium text-blue-900">{displayTitle}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="p-1 hover:bg-blue-200 rounded transition-colors"
              aria-label="Close guide"
            >
              <X className="w-3 h-3 text-blue-600" />
            </button>
          )}
          
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-blue-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-blue-600" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-200 mt-2 pt-3 animate-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              Loading help content...
            </div>
          ) : content ? (
            <div className="prose prose-sm prose-blue max-w-none">
              <div 
                className="text-blue-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            </div>
          ) : (
            <div className="text-blue-600 text-sm">
              No help content available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InlineGuide;