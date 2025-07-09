import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import GitWebSocketClient from '@/lib/git/GitWebSocketClient';
import { gitCache } from '@/lib/git/GitCache';

interface GitWebSocketHook {
  isConnected: boolean;
  client: GitWebSocketClient;
}

export function useGitWebSocket(projectId: string): GitWebSocketHook {
  const [client] = useState(() => new GitWebSocketClient());
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();

  const handleGitUpdate = useCallback((data: any) => {
    console.log('Git update received:', data);
    
    if (data.type === 'git_update') {
      // Invalidate affected queries
      queryClient.invalidateQueries(['git', 'tree', projectId]);
      
      // Invalidate specific file content queries for updated files
      data.updated_files?.forEach((path: string) => {
        queryClient.invalidateQueries(['git', 'content', projectId, path]);
        queryClient.invalidateQueries(['git', 'history', projectId, path]);
        
        // Invalidate cache for specific files
        gitCache.invalidate(projectId, 'file_content', path);
        gitCache.invalidate(projectId, 'file_history', path);
      });
      
      // Invalidate general caches that might be affected
      gitCache.invalidate(projectId, 'repository_status');
      gitCache.invalidate(projectId, 'project_branches');
      gitCache.invalidatePattern(`${projectId}:project_tree`);
      
      // Show notification
      const fileCount = data.updated_files?.length || 0;
      if (fileCount > 0) {
        toast.info(`Project updated: ${fileCount} file${fileCount === 1 ? '' : 's'} changed`);
      } else {
        toast.info('Project updated from git');
      }
    }
  }, [projectId, queryClient]);

  useEffect(() => {
    const token = localStorage.getItem('authToken') || 'development-token';
    
    if (projectId) {
      client.connect(projectId, token);
      setConnected(true);
      
      // Subscribe to git updates
      client.subscribe('git_update', handleGitUpdate);
      client.subscribe('file_changed', (data) => {
        queryClient.invalidateQueries(['git', 'content', projectId, data.file_path]);
        queryClient.invalidateQueries(['git', 'history', projectId, data.file_path]);
        
        // Invalidate cache for the specific file
        gitCache.invalidate(projectId, 'file_content', data.file_path);
        gitCache.invalidate(projectId, 'file_history', data.file_path);
      });
    }

    return () => {
      client.disconnect();
      setConnected(false);
    };
  }, [projectId, client, handleGitUpdate, queryClient]);

  return {
    isConnected: connected,
    client
  };
}