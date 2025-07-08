import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface GitWebSocketHook {
  isConnected: boolean;
}

export function useGitWebSocket(projectId: string): GitWebSocketHook {
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
      });
      
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
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    const token = 'development-token'; // TODO: Get from auth context
    
    const ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
    
    ws.onopen = () => {
      console.log('Git WebSocket connected for project:', projectId);
      
      // Subscribe to project updates
      ws.send(JSON.stringify({
        channel: `subscribe:${projectId}`,
        data: {}
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle git updates
        if (message.type === 'git_update' && message.project_id === projectId) {
          handleGitUpdate(message);
        }
        
        // Handle general broadcasts
        if (message.type === 'git_update' && !message.project_id) {
          handleGitUpdate(message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('Git WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('Git WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [projectId, handleGitUpdate]);

  return {
    isConnected: true // TODO: Track actual connection state
  };
}