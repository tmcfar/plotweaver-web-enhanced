import { useEffect, useCallback } from 'react';
import { useWebSocket } from '../useWebSocket';

interface WorldbuildingProgress {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

interface UseWorldbuildingWebSocketProps {
  projectId: string;
  onProgress?: (progress: WorldbuildingProgress) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

export function useWorldbuildingWebSocket({
  projectId,
  onProgress,
  onComplete,
  onError
}: UseWorldbuildingWebSocketProps) {
  const { sendMessage, lastMessage, isConnected } = useWebSocket();

  // Subscribe to worldbuilding updates for this project
  useEffect(() => {
    if (isConnected && projectId) {
      sendMessage({
        channel: `subscribe:worldbuilding:${projectId}`,
        data: { projectId }
      });
    }
  }, [isConnected, projectId, sendMessage]);

  // Handle incoming messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const message = JSON.parse(lastMessage);
      
      // Handle worldbuilding-specific channels
      if (message.channel === `worldbuilding:progress:${projectId}`) {
        onProgress?.(message.data);
      } else if (message.channel === `worldbuilding:complete:${projectId}`) {
        onComplete?.(message.data);
      } else if (message.channel === `worldbuilding:error:${projectId}`) {
        onError?.(message.data.error);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [lastMessage, projectId, onProgress, onComplete, onError]);

  // Send worldbuilding-specific messages
  const sendWorldbuildingUpdate = useCallback((type: string, data: any) => {
    if (!isConnected) return;

    sendMessage({
      channel: `worldbuilding:${type}:${projectId}`,
      data: {
        projectId,
        ...data
      }
    });
  }, [isConnected, projectId, sendMessage]);

  return {
    isConnected,
    sendWorldbuildingUpdate
  };
}

// Hook for broadcasting setup progress to other users
export function useWorldbuildingBroadcast(projectId: string) {
  const { sendMessage, isConnected } = useWebSocket();

  const broadcastStepComplete = useCallback((stepId: string, stepData: any) => {
    if (!isConnected) return;

    sendMessage({
      channel: `worldbuilding:step-complete:${projectId}`,
      data: {
        stepId,
        stepData,
        timestamp: new Date().toISOString()
      }
    });
  }, [isConnected, projectId, sendMessage]);

  const broadcastAssumptionUpdate = useCallback((assumptionKey: string, newValue: string) => {
    if (!isConnected) return;

    sendMessage({
      channel: `worldbuilding:assumption-update:${projectId}`,
      data: {
        assumptionKey,
        newValue,
        timestamp: new Date().toISOString()
      }
    });
  }, [isConnected, projectId, sendMessage]);

  const broadcastSetupComplete = useCallback(() => {
    if (!isConnected) return;

    sendMessage({
      channel: `worldbuilding:setup-complete:${projectId}`,
      data: {
        timestamp: new Date().toISOString()
      }
    });
  }, [isConnected, projectId, sendMessage]);

  return {
    broadcastStepComplete,
    broadcastAssumptionUpdate,
    broadcastSetupComplete
  };
}
