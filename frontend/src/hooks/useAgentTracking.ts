import { useCallback, useRef } from 'react';
import { eventTracker } from '@/services/analytics';

export function useAgentTracking(agentName: string) {
  const activeOperations = useRef<Map<string, number>>(new Map());

  const trackGeneration = useCallback(async <T>(
    generationType: string, 
    callback: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    const operationId = `${agentName}-${generationType}-${Date.now()}`;
    const startTime = Date.now();
    
    activeOperations.current.set(operationId, startTime);
    
    eventTracker.trackAgent(agentName, 'generation_start', {
      generationType,
      operationId,
      ...context
    });

    let success = true;
    let error: any = null;
    let result: T;

    try {
      result = await callback();
      
      eventTracker.trackAgent(agentName, 'generation_success', {
        generationType,
        operationId,
        durationMs: Date.now() - startTime,
        ...context
      });
      
      return result;
    } catch (e) {
      success = false;
      error = e;
      
      eventTracker.trackAgent(agentName, 'generation_error', {
        generationType,
        operationId,
        durationMs: Date.now() - startTime,
        error: error?.message || 'Unknown error',
        errorStack: error?.stack,
        ...context
      });
      
      throw e;
    } finally {
      activeOperations.current.delete(operationId);
      
      eventTracker.trackAgent(agentName, 'generation_complete', {
        generationType,
        operationId,
        durationMs: Date.now() - startTime,
        success,
        error: error?.message,
        ...context
      });
    }
  }, [agentName]);

  const trackAgentInteraction = useCallback((
    interactionType: string, 
    context?: Record<string, any>
  ) => {
    eventTracker.trackAgent(agentName, 'agent_interaction', {
      interactionType,
      ...context
    });
  }, [agentName]);

  const trackAgentInput = useCallback((
    inputType: string,
    inputSize: number,
    context?: Record<string, any>
  ) => {
    eventTracker.trackAgent(agentName, 'agent_input', {
      inputType,
      inputSize,
      ...context
    });
  }, [agentName]);

  const trackAgentOutput = useCallback((
    outputType: string,
    outputSize: number,
    quality?: 'good' | 'bad' | 'neutral',
    context?: Record<string, any>
  ) => {
    eventTracker.trackAgent(agentName, 'agent_output', {
      outputType,
      outputSize,
      quality,
      ...context
    });
  }, [agentName]);

  const trackAgentFeedback = useCallback((
    feedbackType: 'positive' | 'negative' | 'neutral',
    rating?: number,
    comment?: string,
    context?: Record<string, any>
  ) => {
    eventTracker.trackAgent(agentName, 'agent_feedback', {
      feedbackType,
      rating,
      comment,
      ...context
    });
  }, [agentName]);

  const trackRegenerationAttempt = useCallback((
    reason: string,
    attemptNumber: number,
    context?: Record<string, any>
  ) => {
    eventTracker.trackAgent(agentName, 'regeneration_attempt', {
      reason,
      attemptNumber,
      ...context
    });
  }, [agentName]);

  const trackAgentConfiguration = useCallback((
    configType: string,
    configValue: any,
    context?: Record<string, any>
  ) => {
    eventTracker.trackAgent(agentName, 'agent_configuration', {
      configType,
      configValue,
      ...context
    });
  }, [agentName]);

  const getActiveOperations = useCallback(() => {
    return Array.from(activeOperations.current.entries()).map(([id, startTime]) => ({
      operationId: id,
      startTime,
      duration: Date.now() - startTime
    }));
  }, []);

  return {
    trackGeneration,
    trackAgentInteraction,
    trackAgentInput,
    trackAgentOutput,
    trackAgentFeedback,
    trackRegenerationAttempt,
    trackAgentConfiguration,
    getActiveOperations
  };
}

export function useGenerationTracking() {
  const trackBatchGeneration = useCallback(async <T>(
    agentNames: string[],
    generationType: string,
    callback: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> => {
    const batchId = `batch-${Date.now()}`;
    const startTime = Date.now();

    agentNames.forEach(agentName => {
      eventTracker.trackAgent(agentName, 'batch_generation_start', {
        batchId,
        generationType,
        batchSize: agentNames.length,
        ...context
      });
    });

    try {
      const result = await callback();
      
      agentNames.forEach(agentName => {
        eventTracker.trackAgent(agentName, 'batch_generation_success', {
          batchId,
          generationType,
          durationMs: Date.now() - startTime,
          ...context
        });
      });

      return result;
    } catch (error) {
      agentNames.forEach(agentName => {
        eventTracker.trackAgent(agentName, 'batch_generation_error', {
          batchId,
          generationType,
          durationMs: Date.now() - startTime,
          error: error?.message || 'Unknown error',
          ...context
        });
      });
      
      throw error;
    }
  }, []);

  return { trackBatchGeneration };
}