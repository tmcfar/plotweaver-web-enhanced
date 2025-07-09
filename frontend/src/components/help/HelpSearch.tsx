import React, { useState, useEffect } from 'react';
import { Search, X, FileText, BookOpen, HelpCircle } from 'lucide-react';
import { useHelpSearch } from './HelpProvider';
import { useTracking } from '@/hooks/useTracking';

interface HelpSearchProps {
  onResultClick?: (helpId: string) => void;
  placeholder?: string;
  className?: string;
}

export function HelpSearch({ 
  onResultClick, 
  placeholder = "Search help articles...",
  className = '' 
}: HelpSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const { search, results, query, clearResults, isLoading, error } = useHelpSearch();
  const { trackEvent } = useTracking('HelpSearch');

  useEffect(() => {
    if (searchInput.trim() === '') {
      clearResults();
      return;
    }

    const timeoutId = setTimeout(() => {
      search(searchInput);
      trackEvent('help_search_performed', {
        query: searchInput,
        queryLength: searchInput.length
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, search, clearResults, trackEvent]);

  const handleResultClick = (helpId: string) => {
    trackEvent('help_search_result_clicked', {
      helpId,
      query,
      position: results.findIndex(r => r.helpId === helpId)
    });
    
    onResultClick?.(helpId);
    setIsExpanded(false);
    setSearchInput('');
    clearResults();
  };

  const handleClear = () => {
    setSearchInput('');
    clearResults();
    setIsExpanded(false);
    
    trackEvent('help_search_cleared', { query });
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'tooltip':
        return <HelpCircle className="w-4 h-4" />;
      case 'guide':
        return <BookOpen className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      default:
        return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        />
        {searchInput && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isExpanded && (searchInput || results.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {isLoading && (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {error && (
            <div className="p-3 text-center text-red-500 text-sm">
              {error}
            </div>
          )}

          {!isLoading && !error && results.length === 0 && searchInput && (
            <div className="p-3 text-center text-gray-500 text-sm">
              No help articles found for "{searchInput}"
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <div className="py-1">
              {results.map((result) => (
                <button
                  key={result.helpId}
                  onClick={() => handleResultClick(result.helpId)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-500 mt-0.5 flex-shrink-0">
                      {getContentTypeIcon(result.contentType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {result.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {result.content}
                      </div>
                      {result.category && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          {result.category}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Overlay to close search when clicking outside */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export default HelpSearch;