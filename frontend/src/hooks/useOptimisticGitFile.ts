import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { gitApi, GitFileContent } from '@/lib/api/git';

interface OptimisticGitFileHook {
  content: string | undefined;
  isDirty: boolean;
  isLoading: boolean;
  error: Error | null;
  updateContent: (newContent: string) => void;
  resetContent: () => void;
  remoteContent: string | undefined;
  lastCommit?: GitFileContent['last_commit'];
}

export function useOptimisticGitFile(
  projectId: string, 
  path: string
): OptimisticGitFileHook {
  const queryClient = useQueryClient();
  const [localContent, setLocalContent] = useState<string | null>(null);
  
  const { 
    data: remoteData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['git', 'content', projectId, path],
    queryFn: () => gitApi.getContent(projectId, path),
    enabled: !!projectId && !!path,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
  
  const updateContent = useCallback((newContent: string) => {
    setLocalContent(newContent);
    
    // Optimistically update cache
    queryClient.setQueryData(
      ['git', 'content', projectId, path],
      (old: GitFileContent | undefined) => ({
        ...old,
        content: newContent,
        isDirty: true,
      } as GitFileContent)
    );
  }, [queryClient, projectId, path]);
  
  const resetContent = useCallback(() => {
    setLocalContent(null);
    
    // Reset cache to remote content
    if (remoteData) {
      queryClient.setQueryData(
        ['git', 'content', projectId, path],
        remoteData
      );
    }
  }, [queryClient, projectId, path, remoteData]);
  
  return {
    content: localContent ?? remoteData?.content,
    isDirty: localContent !== null,
    isLoading,
    error: error as Error | null,
    updateContent,
    resetContent,
    remoteContent: remoteData?.content,
    lastCommit: remoteData?.last_commit,
  };
}