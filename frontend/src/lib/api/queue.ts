import { APIResponse } from '../../types/common';

export interface QueueItem {
  id: string;
  type: 'generation' | 'validation' | 'analysis';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  dependencies?: string[];
}

export interface QueueStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  paused: number;
}

export const fetchQueueItems = async (projectId: string): Promise<QueueItem[]> => {
  const response = await fetch(`/api/queue/${projectId}/items`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch queue items: ${response.statusText}`);
  }
  
  return response.json();
};

export const updateQueuePriority = async (
  projectId: string,
  itemId: string,
  priority: QueueItem['priority']
): Promise<APIResponse<void>> => {
  const response = await fetch(`/api/queue/${projectId}/items/${itemId}/priority`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ priority }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update queue priority: ${response.statusText}`);
  }
  
  return response.json();
};

export const pauseQueueItem = async (projectId: string, itemId: string): Promise<APIResponse<void>> => {
  const response = await fetch(`/api/queue/${projectId}/items/${itemId}/pause`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to pause queue item: ${response.statusText}`);
  }
  
  return response.json();
};

export const resumeQueueItem = async (projectId: string, itemId: string): Promise<APIResponse<void>> => {
  const response = await fetch(`/api/queue/${projectId}/items/${itemId}/resume`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to resume queue item: ${response.statusText}`);
  }
  
  return response.json();
};

export const reorderQueue = async (projectId: string, itemIds: string[]): Promise<APIResponse<void>> => {
  const response = await fetch(`/api/queue/${projectId}/reorder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ itemIds }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to reorder queue: ${response.statusText}`);
  }
  
  return response.json();
};

export const fetchQueueStats = async (projectId: string): Promise<QueueStats> => {
  const response = await fetch(`/api/queue/${projectId}/stats`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch queue stats: ${response.statusText}`);
  }
  
  return response.json();
};