import { useState, useEffect } from 'react';
import { AgentProgress } from '../types/sse';
import { sseManager } from '../lib/sse/SSEConnectionManager';

export function useAgentProgress(jobId: string) {
  const [progress, setProgress] = useState<AgentProgress | undefined>();
  const [connectionError, setConnectionError] = useState<boolean>(false);

  useEffect(() => {
    if (!jobId) return;

    sseManager.connect(jobId, {
      onOpen: () => {
        setConnectionError(false);
        console.log(`Progress tracking started for job ${jobId}`);
      },
      onMessage: (data: unknown) => {
        setProgress(data as AgentProgress);
      },
      onError: (error) => {
        console.error('SSE connection error:', error);
        setConnectionError(true);
      },
      onMaxReconnectAttemptsReached: () => {
        setConnectionError(true);
        console.error('Failed to reconnect to progress stream');
      },
      maxReconnectAttempts: 3
    });

    return () => {
      sseManager.disconnect(jobId);
    };
  }, [jobId]);

  return { progress, connectionError };
}