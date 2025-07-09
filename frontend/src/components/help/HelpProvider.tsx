import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { eventTracker } from '@/services/analytics';

interface HelpContent {
  helpId: string;
  title: string;
  content: string;
  contentType: 'tooltip' | 'guide' | 'article';
  category?: string;
  tags?: string[];
  lastUpdated?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface HelpContextType {
  helpContent: Map<string, HelpContent>;
  loadHelp: (helpIds: string[]) => Promise<void>;
  searchHelp: (query: string) => Promise<HelpContent[]>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  preloadHelp: (helpIds: string[]) => void;
}

const HelpContext = createContext<HelpContextType | null>(null);

interface HelpProviderProps {
  children: React.ReactNode;
  apiBaseUrl?: string;
}

export function HelpProvider({ children, apiBaseUrl = '/api/v1/help' }: HelpProviderProps) {
  const [helpContent, setHelpContent] = useState(new Map<string, HelpContent>());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preloadQueue, setPreloadQueue] = useState<Set<string>>(new Set());

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadHelp = useCallback(async (helpIds: string[]) => {
    // Filter out already cached items
    const uncached = helpIds.filter(id => !helpContent.has(id));
    
    if (uncached.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      eventTracker.track('help_content_requested', {
        helpIds: uncached,
        requestedCount: uncached.length
      });

      const response = await fetch(`${apiBaseUrl}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helpIds: uncached })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: HelpContent[] = await response.json();
      
      setHelpContent(prev => {
        const next = new Map(prev);
        data.forEach((item: HelpContent) => {
          next.set(item.helpId, item);
        });
        return next;
      });

      eventTracker.track('help_content_loaded', {
        helpIds: uncached,
        loadedCount: data.length,
        success: true
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load help content';
      setError(errorMessage);
      
      eventTracker.track('help_content_error', {
        helpIds: uncached,
        error: errorMessage
      });
      
      console.error('Failed to load help content:', err);
    } finally {
      setIsLoading(false);
    }
  }, [helpContent, apiBaseUrl]);

  const searchHelp = useCallback(async (query: string): Promise<HelpContent[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);

    try {
      eventTracker.track('help_search_initiated', {
        query,
        queryLength: query.length
      });

      const response = await fetch(`${apiBaseUrl}/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const results: HelpContent[] = await response.json();
      
      // Cache the search results
      setHelpContent(prev => {
        const next = new Map(prev);
        results.forEach((item: HelpContent) => {
          next.set(item.helpId, item);
        });
        return next;
      });

      eventTracker.track('help_search_completed', {
        query,
        resultsCount: results.length,
        success: true
      });

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search help content';
      setError(errorMessage);
      
      eventTracker.track('help_search_error', {
        query,
        error: errorMessage
      });
      
      console.error('Failed to search help content:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiBaseUrl]);

  const preloadHelp = useCallback((helpIds: string[]) => {
    const newIds = helpIds.filter(id => !helpContent.has(id) && !preloadQueue.has(id));
    if (newIds.length === 0) return;

    setPreloadQueue(prev => {
      const next = new Set(prev);
      newIds.forEach(id => next.add(id));
      return next;
    });

    // Preload with a small delay to avoid blocking UI
    setTimeout(() => {
      loadHelp(newIds);
      setPreloadQueue(prev => {
        const next = new Set(prev);
        newIds.forEach(id => next.delete(id));
        return next;
      });
    }, 100);
  }, [helpContent, preloadQueue, loadHelp]);

  // Initialize with common help items
  useEffect(() => {
    const commonHelpIds = [
      'getting-started',
      'scene-generation',
      'character-creation',
      'project-management',
      'collaboration'
    ];
    
    preloadHelp(commonHelpIds);
  }, [preloadHelp]);

  const contextValue: HelpContextType = {
    helpContent,
    loadHelp,
    searchHelp,
    isLoading,
    error,
    clearError,
    preloadHelp
  };

  return (
    <HelpContext.Provider value={contextValue}>
      {children}
    </HelpContext.Provider>
  );
}

export const useHelp = () => {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within HelpProvider');
  }
  return context;
};

export const useHelpContent = (helpId: string) => {
  const { helpContent, loadHelp, isLoading, error } = useHelp();
  const content = helpContent.get(helpId);

  useEffect(() => {
    if (!content) {
      loadHelp([helpId]);
    }
  }, [helpId, content, loadHelp]);

  return {
    content,
    isLoading,
    error
  };
};

export const useHelpSearch = () => {
  const { searchHelp, isLoading, error } = useHelp();
  const [results, setResults] = useState<HelpContent[]>([]);
  const [query, setQuery] = useState('');

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    const searchResults = await searchHelp(searchQuery);
    setResults(searchResults);
  }, [searchHelp]);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
  }, []);

  return {
    search,
    results,
    query,
    clearResults,
    isLoading,
    error
  };
};

export default HelpProvider;