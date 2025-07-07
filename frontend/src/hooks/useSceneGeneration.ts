/**
 * Hook for scene generation with real-time progress updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api, { SceneGenerationRequest, SceneGenerationResponse } from '../services/api';
import { getWebSocketService, ProgressUpdate } from '../services/websocket';

export interface SceneGenerationState {
  isGenerating: boolean;
  progress: ProgressUpdate | null;
  result: SceneGenerationResponse | null;
  error: string | null;
  dhSavings: number;
  estimatedCost: number;
}

export const useSceneGeneration = (projectId: string) => {
  const [state, setState] = useState<SceneGenerationState>({
    isGenerating: false,
    progress: null,
    result: null,
    error: null,
    dhSavings: 0,
    estimatedCost: 0,
  });

  const wsService = useRef(getWebSocketService());
  const currentTaskId = useRef<string | null>(null);

  useEffect(() => {
    const ws = wsService.current;
    
    // Connect WebSocket and subscribe to project
    ws.connect();
    ws.subscribeToProject(projectId);

    // Listen for progress updates
    const handleProgress = (update: ProgressUpdate) => {
      // Only handle updates for our current task
      if (update.task_id === currentTaskId.current) {
        setState(prev => ({
          ...prev,
          progress: update,
        }));

        // Handle completion
        if (update.status === 'completed' && update.data) {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            result: {
              success: true,
              content: update.data.content,
              metadata: {
                word_count: update.data.word_count,
                dh_enabled: update.data.dh_enabled,
                dh_savings: update.data.dh_savings,
              },
              cost_estimate: update.data.cost_estimate,
              dh_savings: update.data.dh_savings,
            },
            dhSavings: prev.dhSavings + (update.data.dh_savings || 0),
            estimatedCost: prev.estimatedCost + (update.data.cost_estimate || 0),
            error: null,
          }));
        }

        // Handle failure
        if (update.status === 'failed' || update.status === 'error') {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: update.message || 'Generation failed',
          }));
        }
      }
    };

    ws.on('agent_progress', handleProgress);

    // Cleanup
    return () => {
      ws.off('agent_progress', handleProgress);
      ws.unsubscribeFromProject(projectId);
    };
  }, [projectId]);

  const generateScene = useCallback(
    async (chapter: number, scene: number, context: Partial<SceneGenerationRequest>) => {
      setState(prev => ({
        ...prev,
        isGenerating: true,
        progress: null,
        result: null,
        error: null,
      }));

      try {
        const request: SceneGenerationRequest = {
          project_id: projectId,
          ...context,
        };

        const response = await api.generateScene(chapter, scene, request);

        if (response.success && response.task_id) {
          currentTaskId.current = response.task_id;
          
          // If we get immediate result (mock mode), update state
          if (response.content) {
            setState(prev => ({
              ...prev,
              isGenerating: false,
              result: response,
              dhSavings: prev.dhSavings + (response.dh_savings || 0),
              estimatedCost: prev.estimatedCost + (response.cost_estimate || 0),
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: response.error?.message || 'Generation failed',
          }));
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: error.message || 'Failed to generate scene',
        }));
      }
    },
    [projectId]
  );

  const generateChapter = useCallback(
    async (chapter: number, scenesCount: number, context: Partial<SceneGenerationRequest>) => {
      setState(prev => ({
        ...prev,
        isGenerating: true,
        progress: null,
        result: null,
        error: null,
      }));

      try {
        const response = await api.generateChapter(chapter, {
          project_id: projectId,
          scenes_count: scenesCount,
          ...context,
        });

        if (response.success) {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            dhSavings: prev.dhSavings + response.total_dh_savings,
            estimatedCost: prev.estimatedCost + 
              response.scenes.reduce((sum, s) => sum + (s.cost_estimate || 0), 0),
          }));
          
          return response;
        } else {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: 'Chapter generation failed',
          }));
        }
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: error.message || 'Failed to generate chapter',
        }));
      }
    },
    [projectId]
  );

  const checkGenerationStatus = useCallback(
    async (taskId: string) => {
      try {
        const status = await api.getGenerationStatus(taskId);
        return status;
      } catch (error) {
        console.error('Failed to check generation status:', error);
        return null;
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      progress: null,
      result: null,
      error: null,
      dhSavings: 0,
      estimatedCost: 0,
    });
    currentTaskId.current = null;
  }, []);

  return {
    ...state,
    generateScene,
    generateChapter,
    checkGenerationStatus,
    reset,
  };
};

export default useSceneGeneration;
